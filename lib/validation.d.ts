/**
 * Validates an audio buffer for DSP processing
 *
 * Checks that the buffer:
 * - Is not null/undefined
 * - Is not empty
 * - Does not exceed maximum size (16384 samples)
 * - Does not contain NaN or Infinity values
 *
 * @param buffer - Audio samples as Float32Array or number[]
 * @throws {ValidationError} if validation fails
 *
 * @example
 * ```typescript
 * const buffer = new Float32Array(1024);
 * validateAudioBuffer(buffer); // Passes if buffer is valid
 * ```
 */
export declare function validateAudioBuffer(buffer: Float32Array | number[]): void;
/**
 * Validates a sample rate for audio processing
 *
 * Checks that the sample rate:
 * - Is an integer
 * - Is within the supported range (8000-48000 Hz)
 *
 * @param sampleRate - Sample rate in Hz
 * @throws {ValidationError} if validation fails
 *
 * @example
 * ```typescript
 * validateSampleRate(44100); // Passes
 * validateSampleRate(96000); // Throws ValidationError (too high)
 * ```
 */
export declare function validateSampleRate(sampleRate: number): void;
/**
 * Validates an FFT size for FFT computation
 *
 * Checks that the FFT size:
 * - Is an integer
 * - Is a power of 2
 * - Is within the supported range (256-8192)
 *
 * @param fftSize - FFT size (must be power of 2)
 * @throws {ValidationError} if validation fails
 *
 * @example
 * ```typescript
 * validateFFTSize(1024); // Passes (power of 2)
 * validateFFTSize(1000); // Throws ValidationError (not power of 2)
 * ```
 */
export declare function validateFFTSize(fftSize: number): void;
//# sourceMappingURL=validation.d.ts.map