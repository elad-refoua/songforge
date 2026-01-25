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
    taskId: string;
  };
}

interface SunoClip {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  title: string;
  duration: number;
}

interface SunoStatusResponse {
  code: number;
  msg: string;
  data: {
    status: string; // PENDING, PROCESSING, SUCCESS, FAILED
    errorMessage?: string;
    response?: {
      sunoData?: SunoClip[];
    };
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

    // Build the full prompt with lyrics if provided
    let fullPrompt = prompt;
    if (lyrics) {
      fullPrompt = `${prompt}\n\n[Lyrics]\n${lyrics}`;
    }

    // Start generation task - using correct endpoint /api/v1/generate
    const taskResponse = await fetch(`${SUNO_API_URL}/api/v1/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        customMode: true,
        instrumental: instrumental,
        prompt: fullPrompt,
        style: style || undefined,
        title: title || 'Untitled Song',
        model: 'V4_5ALL', // Use V4.5 All model
        callBackUrl: 'https://songforge.vercel.app/api/callbacks/suno', // Required by API, we poll instead
      }),
    });

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text();
      throw new Error(`Suno API error: ${taskResponse.status} - ${errorText}`);
    }

    const taskData: SunoTaskResponse = await taskResponse.json();

    if (taskData.code !== 200) {
      throw new Error(`Suno API error: ${taskData.msg}`);
    }

    const taskId = taskData.data.taskId;

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
      // Wait before polling (first iteration too, since generation takes time)
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));

      const statusResponse = await fetch(`${SUNO_API_URL}/api/v1/generate/record-info?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to check task status: ${statusResponse.status}`);
      }

      const statusData: SunoStatusResponse = await statusResponse.json();

      if (statusData.code !== 200) {
        throw new Error(`Status check error: ${statusData.msg}`);
      }

      const taskStatus = statusData.data.status;

      if (taskStatus === 'SUCCESS' || taskStatus === 'completed') {
        // Get the first clip's audio URL
        if (statusData.data.response?.sunoData && statusData.data.response.sunoData.length > 0) {
          const clip = statusData.data.response.sunoData[0];
          // Prefer audioUrl (downloadable), fallback to streamAudioUrl
          return clip.audioUrl || clip.streamAudioUrl;
        }
        throw new Error('No audio URL in completed response');
      }

      if (taskStatus === 'FAILED' || taskStatus === 'failed') {
        throw new Error(`Song generation failed: ${statusData.data.errorMessage || 'Unknown error'}`);
      }

      // Continue polling for PENDING, PROCESSING, etc.
    }

    throw new Error('Song generation timed out');
  }

  /**
   * Get remaining credits
   */
  async getCredits(): Promise<number> {
    const response = await fetch(`${SUNO_API_URL}/api/v1/generate/account`, {
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
