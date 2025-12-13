import type { VoiceAnalyzerConfig, VoiceAnalyzerHandle, VoiceAnalyzerResult, PitchTrack } from './types';
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
export declare function createVoiceAnalyzer(config: VoiceAnalyzerConfig): Promise<VoiceAnalyzerHandle>;
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
export declare function analyzeClip(analyzer: VoiceAnalyzerHandle, audioBuffer: Float32Array | number[]): Promise<VoiceAnalyzerResult>;
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
export declare function processBuffer(analyzer: VoiceAnalyzerHandle, audioBuffer: Float32Array | number[]): Promise<PitchTrack>;
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
export declare function resetVoiceAnalyzer(analyzer: VoiceAnalyzerHandle): Promise<void>;
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
export declare function freeVoiceAnalyzer(analyzer: VoiceAnalyzerHandle): Promise<void>;
//# sourceMappingURL=voiceAnalyzer.d.ts.map