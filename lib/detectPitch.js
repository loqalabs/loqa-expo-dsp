// detectPitch - Pitch detection API using YIN algorithm
import LoqaAudioDspModule from './LoqaAudioDspModule';
import { NativeModuleError } from './errors';
import { logDebug } from './utils';
import { validateAudioBuffer, validateSampleRate } from './validation';
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
export async function detectPitch(audioBuffer, sampleRate, options) {
    // Step 1: Validate audio buffer and sample rate
    logDebug('detectPitch called', {
        bufferLength: audioBuffer.length,
        bufferType: audioBuffer instanceof Float32Array ? 'Float32Array' : 'number[]',
        sampleRate,
        options,
    });
    validateAudioBuffer(audioBuffer);
    validateSampleRate(sampleRate);
    // Step 2: Extract and set defaults for optional parameters
    // Default to human voice range: 80-400 Hz
    const minFrequency = options?.minFrequency ?? 80;
    const maxFrequency = options?.maxFrequency ?? 400;
    // Validate frequency range
    if (minFrequency <= 0 || maxFrequency <= 0) {
        throw new NativeModuleError('Frequency range must be positive', {
            minFrequency,
            maxFrequency,
        });
    }
    if (minFrequency >= maxFrequency) {
        throw new NativeModuleError('minFrequency must be less than maxFrequency', {
            minFrequency,
            maxFrequency,
        });
    }
    // Step 3: Convert to number[] for React Native bridge
    // React Native bridge requires plain arrays, not typed arrays
    const bufferArray = audioBuffer instanceof Float32Array ? Array.from(audioBuffer) : audioBuffer;
    logDebug('Calling native module for pitch detection', {
        sampleRate,
        minFrequency,
        maxFrequency,
    });
    try {
        // Step 4: Call native module
        const nativeResult = await LoqaAudioDspModule.detectPitch(bufferArray, sampleRate, {
            minFrequency,
            maxFrequency,
        });
        logDebug('Native module returned pitch result', {
            frequency: nativeResult.frequency,
            confidence: nativeResult.confidence,
            isVoiced: nativeResult.isVoiced,
        });
        // Step 5: Convert result to PitchResult type
        // Native module returns dictionary/map, convert to proper TypeScript type
        const result = {
            frequency: nativeResult.frequency !== null ? nativeResult.frequency : null,
            confidence: nativeResult.confidence,
            isVoiced: nativeResult.isVoiced,
        };
        logDebug('detectPitch completed successfully', {
            frequency: result.frequency,
            confidence: result.confidence,
            isVoiced: result.isVoiced,
        });
        return result;
    }
    catch (error) {
        // Step 6: Wrap native errors in NativeModuleError with context
        const errorMessage = error instanceof Error ? error.message : String(error);
        logDebug('detectPitch failed', {
            error: errorMessage,
            sampleRate,
            bufferLength: audioBuffer.length,
        });
        throw new NativeModuleError(`Pitch detection failed: ${errorMessage}`, {
            originalError: error,
            sampleRate,
            minFrequency,
            maxFrequency,
            bufferLength: audioBuffer.length,
        });
    }
}
//# sourceMappingURL=detectPitch.js.map