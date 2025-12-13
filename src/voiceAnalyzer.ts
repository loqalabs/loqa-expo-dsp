// VoiceAnalyzer - Stateful streaming pitch analysis API
import LoqaExpoDspModule from './LoqaExpoDspModule';
import { NativeModuleError, ValidationError } from './errors';
import type {
  VoiceAnalyzerConfig,
  VoiceAnalyzerHandle,
  VoiceAnalyzerResult,
  PitchResult,
  PitchTrack,
} from './types';
import { logDebug } from './utils';
import { validateSampleRate } from './validation';

/**
 * Creates a new VoiceAnalyzer instance for stateful pitch tracking
 *
 * The VoiceAnalyzer provides HMM-smoothed pitch detection across frames,
 * ideal for analyzing longer audio clips with temporal coherence.
 *
 * Benefits over single-shot detectPitch():
 * - HMM state persistence between frames for smoother pitch tracks
 * - Better accuracy through temporal context
 * - Aggregate statistics (median, mean, std dev) across all frames
 * - Efficient batch processing of large audio clips
 *
 * @param config - VoiceAnalyzer configuration
 * @returns Promise resolving to VoiceAnalyzerHandle
 * @throws ValidationError if config is invalid
 * @throws NativeModuleError if native creation fails
 *
 * @example
 * ```typescript
 * // Create analyzer for 44.1kHz audio
 * const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });
 *
 * // Analyze a clip
 * const result = await analyzeClip(analyzer, audioSamples);
 * console.log(`Median pitch: ${result.medianPitch} Hz`);
 *
 * // Clean up when done
 * await freeVoiceAnalyzer(analyzer);
 * ```
 */
export async function createVoiceAnalyzer(
  config: VoiceAnalyzerConfig
): Promise<VoiceAnalyzerHandle> {
  logDebug('createVoiceAnalyzer called', config);

  // Validate sample rate
  validateSampleRate(config.sampleRate);

  // Validate frequency range if provided
  const minFrequency = config.minFrequency ?? 80;
  const maxFrequency = config.maxFrequency ?? 400;

  if (minFrequency <= 0) {
    throw new ValidationError('minFrequency must be positive', {
      minFrequency,
    });
  }

  if (maxFrequency <= minFrequency) {
    throw new ValidationError('maxFrequency must be greater than minFrequency', {
      minFrequency,
      maxFrequency,
    });
  }

  // Validate frame/hop sizes if provided
  const frameSize = config.frameSize ?? 2048;
  const hopSize = config.hopSize ?? frameSize / 4;

  if (frameSize <= 0 || !Number.isInteger(frameSize)) {
    throw new ValidationError('frameSize must be a positive integer', {
      frameSize,
    });
  }

  if (hopSize <= 0 || !Number.isInteger(hopSize)) {
    throw new ValidationError('hopSize must be a positive integer', {
      hopSize,
    });
  }

  try {
    // Build native config
    const nativeConfig: Record<string, unknown> = {
      sampleRate: config.sampleRate,
      minFrequency,
      maxFrequency,
      frameSize,
      hopSize,
    };

    logDebug('Calling native module to create VoiceAnalyzer', nativeConfig);

    const nativeResult = await LoqaExpoDspModule.createVoiceAnalyzer(nativeConfig);

    logDebug('Native module returned VoiceAnalyzer handle', {
      id: nativeResult.id,
      config: nativeResult.config,
    });

    // Build handle with resolved config
    const handle: VoiceAnalyzerHandle = {
      id: nativeResult.id,
      config: {
        sampleRate: config.sampleRate,
        minFrequency,
        maxFrequency,
        frameSize,
        hopSize,
      },
    };

    return handle;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logDebug('createVoiceAnalyzer failed', {
      error: errorMessage,
      config,
    });

    throw new NativeModuleError(`Failed to create VoiceAnalyzer: ${errorMessage}`, {
      originalError: error,
      config,
    });
  }
}

