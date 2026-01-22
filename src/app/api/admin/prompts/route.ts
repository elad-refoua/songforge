import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isAdmin } from '@/lib/admin';
import { getServiceSupabase } from '@/lib/db/supabase';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await (supabase.from('system_prompts') as any)
    .select('*')
    .order('type')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompts: data });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !isAdmin(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type, name, content, temperature } = await req.json();

  if (!type || !name || !content) {
    return NextResponse.json({ error: 'type, name, and content are required' }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  const { data, error } = await (supabase.from('system_prompts') as any)
    .insert({
      type,
      name,
      content,
      temperature: temperature ?? 0.8,
      is_active: false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ prompt: data });
}
