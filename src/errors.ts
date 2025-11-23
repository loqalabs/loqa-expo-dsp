// Custom error classes for LoqaAudioDsp module

/**
 * Base error class for all LoqaAudioDsp errors
 *
 * Provides a consistent error structure with error codes and additional details
 * for debugging and error handling.
 */
export class LoqaAudioDspError extends Error {
  /**
   * Creates a new LoqaAudioDspError
   * @param message - Human-readable error message
   * @param code - Error code for programmatic error handling
   * @param details - Additional error details (optional)
   */
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LoqaAudioDspError';
  }
}

/**
 * Error thrown when input validation fails
 *
 * This error indicates that the provided input parameters did not meet the
 * required constraints (e.g., buffer size, sample rate range, FFT size).
 */
export class ValidationError extends LoqaAudioDspError {
  /**
   * Creates a new ValidationError
   * @param message - Description of the validation failure
   * @param details - Additional context (e.g., invalid values, expected ranges)
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when native module operations fail
 *
 * This error wraps errors that occur in the native iOS or Android code,
 * providing context about the failure and suggestions for resolution.
 */
export class NativeModuleError extends LoqaAudioDspError {
  /**
   * Creates a new NativeModuleError
   * @param message - Description of the native module failure
   * @param details - Additional context (e.g., original native error)
   */
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NATIVE_MODULE_ERROR', details);
    this.name = 'NativeModuleError';
  }
}
