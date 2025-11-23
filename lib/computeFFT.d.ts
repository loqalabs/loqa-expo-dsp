import type { FFTOptions, FFTResult } from './types';
/**
 * Computes Fast Fourier Transform (FFT) of audio buffer
 *
 * This function performs frequency analysis on audio data using the FFT algorithm.
 * It accepts audio buffers as Float32Array or number[], validates the input,
 * and returns magnitude and frequency information.
 *
 * @param audioBuffer - Audio samples (Float32Array or number[])
 * @param options - FFT configuration options
 * @returns Promise resolving to FFT result with magnitude, frequencies, and optional phase
 * @throws ValidationError if buffer or options are invalid
 * @throws NativeModuleError if native computation fails
 *
 * @example
 * ```typescript
 * const audioData = new Float32Array(1024);
 * // ... fill with audio samples ...
 *
 * const result = await computeFFT(audioData, {
 *   fftSize: 2048,
 *   windowType: 'hanning',
 *   includePhase: false
 * });
 *
 * console.log('Magnitude:', result.magnitude);
 * console.log('Frequencies:', result.frequencies);
 * ```
 */
export declare function computeFFT(
  audioBuffer: Float32Array | number[],
  options?: FFTOptions
): Promise<FFTResult>;
//# sourceMappingURL=computeFFT.d.ts.map
