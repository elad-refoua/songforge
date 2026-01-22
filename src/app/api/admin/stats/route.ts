import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getServiceSupabase } from '@/lib/db/supabase';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getServiceSupabase();

  const [usersResult, songsResult, creditsResult, activeResult, recentResult] = await Promise.all([
    (supabase.from('users') as any).select('id', { count: 'exact', head: true }),
    (supabase.from('songs') as any).select('id', { count: 'exact', head: true }),
    (supabase.from('credit_transactions') as any)
      .select('amount')
      .lt('amount', 0),
    (supabase.from('songs') as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'generating'),
    (supabase.from('credit_transactions') as any)
      .select('id, user_id, amount, balance_after, type, description, created_at')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const totalCreditsUsed = creditsResult.data
    ? creditsResult.data.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0)
    : 0;

  return NextResponse.json({
    totalUsers: usersResult.count || 0,
    totalSongs: songsResult.count || 0,
    totalCreditsUsed,
    activeSongs: activeResult.count || 0,
    recentTransactions: recentResult.data || [],
  });
}
