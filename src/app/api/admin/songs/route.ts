import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getServiceSupabase } from '@/lib/db/supabase';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const status = searchParams.get('status') || '';
  const offset = (page - 1) * pageSize;

  const supabase = getServiceSupabase();

  let query = (supabase.from('songs') as any)
    .select('id, title, user_id, status, genre, mood, language, duration_seconds, cost_credits, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data: songs, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user emails for songs
  const userIds = [...new Set((songs || []).map((s: any) => s.user_id))];
  let userMap: Record<string, { email: string; name: string | null }> = {};

  if (userIds.length > 0) {
    const { data: users } = await (supabase.from('users') as any)
      .select('id, email, name')
      .in('id', userIds);

    if (users) {
      userMap = users.reduce((acc: any, u: any) => {
        acc[u.id] = { email: u.email, name: u.name };
        return acc;
      }, {});
    }
  }

  const songsWithUsers = (songs || []).map((s: any) => ({
    id: s.id,
    title: s.title,
    userEmail: userMap[s.user_id]?.email || 'Unknown',
    userName: userMap[s.user_id]?.name || null,
    status: s.status,
    genre: s.genre,
    mood: s.mood,
    language: s.language,
    durationSeconds: s.duration_seconds,
    costCredits: s.cost_credits,
    createdAt: s.created_at,
  }));

  return NextResponse.json({
    songs: songsWithUsers,
    total: count || 0,
    page,
    pageSize,
  });
}