/**
 * Analyzes an audio clip using the VoiceAnalyzer
 *
 * Processes the entire audio buffer frame-by-frame with HMM smoothing,
 * returning individual frame results plus aggregate statistics.
 *
 * The analyzer maintains internal state between calls, so each call
 * builds on the previous HMM state. Call resetVoiceAnalyzer() to
 * start fresh with a new clip.
 *
 * @param analyzer - VoiceAnalyzerHandle from createVoiceAnalyzer
 * @param audioBuffer - Audio samples to analyze
 * @returns Promise resolving to VoiceAnalyzerResult
 * @throws ValidationError if analyzer handle or buffer is invalid
 * @throws NativeModuleError if native analysis fails
 *
 * @example
 * ```typescript
 * const result = await analyzeClip(analyzer, audioSamples);
 *
 * console.log(`Analyzed ${result.frameCount} frames`);
 * console.log(`Voiced: ${result.voicedFrameCount} frames`);
 * console.log(`Median pitch: ${result.medianPitch} Hz`);
 * console.log(`Mean confidence: ${result.meanConfidence}`);
 *
 * // Access individual frames
 * for (const frame of result.frames) {
 *   if (frame.isVoiced) {
 *     console.log(`${frame.frequency} Hz (conf: ${frame.confidence})`);
 *   }
 * }
 * ```
 */
export async function analyzeClip(
  analyzer: VoiceAnalyzerHandle,
  audioBuffer: Float32Array | number[]
): Promise<VoiceAnalyzerResult> {
  logDebug('analyzeClip called', {
    analyzerId: analyzer.id,
    bufferLength: audioBuffer.length,
    bufferType: audioBuffer instanceof Float32Array ? 'Float32Array' : 'number[]',
  });

  // Validate analyzer handle
  if (!analyzer || !analyzer.id) {
    throw new ValidationError('Invalid analyzer handle', {
      analyzer,
    });
  }

  // Validate buffer
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new ValidationError('Audio buffer cannot be empty', {
      bufferLength: audioBuffer?.length ?? 0,
    });
  }

  // Check for invalid values
  const hasInvalidValues = Array.from(audioBuffer).some((v) => !isFinite(v));
  if (hasInvalidValues) {
    throw new ValidationError('Buffer contains NaN or Infinity values', {
      bufferLength: audioBuffer.length,
    });
  }

  // Convert to number[] for React Native bridge
  const bufferArray: number[] =
    audioBuffer instanceof Float32Array ? Array.from(audioBuffer) : audioBuffer;

  try {
    logDebug('Calling native module for clip analysis', {
      analyzerId: analyzer.id,
      bufferLength: bufferArray.length,
    });

    const nativeResult = await LoqaExpoDspModule.analyzeClip(analyzer.id, bufferArray);

    logDebug('Native module returned analysis result', {
      frameCount: nativeResult.frameCount,
      voicedFrameCount: nativeResult.voicedFrameCount,
      medianPitch: nativeResult.medianPitch,
    });

    // Convert frames to PitchResult[]
    const frames: PitchResult[] = nativeResult.frames.map(
      (frame: {
        frequency: number | null;
        confidence: number;
        isVoiced: boolean;
        voicedProbability: number;
      }) => ({
        frequency: frame.frequency,
        confidence: frame.confidence,
        isVoiced: frame.isVoiced,
        voicedProbability: frame.voicedProbability,
      })
    );

    const result: VoiceAnalyzerResult = {
      frames,
      frameCount: nativeResult.frameCount,
      voicedFrameCount: nativeResult.voicedFrameCount,
      medianPitch: nativeResult.medianPitch ?? null,
      meanPitch: nativeResult.meanPitch ?? null,
      pitchStdDev: nativeResult.pitchStdDev ?? null,
      meanConfidence: nativeResult.meanConfidence ?? null,
      meanVoicedProbability: nativeResult.meanVoicedProbability,
    };

    logDebug('analyzeClip completed successfully', {
      frameCount: result.frameCount,
      voicedFrameCount: result.voicedFrameCount,
      medianPitch: result.medianPitch,
    });

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logDebug('analyzeClip failed', {
      error: errorMessage,
      analyzerId: analyzer.id,
      bufferLength: audioBuffer.length,
    });

    throw new NativeModuleError(`Clip analysis failed: ${errorMessage}`, {
      originalError: error,
      analyzerId: analyzer.id,
      bufferLength: audioBuffer.length,
    });
  }
}

