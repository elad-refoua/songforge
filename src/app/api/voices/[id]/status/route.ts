import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';
import { getKitsAIProvider } from '@/lib/providers/kitsai';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Get voice profile
  const { data: voice } = await (supabase.from('voice_profiles') as any)
    .select('id, kitsai_voice_id, status, user_id')
    .eq('id', id)
    .single();

  if (!voice) {
    return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
  }

  // If already ready or failed, return current status
  if (voice.status === 'ready' || voice.status === 'failed') {
    return NextResponse.json({ status: voice.status });
  }

  // If processing and has kitsai_voice_id, check with Kits.AI
  if (voice.kitsai_voice_id) {
    try {
      const kitsai = getKitsAIProvider();
      const result = await kitsai.getVoiceStatus(voice.kitsai_voice_id);

      const newStatus = result.status === 'ready' ? 'ready' : result.status === 'failed' ? 'failed' : 'processing';

      // Update database if status changed
      if (newStatus !== voice.status) {
        await (supabase.from('voice_profiles') as any)
          .update({ status: newStatus })
          .eq('id', id);
      }

      return NextResponse.json({ status: newStatus });
    } catch (err: any) {
      console.error('Kits.AI status check error:', err.message);
      return NextResponse.json({ status: voice.status });
    }
  }

  return NextResponse.json({ status: voice.status });
}
