import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getServiceSupabase } from '@/lib/db/supabase';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const { name, content, temperature } = await req.json();

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const updateData: any = { content };
  if (name) updateData.name = name;
  if (temperature !== undefined) updateData.temperature = temperature;

  const { data, error } = await (supabase.from('system_prompts') as any)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompt: data });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const supabase = getServiceSupabase();

  const { error } = await (supabase.from('system_prompts') as any)
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
