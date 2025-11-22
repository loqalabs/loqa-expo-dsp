// Input validation functions for LoqaAudioDsp module
import { ValidationError } from './errors';

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
export function validateAudioBuffer(buffer: Float32Array | number[]): void {
  // Check for null/undefined
  if (!buffer) {
    throw new ValidationError('Audio buffer cannot be null or undefined', {
      buffer,
    });
  }

  // Check for empty buffer
  if (buffer.length === 0) {
    throw new ValidationError('Audio buffer cannot be empty', {
      bufferLength: 0,
    });
  }

  // Check maximum buffer size (16384 samples as per architecture)
  if (buffer.length > 16384) {
    throw new ValidationError('Buffer too large (max 16384 samples)', {
      bufferLength: buffer.length,
      maxLength: 16384,
    });
  }

  // Check for NaN or Infinity values
  const hasInvalidValues = Array.from(buffer).some((v) => !isFinite(v));

  if (hasInvalidValues) {
    throw new ValidationError('Buffer contains NaN or Infinity values', {
      bufferLength: buffer.length,
    });
  }
}

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
export function validateSampleRate(sampleRate: number): void {
  // Check if sample rate is an integer
  if (!Number.isInteger(sampleRate)) {
    throw new ValidationError('Sample rate must be an integer', {
      sampleRate,
    });
  }

  // Check if sample rate is within supported range (8000-48000 Hz)
  if (sampleRate < 8000 || sampleRate > 48000) {
    throw new ValidationError('Sample rate must be between 8000 and 48000 Hz', {
      sampleRate,
      minSampleRate: 8000,
      maxSampleRate: 48000,
    });
  }
}

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
export function validateFFTSize(fftSize: number): void {
  // Check if FFT size is an integer
  if (!Number.isInteger(fftSize)) {
    throw new ValidationError('FFT size must be an integer', {
      fftSize,
    });
  }

  // Check if FFT size is a power of 2
  // Power of 2 check: (n & (n - 1)) === 0 && n > 0
  if (fftSize <= 0 || (fftSize & (fftSize - 1)) !== 0) {
    throw new ValidationError('FFT size must be a power of 2', {
      fftSize,
    });
  }

  // Check if FFT size is within supported range (256-8192)
  if (fftSize < 256 || fftSize > 8192) {
    throw new ValidationError('FFT size must be between 256 and 8192', {
      fftSize,
      minFFTSize: 256,
      maxFFTSize: 8192,
    });
  }
}
