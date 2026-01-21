/**
 * Kits.AI API Wrapper
 *
 * Handles voice cloning and vocal conversion for the hybrid pipeline.
 *
 * Website: https://www.kits.ai/
 * API: https://www.kits.ai/api
 */

import type { KitsAIVoiceCloneResult, KitsAIConversionParams } from '@/types';

const KITSAI_API_URL = 'https://arpeggi.io/api/kits/v1';

export class KitsAIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Kits.AI API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Clone a voice from an audio sample
   *
   * @param audioSample - Audio file (30-60 seconds of clean vocals)
   * @param name - Name for the voice profile
   * @returns Voice clone result with voice ID
   */
  async cloneVoice(
    audioSample: ArrayBuffer | Blob,
    name: string
  ): Promise<KitsAIVoiceCloneResult> {
    const formData = new FormData();

    if (audioSample instanceof Blob) {
      formData.append('soundFile', audioSample, 'voice_sample.mp3');
    } else {
      const blob = new Blob([audioSample], { type: 'audio/mpeg' });
      formData.append('soundFile', blob, 'voice_sample.mp3');
    }

    formData.append('title', name);

    const response = await fetch(`${KITSAI_API_URL}/voice-models`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kits.AI clone API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      voiceId: data.id,
      name: data.title,
      status: data.status === 'trained' ? 'ready' : 'processing',
    };
  }

  /**
   * Get the status of a voice clone
   *
   * @param voiceId - The voice model ID
   */
  async getVoiceStatus(voiceId: string): Promise<KitsAIVoiceCloneResult> {
    const response = await fetch(`${KITSAI_API_URL}/voice-models/${voiceId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kits.AI status API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      voiceId: data.id,
      name: data.title,
      status: data.status === 'trained' ? 'ready' : data.status === 'failed' ? 'failed' : 'processing',
    };
  }

  /**
   * List all voice models for the account
   */
  async listVoices(): Promise<KitsAIVoiceCloneResult[]> {
    const response = await fetch(`${KITSAI_API_URL}/voice-models`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kits.AI list API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return data.map((voice: { id: string; title: string; status: string }) => ({
      voiceId: voice.id,
      name: voice.title,
      status: voice.status === 'trained' ? 'ready' : voice.status === 'failed' ? 'failed' : 'processing',
    }));
  }

  /**
   * Delete a voice model
   *
   * @param voiceId - The voice model ID to delete
   */
  async deleteVoice(voiceId: string): Promise<void> {
    const response = await fetch(`${KITSAI_API_URL}/voice-models/${voiceId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kits.AI delete API error: ${response.status} - ${errorText}`);
    }
  }

  /**
   * Convert vocals to a cloned voice
   *
   * This is the core function for the hybrid pipeline - takes AI-generated vocals
   * and converts them to the user's cloned voice.
   *
   * @param params - Conversion parameters
   * @returns ArrayBuffer of the converted audio
   */
  async convertVocals(params: KitsAIConversionParams): Promise<ArrayBuffer> {
    const { audio, voiceId, pitchShift = 0 } = params;

    const formData = new FormData();

    const blob = audio instanceof Blob ? audio : new Blob([audio], { type: 'audio/mpeg' });
    formData.append('soundFile', blob, 'vocals.mp3');
    formData.append('voiceModelId', voiceId);

    if (pitchShift !== 0) {
      formData.append('pitchShift', pitchShift.toString());
    }

    // Request conversion
    const response = await fetch(`${KITSAI_API_URL}/voice-conversions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Kits.AI conversion API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const conversionId = data.id;

    // Poll for completion
    const convertedAudio = await this.pollConversionStatus(conversionId);
    return convertedAudio;
  }

  /**
   * Poll for conversion completion and return the converted audio
   *
   * @param conversionId - The conversion job ID
   * @param maxAttempts - Maximum polling attempts (default 60 = 5 minutes at 5s intervals)
   */
  private async pollConversionStatus(
    conversionId: string,
    maxAttempts: number = 60
  ): Promise<ArrayBuffer> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(
        `${KITSAI_API_URL}/voice-conversions/${conversionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Kits.AI poll API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.status === 'completed' && data.outputUrl) {
        // Download the converted audio
        const audioResponse = await fetch(data.outputUrl);
        return audioResponse.arrayBuffer();
      }

      if (data.status === 'failed') {
        throw new Error(`Voice conversion failed: ${data.error || 'Unknown error'}`);
      }

      // Wait 5 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    throw new Error('Voice conversion timed out');
  }

  /**
   * Convert vocals with a specific voice from the library (not custom cloned)
   *
   * @param audio - Input audio
   * @param libraryVoiceId - ID of a voice from the Kits.AI library
   */
  async convertWithLibraryVoice(
    audio: ArrayBuffer,
    libraryVoiceId: string
  ): Promise<ArrayBuffer> {
    return this.convertVocals({
      audio,
      voiceId: libraryVoiceId,
    });
  }
}

// Singleton instance
let instance: KitsAIProvider | null = null;

export function getKitsAIProvider(): KitsAIProvider {
  if (!instance) {
    const apiKey = process.env.KITSAI_API_KEY;
    if (!apiKey) {
      throw new Error('KITSAI_API_KEY environment variable is not set');
    }
    instance = new KitsAIProvider(apiKey);
  }
  return instance;
}
