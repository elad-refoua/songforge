import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getServiceSupabase();

  // Get user ID
  const { data: user } = await (supabase.from('users') as any)
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!user) {
    return NextResponse.json({ songsCount: 0, completedCount: 0, recentSongs: [] });
  }

  const [songsResult, completedResult, recentResult] = await Promise.all([
    (supabase.from('songs') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    (supabase.from('songs') as any)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed'),
    (supabase.from('songs') as any)
      .select('id, title, genre, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  return NextResponse.json({
    songsCount: songsResult.count || 0,
    completedCount: completedResult.count || 0,
    recentSongs: recentResult.data || [],
  });
}
