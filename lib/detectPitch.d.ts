import type { PitchDetectionOptions, PitchResult } from './types';
/**
 * Detects pitch using YIN algorithm
 *
 * This function performs fundamental frequency (F0) detection on audio data using
 * the YIN algorithm, which is optimized for voice and monophonic instruments.
 * It accepts audio buffers as Float32Array or number[], validates the input,
 * and returns pitch information with confidence scores.
 *
 * @param audioBuffer - Audio samples (Float32Array or number[])
 * @param sampleRate - Sample rate in Hz (8000-48000)
 * @param options - Pitch detection options (minFrequency, maxFrequency)
 * @returns Promise resolving to pitch result with frequency, confidence, and voicing
 * @throws ValidationError if buffer or sample rate are invalid
 * @throws NativeModuleError if native computation fails
 *
 * @example
 * ```typescript
 * const audioData = new Float32Array(2048);
 * // ... fill with audio samples ...
 *
 * const result = await detectPitch(audioData, 44100, {
 *   minFrequency: 80,   // Minimum detectable pitch (Hz)
 *   maxFrequency: 400   // Maximum detectable pitch (Hz)
 * });
 *
 * if (result.isVoiced) {
 *   console.log(`Detected pitch: ${result.frequency} Hz`);
 *   console.log(`Confidence: ${result.confidence}`);
 * } else {
 *   console.log('No pitch detected (unvoiced segment)');
 * }
 * ```
 */
export declare function detectPitch(audioBuffer: Float32Array | number[], sampleRate: number, options?: Partial<PitchDetectionOptions>): Promise<PitchResult>;
//# sourceMappingURL=detectPitch.d.ts.map