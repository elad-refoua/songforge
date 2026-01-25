import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getServiceSupabase } from '@/lib/db/supabase';
import { isAdmin } from '@/lib/admin';
import { getAvailableProviders, setActiveMusicProviderType, type MusicProviderType } from '@/lib/providers/music';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();

    // Get current music provider setting
    const { data: providerSetting } = await (supabase.from('system_settings') as any)
      .select('value')
      .eq('key', 'music_provider')
      .maybeSingle();

    // Get available providers
    const availableProviders = getAvailableProviders();

    // Default to suno if available
    const currentProvider = providerSetting?.value ||
      (availableProviders.find(p => p.id === 'suno' && p.configured) ? 'suno' : 'elevenlabs');

    return NextResponse.json({
      musicProvider: currentProvider,
      availableProviders,
    });
  } catch (error: any) {
    console.error('Failed to get settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isAdmin(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { musicProvider } = body;

    if (musicProvider && (musicProvider === 'elevenlabs' || musicProvider === 'suno')) {
      await setActiveMusicProviderType(musicProvider as MusicProviderType);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
