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

  const [usersResult, songsResult, allTransactions, activeResult, recentResult, allBalances, completedSongs, failedSongs] = await Promise.all([
    (supabase.from('users') as any).select('id', { count: 'exact', head: true }),
    (supabase.from('songs') as any).select('id', { count: 'exact', head: true }),
    (supabase.from('credit_transactions') as any)
      .select('amount, type, created_at'),
    (supabase.from('songs') as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'generating'),
    (supabase.from('credit_transactions') as any)
      .select('id, user_id, amount, balance_after, type, description, created_at')
      .order('created_at', { ascending: false })
      .limit(15),
    (supabase.from('users') as any)
      .select('credits_balance'),
    (supabase.from('songs') as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    (supabase.from('songs') as any)
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
  ]);

  // Calculate credit breakdown
  const transactions = allTransactions.data || [];
  const creditsGranted = transactions
    .filter((t: any) => t.amount > 0)
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const creditsUsed = transactions
    .filter((t: any) => t.amount < 0)
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);
  const totalRemainingCredits = (allBalances.data || [])
    .reduce((sum: number, u: any) => sum + u.credits_balance, 0);

  // Transaction type breakdown
  const byType: Record<string, { count: number; total: number }> = {};
  for (const t of transactions) {
    const type = t.type || 'unknown';
    if (!byType[type]) byType[type] = { count: 0, total: 0 };
    byType[type].count++;
    byType[type].total += t.amount;
  }

  return NextResponse.json({
    totalUsers: usersResult.count || 0,
    totalSongs: songsResult.count || 0,
    completedSongs: completedSongs.count || 0,
    failedSongs: failedSongs.count || 0,
    activeSongs: activeResult.count || 0,
    credits: {
      granted: creditsGranted,
      used: creditsUsed,
      remaining: totalRemainingCredits,
      byType,
    },
    recentTransactions: recentResult.data || [],
  });
}
