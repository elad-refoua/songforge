/**
 * Music Provider Interface & Factory
 *
 * Unified interface for different music generation providers.
 */

import { getElevenLabsProvider } from './elevenlabs';
import { getSunoProvider, hasSunoProvider } from './suno';
import { getServiceSupabase } from '@/lib/db/supabase';

export type MusicProviderType = 'elevenlabs' | 'suno';

export interface MusicGenerateParams {
  prompt: string;
  lyrics?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
  durationMs?: number;
}

export interface MusicProvider {
  generateSong(params: MusicGenerateParams): Promise<ArrayBuffer>;
}

/**
 * ElevenLabs adapter implementing MusicProvider interface
 */
class ElevenLabsAdapter implements MusicProvider {
  async generateSong(params: MusicGenerateParams): Promise<ArrayBuffer> {
    const provider = getElevenLabsProvider();
    return provider.generateSong({
      prompt: params.prompt + (params.lyrics ? `\n\nLyrics:\n${params.lyrics}` : ''),
      musicLengthMs: params.durationMs || 50000,
      forceInstrumental: params.instrumental || false,
    });
  }
}

/**
 * Suno adapter implementing MusicProvider interface
 */
class SunoAdapter implements MusicProvider {
  async generateSong(params: MusicGenerateParams): Promise<ArrayBuffer> {
    const provider = getSunoProvider();
    return provider.generateSong({
      prompt: params.prompt,
      lyrics: params.lyrics,
      style: params.style,
      title: params.title,
      instrumental: params.instrumental,
    });
  }
}

/**
 * Get the active music provider from database settings
 */
export async function getActiveMusicProviderType(): Promise<MusicProviderType> {
  try {
    const supabase = getServiceSupabase();
    const { data } = await (supabase.from('system_settings') as any)
      .select('value')
      .eq('key', 'music_provider')
      .maybeSingle();

    if (data?.value && (data.value === 'elevenlabs' || data.value === 'suno')) {
      return data.value;
    }
  } catch (error) {
    console.error('Failed to get music provider setting:', error);
  }

  // Default to suno if available (free), otherwise elevenlabs
  return hasSunoProvider() ? 'suno' : 'elevenlabs';
}

/**
 * Set the active music provider
 */
export async function setActiveMusicProviderType(provider: MusicProviderType): Promise<void> {
  const supabase = getServiceSupabase();
  await (supabase.from('system_settings') as any)
    .upsert({
      key: 'music_provider',
      value: provider,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'key',
    });
}

/**
 * Get the active music provider instance
 */
export async function getMusicProvider(): Promise<MusicProvider> {
  const providerType = await getActiveMusicProviderType();

  switch (providerType) {
    case 'suno':
      if (!hasSunoProvider()) {
        throw new Error('Suno API key is not configured');
      }
      return new SunoAdapter();
    case 'elevenlabs':
    default:
      return new ElevenLabsAdapter();
  }
}

/**
 * Get available providers based on configured API keys
 */
export function getAvailableProviders(): { id: MusicProviderType; name: string; configured: boolean }[] {
  return [
    {
      id: 'elevenlabs',
      name: 'ElevenLabs',
      configured: !!process.env.ELEVENLABS_API_KEY,
    },
    {
      id: 'suno',
      name: 'Suno (Free Trial)',
      configured: hasSunoProvider(),
    },
  ];
}
