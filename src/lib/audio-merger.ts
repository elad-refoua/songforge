/**
 * Audio Merger Utility
 *
 * Merges converted vocals with instrumental using FFmpeg.
 * This is the final step in the hybrid pipeline.
 *
 * Note: This requires FFmpeg to be installed on the server.
 * For Vercel deployment, we'll use @ffmpeg/ffmpeg (WebAssembly)
 */

// For server-side FFmpeg execution
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import os from 'os';

const execAsync = promisify(exec);

export interface MergeOptions {
  vocalsVolume?: number; // 0.0 to 2.0, default 1.0
  instrumentalVolume?: number; // 0.0 to 2.0, default 1.0
  outputFormat?: 'mp3' | 'wav';
  outputBitrate?: string; // e.g., '192k'
}

/**
 * Merge vocals and instrumental tracks into a single audio file
 *
 * @param vocals - ArrayBuffer of the vocals track
 * @param instrumental - ArrayBuffer of the instrumental track
 * @param options - Merge options
 * @returns ArrayBuffer of the merged audio
 */
export async function mergeAudioTracks(
  vocals: ArrayBuffer,
  instrumental: ArrayBuffer,
  options: MergeOptions = {}
): Promise<ArrayBuffer> {
  const {
    vocalsVolume = 1.0,
    instrumentalVolume = 1.0,
    outputFormat = 'mp3',
    outputBitrate = '192k',
  } = options;

  const tempDir = os.tmpdir();
  const sessionId = randomUUID();

  const vocalsPath = join(tempDir, `${sessionId}_vocals.mp3`);
  const instrumentalPath = join(tempDir, `${sessionId}_instrumental.mp3`);
  const outputPath = join(tempDir, `${sessionId}_merged.${outputFormat}`);

  try {
    // Write input files
    await writeFile(vocalsPath, Buffer.from(vocals));
    await writeFile(instrumentalPath, Buffer.from(instrumental));

    // Build FFmpeg command
    // Uses amix filter to combine the two audio tracks
    const ffmpegCmd = [
      'ffmpeg',
      '-y', // Overwrite output
      '-i', `"${vocalsPath}"`,
      '-i', `"${instrumentalPath}"`,
      '-filter_complex',
      `"[0:a]volume=${vocalsVolume}[v];[1:a]volume=${instrumentalVolume}[i];[v][i]amix=inputs=2:duration=longest:dropout_transition=2[out]"`,
      '-map', '"[out]"',
      '-c:a', outputFormat === 'mp3' ? 'libmp3lame' : 'pcm_s16le',
      '-b:a', outputBitrate,
      `"${outputPath}"`,
    ].join(' ');

    await execAsync(ffmpegCmd);

    // Read the output file
    const mergedBuffer = await readFile(outputPath);

    return mergedBuffer.buffer.slice(
      mergedBuffer.byteOffset,
      mergedBuffer.byteOffset + mergedBuffer.byteLength
    );
  } finally {
    // Clean up temp files
    await Promise.all([
      unlink(vocalsPath).catch(() => {}),
      unlink(instrumentalPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);
  }
}

/**
 * Adjust the volume of an audio track
 *
 * @param audio - ArrayBuffer of the audio
 * @param volume - Volume multiplier (0.0 to 2.0)
 * @returns ArrayBuffer of the adjusted audio
 */
export async function adjustVolume(
  audio: ArrayBuffer,
  volume: number
): Promise<ArrayBuffer> {
  const tempDir = os.tmpdir();
  const sessionId = randomUUID();

  const inputPath = join(tempDir, `${sessionId}_input.mp3`);
  const outputPath = join(tempDir, `${sessionId}_output.mp3`);

  try {
    await writeFile(inputPath, Buffer.from(audio));

    const ffmpegCmd = [
      'ffmpeg',
      '-y',
      '-i', `"${inputPath}"`,
      '-af', `"volume=${volume}"`,
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      `"${outputPath}"`,
    ].join(' ');

    await execAsync(ffmpegCmd);

    const outputBuffer = await readFile(outputPath);
    return outputBuffer.buffer.slice(
      outputBuffer.byteOffset,
      outputBuffer.byteOffset + outputBuffer.byteLength
    );
  } finally {
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);
  }
}

/**
 * Add reverb effect to audio (useful for vocals)
 *
 * @param audio - ArrayBuffer of the audio
 * @param reverbAmount - Reverb amount (0.0 to 1.0)
 * @returns ArrayBuffer of the processed audio
 */
export async function addReverb(
  audio: ArrayBuffer,
  reverbAmount: number = 0.3
): Promise<ArrayBuffer> {
  const tempDir = os.tmpdir();
  const sessionId = randomUUID();

  const inputPath = join(tempDir, `${sessionId}_input.mp3`);
  const outputPath = join(tempDir, `${sessionId}_output.mp3`);

  try {
    await writeFile(inputPath, Buffer.from(audio));

    // Using aecho filter for simple reverb effect
    const delay = Math.round(reverbAmount * 100);
    const decay = reverbAmount;

    const ffmpegCmd = [
      'ffmpeg',
      '-y',
      '-i', `"${inputPath}"`,
      '-af', `"aecho=0.8:0.9:${delay}:${decay}"`,
      '-c:a', 'libmp3lame',
      '-b:a', '192k',
      `"${outputPath}"`,
    ].join(' ');

    await execAsync(ffmpegCmd);

    const outputBuffer = await readFile(outputPath);
    return outputBuffer.buffer.slice(
      outputBuffer.byteOffset,
      outputBuffer.byteOffset + outputBuffer.byteLength
    );
  } finally {
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);
  }
}

