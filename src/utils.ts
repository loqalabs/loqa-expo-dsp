// Utility functions for LoqaAudioDsp module

/**
 * Debug mode flag - enabled in development or when explicitly set
 * Controls whether debug logs are output
 */
const DEBUG = __DEV__ || process.env.LOQA_AUDIO_DSP_DEBUG === 'true';

/**
 * Logs a debug message with optional data
 *
 * Debug logs are only output when DEBUG mode is enabled (__DEV__ === true
 * or LOQA_AUDIO_DSP_DEBUG environment variable is set to 'true').
 *
 * All logs are prefixed with [LoqaAudioDsp] for easy identification.
 *
 * @param message - Debug message to log
 * @param data - Optional data to include in the log
 *
 * @example
 * ```typescript
 * logDebug('computeFFT called', {
 *   bufferLength: 1024,
 *   fftSize: 2048
 * });
 * ```
 */
export function logDebug(message: string, data?: unknown): void {
  if (DEBUG) {
    console.log(`[LoqaAudioDsp] ${message}`, data || '');
  }
}

/**
 * Logs a warning message with optional data
 *
 * Warnings are always output, regardless of DEBUG mode, as they indicate
 * potential issues or sub-optimal configurations that should be addressed.
 *
 * All logs are prefixed with [LoqaAudioDsp] for easy identification.
 *
 * @param message - Warning message to log
 * @param data - Optional data to include in the log
 *
 * @example
 * ```typescript
 * logWarning('Buffer size is sub-optimal', {
 *   currentSize: 512,
 *   recommendedSize: 2048
 * });
 * ```
 */
export function logWarning(message: string, data?: unknown): void {
  console.warn(`[LoqaAudioDsp] ${message}`, data || '');
}
