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
  const supabase = getServiceSupabase();

  // Get the prompt to find its type
  const { data: prompt, error: fetchError } = await (supabase.from('system_prompts') as any)
    .select('type')
    .eq('id', id)
    .single();

  if (fetchError || !prompt) {
    return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
  }

  // Deactivate all prompts of the same type
  await (supabase.from('system_prompts') as any)
    .update({ is_active: false })
    .eq('type', prompt.type);

  // Activate the selected prompt
  const { data, error } = await (supabase.from('system_prompts') as any)
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompt: data });
}