/**
 * Processes a complete audio buffer with HMM-smoothed Viterbi decoding
 *
 * Unlike analyzeClip() which processes frames independently, this method uses
 * Viterbi decoding to find the globally optimal pitch track across all frames.
 * This significantly reduces octave jump errors (from ~8-12% to ≤3%) and
 * produces smoother pitch contours.
 *
 * Key differences from analyzeClip():
 * - Uses Viterbi decoding for globally optimal pitch track
 * - Octave jump rate reduced from ~8-12% to ≤3%
 * - Always uses pYIN algorithm regardless of config.algorithm
 * - Higher latency (must see entire buffer) but better accuracy
 * - Returns Float32Array for raw data (more memory efficient)
 *
 * Best suited for offline analysis of complete utterances (typically < 60 seconds).
 * For longer recordings, segment into utterances first.
 *
 * @param analyzer - VoiceAnalyzerHandle from createVoiceAnalyzer
 * @param audioBuffer - Complete audio buffer to analyze
 * @returns Promise resolving to PitchTrack with optimal pitch estimates
 * @throws ValidationError if analyzer handle or buffer is invalid
 * @throws NativeModuleError if native processing fails
 *
 * @example
 * ```typescript
 * const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });
 * const track = await processBuffer(analyzer, audioSamples);
 *
 * console.log(`Analyzed ${track.frameCount} frames`);
 * console.log(`Median pitch: ${track.medianPitch} Hz`);
 * console.log(`Octave jumps minimized with Viterbi decoding`);
 *
 * // Access raw pitch data
 * for (let i = 0; i < track.pitchTrack.length; i++) {
 *   if (track.pitchTrack[i] > 0) {
 *     console.log(`t=${track.timestamps[i]}s: ${track.pitchTrack[i]} Hz`);
 *   }
 * }
 *
 * await freeVoiceAnalyzer(analyzer);
 * ```
 */
export async function processBuffer(
  analyzer: VoiceAnalyzerHandle,
  audioBuffer: Float32Array | number[]
): Promise<PitchTrack> {
  logDebug('processBuffer called', {
    analyzerId: analyzer.id,
    bufferLength: audioBuffer.length,
    bufferType: audioBuffer instanceof Float32Array ? 'Float32Array' : 'number[]',
  });

  // Validate analyzer handle
  if (!analyzer || !analyzer.id) {
    throw new ValidationError('Invalid analyzer handle', {
      analyzer,
    });
  }

  // Validate buffer
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new ValidationError('Audio buffer cannot be empty', {
      bufferLength: audioBuffer?.length ?? 0,
    });
  }

  // Check for invalid values
  const hasInvalidValues = Array.from(audioBuffer).some((v) => !isFinite(v));
  if (hasInvalidValues) {
    throw new ValidationError('Buffer contains NaN or Infinity values', {
      bufferLength: audioBuffer.length,
    });
  }

  // Convert to number[] for React Native bridge
  const bufferArray: number[] =
    audioBuffer instanceof Float32Array ? Array.from(audioBuffer) : audioBuffer;

  try {
    logDebug('Calling native module for buffer processing with Viterbi decoding', {
      analyzerId: analyzer.id,
      bufferLength: bufferArray.length,
    });

    const nativeResult = await LoqaExpoDspModule.processBuffer(analyzer.id, bufferArray);

    logDebug('Native module returned pitch track', {
      frameCount: nativeResult.frameCount,
      voicedFrameCount: nativeResult.voicedFrameCount,
      medianPitch: nativeResult.medianPitch,
    });

    // Convert native arrays to Float32Array for memory efficiency
    const result: PitchTrack = {
      pitchTrack: new Float32Array(nativeResult.pitchTrack),
      voicedProbabilities: new Float32Array(nativeResult.voicedProbabilities),
      timestamps: new Float32Array(nativeResult.timestamps),
      frameCount: nativeResult.frameCount,
      voicedFrameCount: nativeResult.voicedFrameCount,
      medianPitch: nativeResult.medianPitch ?? null,
      meanPitch: nativeResult.meanPitch ?? null,
    };

    logDebug('processBuffer completed successfully', {
      frameCount: result.frameCount,
      voicedFrameCount: result.voicedFrameCount,
      medianPitch: result.medianPitch,
    });

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logDebug('processBuffer failed', {
      error: errorMessage,
      analyzerId: analyzer.id,
      bufferLength: audioBuffer.length,
    });

    throw new NativeModuleError(`Buffer processing failed: ${errorMessage}`, {
      originalError: error,
      analyzerId: analyzer.id,
      bufferLength: audioBuffer.length,
    });
  }
}

