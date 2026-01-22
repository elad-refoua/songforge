import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getServiceSupabase } from '@/lib/db/supabase';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { amount, description } = await req.json();

  if (!amount || typeof amount !== 'number') {
    return NextResponse.json({ error: 'Amount is required and must be a number' }, { status: 400 });
  }

  if (!description || typeof description !== 'string') {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();

  // Get current user balance
  const { data: user, error: userError } = await (supabase.from('users') as any)
    .select('id, credits_balance')
    .eq('id', id)
    .single();

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const newBalance = user.credits_balance + amount;

  if (newBalance < 0) {
    return NextResponse.json({ error: 'Cannot reduce balance below 0' }, { status: 400 });
  }

  // Update balance
  const { error: updateError } = await (supabase.from('users') as any)
    .update({ credits_balance: newBalance })
    .eq('id', id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Log transaction
  await (supabase.from('credit_transactions') as any)
    .insert({
      user_id: id,
      amount,
      balance_after: newBalance,
      type: amount > 0 ? 'bonus' : 'expiry',
      description: `[Admin] ${description}`,
    });

  return NextResponse.json({
    userId: id,
    previousBalance: user.credits_balance,
    newBalance,
    amount,
  });
}
