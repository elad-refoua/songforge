/**
 * Suno API Provider (via sunoapi.org)
 *
 * Alternative music generation provider with free trial.
 * API Documentation: https://docs.sunoapi.org
 */

export interface SunoGenerateParams {
  prompt: string;
  lyrics?: string;
  style?: string;
  title?: string;
  instrumental?: boolean;
}

interface SunoTaskResponse {
  code: number;
  msg: string;
  data: {
    task_id: string;
  };
}

interface SunoStatusResponse {
  code: number;
  msg: string;
  data: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    audio_url?: string;
    clips?: Array<{
      id: string;
      audio_url: string;
      title: string;
      duration: number;
    }>;
    error?: string;
  };
}

const SUNO_API_URL = 'https://api.sunoapi.org';
const MAX_POLL_ATTEMPTS = 60; // Max 5 minutes (60 * 5 seconds)
const POLL_INTERVAL_MS = 5000; // 5 seconds

export class SunoProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Suno API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Generate a song using Suno API
   *
   * @param params - Generation parameters
   * @returns ArrayBuffer of the generated audio (MP3)
   */
  async generateSong(params: SunoGenerateParams): Promise<ArrayBuffer> {
    const { prompt, lyrics, style, title, instrumental = false } = params;

    // Start generation task
    const taskResponse = await fetch(`${SUNO_API_URL}/v1/music/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt: prompt,
        lyrics: lyrics || undefined,
        style: style || undefined,
        title: title || undefined,
        instrumental: instrumental,
        model: 'v3.5', // Use latest model
      }),
    });

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      throw new Error(`Suno API error: ${taskResponse.status} - ${errorText}`);
    }

    const taskData: SunoTaskResponse = await taskResponse.json();

    if (taskData.code !== 0 && taskData.code !== 200) {
      throw new Error(`Suno API error: ${taskData.msg}`);
    }

    const taskId = taskData.data.task_id;

    // Poll for completion
    const audioUrl = await this.pollForCompletion(taskId);

    // Download the audio
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`);
    }

    return audioResponse.arrayBuffer();
  }

  /**
   * Poll for task completion
   */
  private async pollForCompletion(taskId: string): Promise<string> {
    for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
      const statusResponse = await fetch(`${SUNO_API_URL}/v1/music/task/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check task status: ${statusResponse.status}`);
      }

      const statusData: SunoStatusResponse = await statusResponse.json();

      if (statusData.data.status === 'completed') {
        // Get the first clip's audio URL
        if (statusData.data.clips && statusData.data.clips.length > 0) {
          return statusData.data.clips[0].audio_url;
        }
        if (statusData.data.audio_url) {
          return statusData.data.audio_url;
        }
        throw new Error('No audio URL in completed response');
      }

      if (statusData.data.status === 'failed') {
        throw new Error(`Song generation failed: ${statusData.data.error || 'Unknown error'}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    throw new Error('Song generation timed out');
  }

  /**
   * Get remaining credits
   */
  async getCredits(): Promise<number> {
    const response = await fetch(`${SUNO_API_URL}/v1/account/credits`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get credits: ${response.status}`);
    }

    const data = await response.json();
    return data.data?.credits || 0;
  }
}

// Singleton instance
let instance: SunoProvider | null = null;

export function getSunoProvider(): SunoProvider {
  if (!instance) {
    const apiKey = process.env.SUNO_API_KEY;
    if (!apiKey) {
      throw new Error('SUNO_API_KEY environment variable is not set');
    }
    instance = new SunoProvider(apiKey);
  }
  return instance;
}

export function hasSunoProvider(): boolean {
  return !!process.env.SUNO_API_KEY;
}