/**
 * Resets the VoiceAnalyzer state for reuse with new audio
 *
 * Call this when starting analysis of a new, independent audio clip.
 * This clears the HMM state so the new clip is analyzed fresh.
 *
 * @param analyzer - VoiceAnalyzerHandle from createVoiceAnalyzer
 * @throws ValidationError if analyzer handle is invalid
 * @throws NativeModuleError if native reset fails
 *
 * @example
 * ```typescript
 * // Analyze first clip
 * const result1 = await analyzeClip(analyzer, clip1Samples);
 *
 * // Reset for new clip
 * await resetVoiceAnalyzer(analyzer);
 *
 * // Analyze second clip with fresh state
 * const result2 = await analyzeClip(analyzer, clip2Samples);
 * ```
 */
export async function resetVoiceAnalyzer(analyzer: VoiceAnalyzerHandle): Promise<void> {
  logDebug('resetVoiceAnalyzer called', {
    analyzerId: analyzer.id,
  });

  // Validate analyzer handle
  if (!analyzer || !analyzer.id) {
    throw new ValidationError('Invalid analyzer handle', {
      analyzer,
    });
  }

  try {
    await LoqaExpoDspModule.resetVoiceAnalyzer(analyzer.id);

    logDebug('resetVoiceAnalyzer completed successfully', {
      analyzerId: analyzer.id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logDebug('resetVoiceAnalyzer failed', {
      error: errorMessage,
      analyzerId: analyzer.id,
    });

    throw new NativeModuleError(`Failed to reset VoiceAnalyzer: ${errorMessage}`, {
      originalError: error,
      analyzerId: analyzer.id,
    });
  }
}

/**
 * Frees a VoiceAnalyzer instance and releases native resources
 *
 * Always call this when done with an analyzer to prevent memory leaks.
 * After calling this, the analyzer handle should not be used again.
 *
 * @param analyzer - VoiceAnalyzerHandle from createVoiceAnalyzer
 * @throws ValidationError if analyzer handle is invalid
 * @throws NativeModuleError if native free fails
 *
 * @example
 * ```typescript
 * const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });
 * try {
 *   const result = await analyzeClip(analyzer, samples);
 *   // ... use result ...
 * } finally {
 *   await freeVoiceAnalyzer(analyzer);
 * }
 * ```
 */
export async function freeVoiceAnalyzer(analyzer: VoiceAnalyzerHandle): Promise<void> {
  logDebug('freeVoiceAnalyzer called', {
    analyzerId: analyzer.id,
  });

  // Validate analyzer handle
  if (!analyzer || !analyzer.id) {
    throw new ValidationError('Invalid analyzer handle', {
      analyzer,
    });
  }

  try {
    await LoqaExpoDspModule.freeVoiceAnalyzer(analyzer.id);

    logDebug('freeVoiceAnalyzer completed successfully', {
      analyzerId: analyzer.id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logDebug('freeVoiceAnalyzer failed', {
      error: errorMessage,
      analyzerId: analyzer.id,
    });

    throw new NativeModuleError(`Failed to free VoiceAnalyzer: ${errorMessage}`, {
      originalError: error,
      analyzerId: analyzer.id,
    });
  }
}
