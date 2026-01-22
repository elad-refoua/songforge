import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';
import { getElevenLabsProvider } from '@/lib/providers/elevenlabs';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topic, language, purpose, importantNotes, genre, mood, tempo, lyrics, title, lyricsMode } = body;

    if (!topic || !genre) {
      return NextResponse.json({ error: 'Topic and genre are required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get user and check credits
    const { data: user } = await (supabase.from('users') as any)
      .select('id, credits_balance')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.credits_balance <= 0) {
      return NextResponse.json({ error: 'No credits remaining' }, { status: 402 });
    }

    // Fetch active song prompt from database
    let songPromptTemplate = '';
    try {
      const { data: activePrompt } = await (supabase.from('system_prompts') as any)
        .select('content')
        .eq('type', 'song')
        .eq('is_active', true)
        .single();
      if (activePrompt) {
        songPromptTemplate = activePrompt.content;
      }
    } catch {}

    // Build the prompt for ElevenLabs
    let fullPrompt: string;
    const languageContext = language !== 'english' ? `in ${language}` : '';
    const tempoContext = tempo === 'slow' ? 'at a slow tempo' : tempo === 'fast' ? 'at a fast tempo' : '';
    const notesContext = importantNotes ? `incorporating: ${importantNotes}` : '';

    if (songPromptTemplate) {
      fullPrompt = songPromptTemplate
        .replace(/\{\{mood\}\}/g, mood || '')
        .replace(/\{\{genre\}\}/g, genre || '')
        .replace(/\{\{topic\}\}/g, topic || '')
        .replace(/\{\{languageContext\}\}/g, languageContext)
        .replace(/\{\{tempoContext\}\}/g, tempoContext)
        .replace(/\{\{notesContext\}\}/g, notesContext);
    } else {
      const promptParts = [
        `A ${mood} ${genre} song`,
        `about ${topic}`,
        languageContext,
        tempoContext,
        notesContext,
      ].filter(Boolean);
      fullPrompt = promptParts.join(', ');
    }

    if (lyrics) {
      fullPrompt += `\n\nLyrics:\n${lyrics}`;
    }

    // Create song record in database
    const songTitle = title || `${genre} ${mood} song`;
    const { data: song, error: songError } = await (supabase.from('songs') as any)
      .insert({
        user_id: user.id,
        title: songTitle,
        lyrics: lyrics || null,
        status: 'generating',
        prompt: fullPrompt,
        genre: genre,
        mood: mood,
        language: language,
      })
      .select('id')
      .single();

    if (songError) {
      console.error('Error creating song record:', songError);
      return NextResponse.json({ error: 'Failed to create song record' }, { status: 500 });
    }

    // Generate song with ElevenLabs
    try {
      const elevenlabs = getElevenLabsProvider();
      const audioBuffer = await elevenlabs.generateSong({
        prompt: fullPrompt,
        musicLengthMs: 50000, // ~50 seconds
        forceInstrumental: !lyrics && lyricsMode !== 'ai',
      });

      // Convert to base64 for storage (in production, upload to R2/S3)
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

      // Update song record with audio
      await (supabase.from('songs') as any)
        .update({
          status: 'completed',
          audio_url: audioDataUrl,
          duration_seconds: 50,
        })
        .eq('id', song.id);

      // Deduct credit
      await (supabase.from('users') as any)
        .update({ credits_balance: user.credits_balance - 1 })
        .eq('id', user.id);

      // Log credit transaction
      await (supabase.from('credit_transactions') as any)
        .insert({
          user_id: user.id,
          amount: -1,
          balance_after: user.credits_balance - 1,
          type: 'usage',
          description: `Song generation: ${songTitle}`,
        });

      return NextResponse.json({ songId: song.id, status: 'completed' });
    } catch (genError: any) {
      // Update song status to failed
      await (supabase.from('songs') as any)
        .update({ status: 'failed' })
        .eq('id', song.id);

      console.error('ElevenLabs generation error:', genError);
      return NextResponse.json(
        { error: `Song generation failed: ${genError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Song generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
