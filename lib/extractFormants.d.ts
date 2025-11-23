import type { FormantExtractionOptions, FormantsResult } from './types';
/**
 * Extracts formants (F1, F2, F3) using LPC analysis
 *
 * This function performs Linear Predictive Coding (LPC) analysis to extract
 * the first three formant frequencies from audio data. Formants are resonant
 * frequencies of the vocal tract and are essential for vowel identification
 * and speech analysis.
 *
 * @param audioBuffer - Audio samples (Float32Array or number[])
 * @param sampleRate - Sample rate in Hz (8000-48000)
 * @param options - Formant extraction options (lpcOrder)
 * @returns Promise resolving to formants result with F1, F2, F3 and bandwidths
 * @throws ValidationError if buffer or sample rate are invalid
 * @throws NativeModuleError if native computation fails
 *
 * @example
 * ```typescript
 * const audioData = new Float32Array(2048);
 * // ... fill with voiced audio samples ...
 *
 * const result = await extractFormants(audioData, 44100, {
 *   lpcOrder: 14  // Optional: LPC order (defaults to sampleRate/1000 + 2)
 * });
 *
 * console.log(`F1: ${result.f1} Hz`);
 * console.log(`F2: ${result.f2} Hz`);
 * console.log(`F3: ${result.f3} Hz`);
 * console.log(`Bandwidths:`, result.bandwidths);
 * ```
 */
export declare function extractFormants(audioBuffer: Float32Array | number[], sampleRate: number, options?: Partial<FormantExtractionOptions>): Promise<FormantsResult>;
//# sourceMappingURL=extractFormants.d.ts.map