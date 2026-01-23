import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';

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
    return NextResponse.json({ songs: [] });
  }

  const { data: songs, error } = await (supabase.from('songs') as any)
    .select('id, title, lyrics, status, audio_url, genre, mood, language, prompt, duration_seconds, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch songs:', error);
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 });
  }

  return NextResponse.json({ songs: songs || [] });
}
