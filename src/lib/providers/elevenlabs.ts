/**
 * ElevenLabs Eleven Music API Wrapper
 *
 * Handles music generation and stem extraction for the hybrid pipeline.
 *
 * API Documentation: https://elevenlabs.io/docs/api-reference/music/compose
 */

import type { ElevenLabsGenerateParams, ElevenLabsStems } from '@/types';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

export class ElevenLabsProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('ElevenLabs API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Generate a song using ElevenLabs Eleven Music
   *
   * @param params - Generation parameters
   * @returns ArrayBuffer of the generated audio (MP3)
   */
  async generateSong(params: ElevenLabsGenerateParams): Promise<ArrayBuffer> {
    const {
      prompt,
      compositionPlan,
      musicLengthMs = 60000, // Default 1 minute
      forceInstrumental = false,
      outputFormat = 'mp3_44100_128',
    } = params;

    if (!prompt && !compositionPlan) {
      throw new Error('Either prompt or compositionPlan is required');
    }

    const body: Record<string, unknown> = {
      model_id: 'music_v1',
    };

    if (prompt) {
      body.prompt = prompt;
      body.music_length_ms = musicLengthMs;
      body.force_instrumental = forceInstrumental;
    } else if (compositionPlan) {
      body.composition_plan = compositionPlan;
    }

    const response = await fetch(
      `${ELEVENLABS_API_URL}/music?output_format=${outputFormat}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    return response.arrayBuffer();
  }

  /**
   * Generate a song and get the composition plan details
   *
   * @param params - Generation parameters
   * @returns Object with audio and composition plan details
   */
  async generateSongDetailed(params: ElevenLabsGenerateParams): Promise<{
    audio: ArrayBuffer;
    compositionPlan: ElevenLabsGenerateParams['compositionPlan'];
    filename: string;
  }> {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/music/detailed`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          model_id: 'music_v1',
          prompt: params.prompt,
          music_length_ms: params.musicLengthMs || 60000,
          force_instrumental: params.forceInstrumental || false,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Fetch the audio from the provided URL
    const audioResponse = await fetch(data.audio_url);
    const audio = await audioResponse.arrayBuffer();

    return {
      audio,
      compositionPlan: data.composition_plan,
      filename: data.filename,
    };
  }

  /**
   * Create a composition plan from a prompt
   * Useful for editing/refining before generation
   *
   * @param prompt - Text description of the desired song
   * @param musicLengthMs - Desired length in milliseconds
   */
  async createCompositionPlan(
    prompt: string,
    musicLengthMs: number = 60000
  ): Promise<ElevenLabsGenerateParams['compositionPlan']> {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/music/composition-plan`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          prompt,
          music_length_ms: musicLengthMs,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Extract stems (vocals and instrumental) from a generated song
   *
   * Note: This is a premium feature and costs additional credits
   *
   * @param audioUrl - URL of the audio file to extract stems from
   * @param stemType - '2stems' (vocals/instrumental) or '4stems' (full separation)
   */
  async extractStems(
    audioUrl: string,
    stemType: '2stems' | '4stems' = '2stems'
  ): Promise<ElevenLabsStems> {
    // First, download the audio
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // Create form data for the stem separation request
    const formData = new FormData();
    formData.append('audio', audioBlob, 'song.mp3');
    formData.append('stem_type', stemType);

    const response = await fetch(
      `${ELEVENLABS_API_URL}/audio/stems`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': this.apiKey,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs stems API error: ${response.status} - ${errorText}`);
    }

    // The API returns a zip file with the stems
    const zipBuffer = await response.arrayBuffer();

    // Parse the zip file to extract vocals and instrumental
    // Note: In production, use a library like 'jszip' to parse
    // For now, we'll return placeholders
    // TODO: Implement proper zip parsing

    return {
      vocals: zipBuffer, // Should be extracted from zip
      instrumental: zipBuffer, // Should be extracted from zip
    };
  }

  /**
   * Stream music generation (for real-time progress updates)
   *
   * @param params - Generation parameters
   * @param onChunk - Callback for each audio chunk
   */
  async streamSong(
    params: ElevenLabsGenerateParams,
    onChunk: (chunk: Uint8Array) => void
  ): Promise<void> {
    const response = await fetch(
      `${ELEVENLABS_API_URL}/music/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          model_id: 'music_v1',
          prompt: params.prompt,
          music_length_ms: params.musicLengthMs || 60000,
          force_instrumental: params.forceInstrumental || false,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs stream API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(value);
    }
  }
}

// Singleton instance
let instance: ElevenLabsProvider | null = null;

export function getElevenLabsProvider(): ElevenLabsProvider {
  if (!instance) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    instance = new ElevenLabsProvider(apiKey);
  }
  return instance;
}
