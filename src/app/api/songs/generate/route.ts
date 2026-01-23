import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';
import { getElevenLabsProvider } from '@/lib/providers/elevenlabs';
import { getKitsAIProvider } from '@/lib/providers/kitsai';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { topic, language, purpose, importantNotes, genre, mood, tempo, lyrics, title, lyricsMode, voiceProfileId } = body;

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

    // If voice profile requested, validate it
    let voiceProfile: { kitsai_voice_id: string } | null = null;
    if (voiceProfileId) {
      const { data: vp } = await (supabase.from('voice_profiles') as any)
        .select('kitsai_voice_id')
        .eq('id', voiceProfileId)
        .eq('user_id', user.id)
        .eq('status', 'ready')
        .maybeSingle();

      if (!vp || !vp.kitsai_voice_id) {
        return NextResponse.json({ error: 'Voice profile not ready or not found' }, { status: 400 });
      }
      voiceProfile = vp;
    }

    // Fetch active song prompt from database
    let songPromptTemplate = '';
    const { data: activePrompt, error: promptError } = await (supabase.from('system_prompts') as any)
      .select('content')
      .eq('type', 'song')
      .eq('is_active', true)
      .maybeSingle();

    if (promptError) {
      console.error('Failed to fetch active song prompt:', promptError);
    }
    if (activePrompt) {
      songPromptTemplate = activePrompt.content;
    }

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
        voice_mode: voiceProfile ? 'single' : 'ai_default',
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
        musicLengthMs: 50000,
        forceInstrumental: !lyrics && lyricsMode !== 'ai',
      });

      let finalAudio: ArrayBuffer = audioBuffer;

      // If voice profile selected, convert vocals with Kits.AI
      if (voiceProfile) {
        await (supabase.from('songs') as any)
          .update({ status: 'converting_voice' })
          .eq('id', song.id);

        try {
          const kitsai = getKitsAIProvider();
          finalAudio = await kitsai.convertVocals({
            audio: audioBuffer,
            voiceId: voiceProfile.kitsai_voice_id,
          });
        } catch (voiceError: any) {
          console.error('Voice conversion error:', voiceError);
          // Fall back to original audio if voice conversion fails
          finalAudio = audioBuffer;
        }
      }

      // Convert to base64 for storage
      const base64Audio = Buffer.from(finalAudio).toString('base64');
      const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;

      // Update song record with audio
      await (supabase.from('songs') as any)
        .update({
          status: 'completed',
          audio_url: audioDataUrl,
          duration_seconds: 50,
        })
        .eq('id', song.id);

      // Save voice assignment if voice was used
      if (voiceProfileId) {
        await (supabase.from('song_voice_assignments') as any)
          .insert({
            song_id: song.id,
            voice_profile_id: voiceProfileId,
            section_type: 'all',
            layer: 'lead',
          });
      }

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

      console.error('Song generation error:', genError);
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
