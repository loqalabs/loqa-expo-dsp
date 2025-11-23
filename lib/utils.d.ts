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
export declare function logDebug(message: string, data?: unknown): void;
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
export declare function logWarning(message: string, data?: unknown): void;
//# sourceMappingURL=utils.d.ts.map