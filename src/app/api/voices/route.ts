import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';
import { getKitsAIProvider } from '@/lib/providers/kitsai';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  const { data: user } = await (supabase.from('users') as any)
    .select('id')
    .eq('email', session.user.email)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ voices: [] });
  }

  const { data: voices, error } = await (supabase.from('voice_profiles') as any)
    .select('id, name, kitsai_voice_id, sample_audio_url, status, is_default, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch voices:', error);
    return NextResponse.json({ error: 'Failed to fetch voices' }, { status: 500 });
  }

  return NextResponse.json({ voices: voices || [] });
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string;
    const audioFile = formData.get('audio') as File;

    if (!name || !audioFile) {
      return NextResponse.json({ error: 'Name and audio file are required' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get user
    const { data: user } = await (supabase.from('users') as any)
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store audio as base64 data URL (future: use R2/S3)
    const audioBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');
    const mimeType = audioFile.type || 'audio/mpeg';
    const sampleAudioUrl = `data:${mimeType};base64,${base64Audio}`;

    // Clone voice with Kits.AI
    let kitsaiVoiceId: string | null = null;
    let status: string = 'pending';

    try {
      const kitsai = getKitsAIProvider();
      const result = await kitsai.cloneVoice(audioBuffer, name);
      kitsaiVoiceId = result.voiceId;
      status = result.status === 'ready' ? 'ready' : 'processing';
    } catch (err: any) {
      console.error('Kits.AI clone error:', err.message);
      // If Kits.AI is not configured, still save the voice profile for later
      if (err.message.includes('KITSAI_API_KEY')) {
        status = 'pending';
      } else {
        status = 'failed';
      }
    }

    // Create voice profile in database
    const { data: voice, error } = await (supabase.from('voice_profiles') as any)
      .insert({
        user_id: user.id,
        name,
        kitsai_voice_id: kitsaiVoiceId,
        sample_audio_url: sampleAudioUrl,
        status,
        is_default: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create voice profile:', error);
      return NextResponse.json({ error: 'Failed to create voice profile' }, { status: 500 });
    }

    return NextResponse.json({ voice });
  } catch (error: any) {
    console.error('Voice upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload voice' }, { status: 500 });
  }
}
