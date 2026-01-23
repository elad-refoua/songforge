import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';
import { getKitsAIProvider } from '@/lib/providers/kitsai';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  // Get voice profile to verify ownership
  const { data: voice } = await (supabase.from('voice_profiles') as any)
    .select('user_id, kitsai_voice_id')
    .eq('id', id)
    .single();

  if (!voice) {
    return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
  }

  // Verify user owns this voice
  const { data: user } = await (supabase.from('users') as any)
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!user || voice.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Delete from Kits.AI if exists
  if (voice.kitsai_voice_id) {
    try {
      const kitsai = getKitsAIProvider();
      await kitsai.deleteVoice(voice.kitsai_voice_id);
    } catch (err: any) {
      console.error('Kits.AI delete error:', err.message);
    }
  }

  // Delete from database
  const { error } = await (supabase.from('voice_profiles') as any)
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { is_default } = await req.json();
  const supabase = getServiceSupabase();

  // Get user
  const { data: user } = await (supabase.from('users') as any)
    .select('id')
    .eq('email', session.user.email)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (is_default) {
    // Unset all other defaults for this user
    await (supabase.from('voice_profiles') as any)
      .update({ is_default: false })
      .eq('user_id', user.id);
  }

  // Update this voice
  const { data, error } = await (supabase.from('voice_profiles') as any)
    .update({ is_default: !!is_default })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ voice: data });
}
