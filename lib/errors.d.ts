/**
 * Base error class for all LoqaAudioDsp errors
 *
 * Provides a consistent error structure with error codes and additional details
 * for debugging and error handling.
 */
export declare class LoqaAudioDspError extends Error {
  code: string;
  details?: Record<string, unknown> | undefined;
  /**
   * Creates a new LoqaAudioDspError
   * @param message - Human-readable error message
   * @param code - Error code for programmatic error handling
   * @param details - Additional error details (optional)
   */
  constructor(message: string, code: string, details?: Record<string, unknown> | undefined);
}
/**
 * Error thrown when input validation fails
 *
 * This error indicates that the provided input parameters did not meet the
 * required constraints (e.g., buffer size, sample rate range, FFT size).
 */
export declare class ValidationError extends LoqaAudioDspError {
  /**
   * Creates a new ValidationError
   * @param message - Description of the validation failure
   * @param details - Additional context (e.g., invalid values, expected ranges)
   */
  constructor(message: string, details?: Record<string, unknown>);
}
/**
 * Error thrown when native module operations fail
 *
 * This error wraps errors that occur in the native iOS or Android code,
 * providing context about the failure and suggestions for resolution.
 */
export declare class NativeModuleError extends LoqaAudioDspError {
  /**
   * Creates a new NativeModuleError
   * @param message - Description of the native module failure
   * @param details - Additional context (e.g., original native error)
   */
  constructor(message: string, details?: Record<string, unknown>);
}
//# sourceMappingURL=errors.d.ts.map
