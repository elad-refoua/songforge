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
  const search = searchParams.get('search') || '';
  const offset = (page - 1) * pageSize;

  const supabase = getServiceSupabase();

  // Get users with pagination
  let query = (supabase.from('users') as any)
    .select('id, email, name, avatar_url, credits_balance, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (search) {
    query = query.ilike('email', `%${search}%`);
  }

  const { data: users, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get song counts for each user
  const userIds = (users || []).map((u: any) => u.id);
  let songCounts: Record<string, number> = {};

  if (userIds.length > 0) {
    const { data: songs } = await (supabase.from('songs') as any)
      .select('user_id')
      .in('user_id', userIds);

    if (songs) {
      songCounts = songs.reduce((acc: Record<string, number>, s: any) => {
        acc[s.user_id] = (acc[s.user_id] || 0) + 1;
        return acc;
      }, {});
    }
  }

  const usersWithCounts = (users || []).map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatar_url,
    creditsBalance: u.credits_balance,
    songCount: songCounts[u.id] || 0,
    createdAt: u.created_at,
  }));

  return NextResponse.json({
    users: usersWithCounts,
    total: count || 0,
    page,
    pageSize,
  });
}