/**
 * Get audio duration in seconds
 *
 * @param audio - ArrayBuffer of the audio
 * @returns Duration in seconds
 */
export async function getAudioDuration(audio: ArrayBuffer): Promise<number> {
  const tempDir = os.tmpdir();
  const sessionId = randomUUID();
  const inputPath = join(tempDir, `${sessionId}_input.mp3`);

  try {
    await writeFile(inputPath, Buffer.from(audio));

    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${inputPath}"`
    );

    return parseFloat(stdout.trim());
  } finally {
    await unlink(inputPath).catch(() => {});
  }
}

/**
 * Convert audio format
 *
 * @param audio - ArrayBuffer of the audio
 * @param outputFormat - Target format
 * @param bitrate - Output bitrate
 * @returns ArrayBuffer of the converted audio
 */
export async function convertFormat(
  audio: ArrayBuffer,
  outputFormat: 'mp3' | 'wav' | 'ogg' | 'flac',
  bitrate: string = '192k'
): Promise<ArrayBuffer> {
  const tempDir = os.tmpdir();
  const sessionId = randomUUID();

  const inputPath = join(tempDir, `${sessionId}_input`);
  const outputPath = join(tempDir, `${sessionId}_output.${outputFormat}`);

  try {
    await writeFile(inputPath, Buffer.from(audio));

    const codecMap: Record<string, string> = {
      mp3: 'libmp3lame',
      wav: 'pcm_s16le',
      ogg: 'libvorbis',
      flac: 'flac',
    };

    const ffmpegCmd = [
      'ffmpeg',
      '-y',
      '-i', `"${inputPath}"`,
      '-c:a', codecMap[outputFormat],
      outputFormat === 'mp3' || outputFormat === 'ogg' ? `-b:a ${bitrate}` : '',
      `"${outputPath}"`,
    ].filter(Boolean).join(' ');

    await execAsync(ffmpegCmd);

    const outputBuffer = await readFile(outputPath);
    return outputBuffer.buffer.slice(
      outputBuffer.byteOffset,
      outputBuffer.byteOffset + outputBuffer.byteLength
    );
  } finally {
    await Promise.all([
      unlink(inputPath).catch(() => {}),
      unlink(outputPath).catch(() => {}),
    ]);
  }
}
