// Type definitions for LoqaExpoDsp module

/**
 * Configuration options for FFT computation
 *
 * @example
 * ```typescript
 * const options: FFTOptions = {
 *   fftSize: 2048,           // Power of 2 between 256-8192
 *   windowType: 'hanning',   // Reduces spectral leakage
 *   includePhase: false      // Omit phase for performance
 * };
 * ```
 */
export interface FFTOptions {
  /**
   * FFT size (must be power of 2, range: 256-8192).
   * Defaults to buffer length. Larger sizes provide better frequency resolution
   * but lower time resolution.
   */
  fftSize?: number;
  /**
   * Window function type. Defaults to 'hanning'.
   * - 'hanning': Good general-purpose window (default)
   * - 'hamming': Similar to Hanning, slightly different sidelobe behavior
   * - 'blackman': Better frequency resolution, more attenuation
   * - 'none': Rectangular window (use only for perfect sine waves)
   */
  windowType?: 'hanning' | 'hamming' | 'blackman' | 'none';
  /**
   * Return phase information. Defaults to false.
   * Set to true only if you need phase data, as it increases computation time.
   */
  includePhase?: boolean;
}

/**
 * Result of FFT computation
 *
 * Contains frequency-domain representation of the input audio signal.
 *
 * @example
 * ```typescript
 * const result = await computeFFT(audioBuffer, { fftSize: 2048 });
 *
 * // Find peak frequency
 * const peakIndex = result.magnitude.indexOf(Math.max(...result.magnitude));
 * const peakFrequency = result.frequencies[peakIndex];
 * console.log(`Peak at ${peakFrequency} Hz`);
 * ```
 */
export interface FFTResult {
  /**
   * Magnitude spectrum (length = fftSize / 2)
   *
   * Each element represents the amplitude at the corresponding frequency.
   * Higher values indicate stronger presence of that frequency component.
   */
  magnitude: Float32Array;
  /**
   * Phase spectrum (only present if includePhase: true)
   *
   * Each element represents the phase angle in radians at the corresponding frequency.
   * Useful for signal reconstruction and phase-based analysis.
   */
  phase?: Float32Array;
  /**
   * Frequency bin centers in Hz
   *
   * Each element corresponds to the center frequency of each magnitude/phase bin.
   * Use this array to map magnitude values to their frequencies.
   */
  frequencies: Float32Array;
}

/**
 * Configuration options for pitch detection
 */
export interface PitchDetectionOptions {
  /** Sample rate in Hz */
  sampleRate: number;
  /** Minimum detectable frequency in Hz. Defaults to 80. */
  minFrequency?: number;
  /** Maximum detectable frequency in Hz. Defaults to 400. */
  maxFrequency?: number;
}

/**
 * Result of pitch detection
 *
 * @example
 * ```typescript
 * const result = await detectPitch(audioData, 44100);
 *
 * if (result.isVoiced) {
 *   console.log(`Pitch: ${result.frequency} Hz`);
 *   console.log(`Confidence: ${result.confidence}`);
 *   console.log(`Voiced probability: ${result.voicedProbability}`);
 * }
 * ```
 */
export interface PitchResult {
  /** Detected pitch in Hz (or null if no pitch detected) */
  frequency: number | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether audio is voiced */
  isVoiced: boolean;
  /**
   * Probabilistic voiced/unvoiced decision (0-1).
   * Added in loqa-voice-dsp v0.4.0 with pYIN algorithm.
   *
   * Values closer to 1 indicate higher probability of voiced speech.
   * This provides a "soft" decision compared to the binary isVoiced flag.
   */
  voicedProbability: number;
}

/**
 * Configuration options for formant extraction
 */
export interface FormantExtractionOptions {
  /** Sample rate in Hz */
  sampleRate: number;
  /** LPC order. Defaults to sampleRate / 1000 + 2. */
  lpcOrder?: number;
}

/**
 * Result of formant extraction
 *
 * Note: In loqa-voice-dsp v0.4.0, bandwidths were replaced with a confidence score.
 *
 * @example
 * ```typescript
 * const result = await extractFormants(audioData, 44100);
 *
 * console.log(`F1: ${result.f1} Hz`);
 * console.log(`F2: ${result.f2} Hz`);
 * console.log(`F3: ${result.f3} Hz`);
 * console.log(`Confidence: ${result.confidence}`);
 * ```
 */
export interface FormantsResult {
  /** First formant (F1) in Hz */
  f1: number;
  /** Second formant (F2) in Hz */
  f2: number;
  /** Third formant (F3) in Hz */
  f3: number;
  /**
   * Confidence score for the formant extraction (0-1).
   * Added in loqa-voice-dsp v0.4.0, replacing bandwidths.
   *
   * Higher values indicate more reliable formant detection.
   */
  confidence: number;
}

/**
 * Configuration options for spectrum analysis
 */
export interface SpectrumAnalysisOptions {
  /** Sample rate in Hz */
  sampleRate: number;
}

/**
 * Result of spectrum analysis
 */
export interface SpectrumResult {
  /** Spectral centroid in Hz (brightness measure) */
  centroid: number;
  /** Spectral rolloff in Hz (95% energy threshold) */
  rolloff: number;
  /** Spectral tilt (slope of spectrum) */
  tilt: number;
}

/**
 * Configuration options for HNR (Harmonics-to-Noise Ratio) calculation
 *
 * HNR measures the ratio of harmonic to noise energy in voice,
 * providing a quantitative measure of breathiness.
 *
 * @example
 * ```typescript
 * const options: HNROptions = {
 *   sampleRate: 44100,
 *   minFreq: 75,   // Minimum F0 to search
 *   maxFreq: 500   // Maximum F0 to search
 * };
 * ```
 */
export interface HNROptions {
  /** Sample rate in Hz */
  sampleRate: number;
  /**
   * Minimum fundamental frequency to search in Hz.
   * Defaults to 75 Hz. Lower values may be needed for very low voices.
   */
  minFreq?: number;
  /**
   * Maximum fundamental frequency to search in Hz.
   * Defaults to 500 Hz. Higher values may be needed for very high voices.
   */
  maxFreq?: number;
}

/**
 * Result of HNR (Harmonics-to-Noise Ratio) calculation
 *
 * HNR is the primary acoustic measure of breathiness:
 * - Higher HNR (18-25 dB): Clear, less breathy voice
 * - Lower HNR (12-18 dB): Softer, more breathy voice
 * - Very low HNR (<10 dB): Very breathy or pathological voice
 *
 * @example
 * ```typescript
 * const result = await calculateHNR(audioBuffer, { sampleRate: 44100 });
 *
 * if (result.isVoiced) {
 *   if (result.hnr > 20) {
 *     console.log('Clear voice detected');
 *   } else if (result.hnr < 15) {
 *     console.log('Breathy voice detected');
 *   }
 * }
 * ```
 */
export interface HNRResult {
  /**
   * Harmonics-to-Noise Ratio in decibels (dB).
   *
   * Typical ranges:
   * - 12-18 dB: Breathy voice (e.g., soft, warm quality)
   * - 18-25 dB: Clear voice (e.g., bright, crisp quality)
   * - 0 dB: Returned for unvoiced signals
   */
  hnr: number;
  /**
   * Detected fundamental frequency in Hz.
   *
   * This is the F0 used for HNR calculation.
   * Returns 0 if signal is unvoiced.
   */
  f0: number;
  /**
   * Whether the signal is voiced (periodic).
   *
   * If false, the signal is either unvoiced (noise, whisper)
   * or below the voicing threshold.
   */
  isVoiced: boolean;
}

/**
 * Configuration options for H1-H2 amplitude difference calculation
 *
 * H1-H2 measures the difference between the first and second harmonic amplitudes,
 * correlating with vocal weight (lighter vs fuller voice quality).
 *
 * @example
 * ```typescript
 * const options: H1H2Options = {
 *   sampleRate: 44100,
 *   f0: 200  // Optional: provide pre-calculated F0 for efficiency
 * };
 * ```
 */
export interface H1H2Options {
  /** Sample rate in Hz */
  sampleRate: number;
  /**
   * Optional pre-calculated fundamental frequency in Hz.
   *
   * If provided, skips F0 detection (faster).
   * If omitted or set to 0, F0 will be auto-detected.
   * Use this if you've already called detectPitch().
   */
  f0?: number;
}

/**
 * Result of H1-H2 amplitude difference calculation
 *
 * H1-H2 is a key acoustic correlate of vocal weight:
 * - Higher H1-H2 (>5 dB): Lighter, breathier vocal quality
 * - Lower H1-H2 (<0 dB): Fuller, heavier vocal quality
 * - Moderate H1-H2 (0-5 dB): Balanced vocal weight
 *
 * @example
 * ```typescript
 * const result = await calculateH1H2(audioBuffer, { sampleRate: 44100 });
 *
 * if (result.h1h2 > 5) {
 *   console.log('Lighter voice detected');
 * } else if (result.h1h2 < 0) {
 *   console.log('Fuller voice detected');
 * }
 * ```
 */
export interface H1H2Result {
  /**
   * H1-H2 amplitude difference in decibels (dB).
   *
   * Calculated as: H1_amplitude_dB - H2_amplitude_dB
   *
   * Typical ranges:
   * - >5 dB: Lighter, breathier quality
   * - 0-5 dB: Balanced
   * - <0 dB: Fuller, heavier quality
   */
  h1h2: number;
  /**
   * First harmonic (fundamental) amplitude in dB.
   *
   * This is the amplitude at the F0 frequency.
   */
  h1AmplitudeDb: number;
  /**
   * Second harmonic amplitude in dB.
   *
   * This is the amplitude at 2*F0 frequency.
   */
  h2AmplitudeDb: number;
  /**
   * Fundamental frequency used for calculation in Hz.
   *
   * Either the provided F0 or the auto-detected value.
   */
  f0: number;
}

/**
 * Configuration options for VoiceAnalyzer streaming API
 *
 * The VoiceAnalyzer provides stateful pitch tracking with HMM smoothing,
 * ideal for analyzing longer audio clips frame-by-frame with temporal coherence.
 *
 * @example
 * ```typescript
 * const config: VoiceAnalyzerConfig = {
 *   sampleRate: 44100,
 *   minFrequency: 80,
 *   maxFrequency: 400,
 *   frameSize: 2048,
 *   hopSize: 512
 * };
 * ```
 */
export interface VoiceAnalyzerConfig {
  /** Sample rate in Hz (8000-48000) */
  sampleRate: number;
  /**
   * Minimum detectable frequency in Hz.
   * Defaults to 80 Hz (low male voice).
   */
  minFrequency?: number;
  /**
   * Maximum detectable frequency in Hz.
   * Defaults to 400 Hz (high female voice).
   */
  maxFrequency?: number;
  /**
   * Frame size in samples for analysis.
   * Defaults to 2048 samples (~46ms at 44100 Hz).
   * Larger frames provide better frequency resolution but worse time resolution.
   */
  frameSize?: number;
  /**
   * Hop size in samples between consecutive frames.
   * Defaults to frameSize / 4 (75% overlap).
   * Smaller hop sizes provide smoother pitch tracks but more computation.
   */
  hopSize?: number;
}

/**
 * Handle to a VoiceAnalyzer instance
 *
 * This is an opaque handle returned by createVoiceAnalyzer().
 * Use it with analyzeClip(), resetVoiceAnalyzer(), and freeVoiceAnalyzer().
 */
export interface VoiceAnalyzerHandle {
  /** Unique identifier for this analyzer instance */
  id: string;
  /** Configuration used to create this analyzer */
  config: VoiceAnalyzerConfig;
}

/**
 * Result of analyzing a clip with VoiceAnalyzer
 *
 * Contains an array of pitch results for each frame, plus aggregate statistics.
 *
 * @example
 * ```typescript
 * const result = await analyzeClip(analyzer, audioData);
 *
 * console.log(`Analyzed ${result.frameCount} frames`);
 * console.log(`Median pitch: ${result.medianPitch} Hz`);
 * console.log(`Voiced frames: ${result.voicedFrameCount}`);
 *
 * // Access individual frame results
 * for (const frame of result.frames) {
 *   if (frame.isVoiced) {
 *     console.log(`Frame pitch: ${frame.frequency} Hz`);
 *   }
 * }
 * ```
 */
export interface VoiceAnalyzerResult {
  /**
   * Array of pitch results for each analyzed frame.
   * Frames are analyzed with HMM smoothing for temporal coherence.
   */
  frames: PitchResult[];
  /** Total number of frames analyzed */
  frameCount: number;
  /** Number of frames detected as voiced */
  voicedFrameCount: number;
  /**
   * Median pitch across all voiced frames in Hz.
   * null if no voiced frames were detected.
   * Use this as the primary pitch estimate for the clip.
   */
  medianPitch: number | null;
  /**
   * Mean pitch across all voiced frames in Hz.
   * null if no voiced frames were detected.
   */
  meanPitch: number | null;
  /**
   * Standard deviation of pitch across voiced frames in Hz.
   * null if fewer than 2 voiced frames were detected.
   * Lower values indicate more stable pitch.
   */
  pitchStdDev: number | null;
  /**
   * Mean confidence across all voiced frames (0-1).
   * null if no voiced frames were detected.
   */
  meanConfidence: number | null;
  /**
   * Mean voiced probability across all frames (0-1).
   * Higher values indicate more of the clip was voiced.
   */
  meanVoicedProbability: number;
}

/**
 * Result of processing a complete audio buffer with Viterbi decoding (v0.5.0)
 *
 * Unlike VoiceAnalyzerResult which analyzes frames independently, PitchTrack uses
 * HMM-smoothed Viterbi decoding to find the globally optimal pitch track across
 * all frames. This significantly reduces octave jump errors (from ~8-12% to ≤3%)
 * and produces smoother pitch contours.
 *
 * Best suited for offline analysis of complete utterances (typically < 60 seconds).
 * For longer recordings, segment into utterances first.
 *
 * **Note:** Always uses pYIN algorithm regardless of VoiceAnalyzerConfig.algorithm setting,
 * since HMM smoothing requires the probabilistic candidates that only pYIN provides.
 *
 * @example
 * ```typescript
 * const analyzer = await createVoiceAnalyzer({ sampleRate: 44100 });
 * const track = await processBuffer(analyzer, audioSamples);
 *
 * console.log(`Analyzed ${track.frameCount} frames`);
 * console.log(`Median pitch: ${track.medianPitch} Hz`);
 *
 * // Access raw pitch track data
 * for (let i = 0; i < track.pitchTrack.length; i++) {
 *   const pitch = track.pitchTrack[i];
 *   const prob = track.voicedProbabilities[i];
 *   const time = track.timestamps[i];
 *   if (pitch > 0) {
 *     console.log(`t=${time.toFixed(3)}s: ${pitch.toFixed(1)} Hz (${(prob * 100).toFixed(0)}% voiced)`);
 *   }
 * }
 *
 * await freeVoiceAnalyzer(analyzer);
 * ```
 */
export interface PitchTrack {
  /**
   * Pitch estimates per frame in Hz (0.0 = unvoiced).
   * This is the globally optimal pitch track computed via Viterbi decoding.
   * Length matches frameCount.
   */
  pitchTrack: Float32Array;
  /**
   * Voiced probability per frame [0.0, 1.0].
   * Higher values indicate higher confidence that the frame contains voiced speech.
   * Length matches frameCount.
   */
  voicedProbabilities: Float32Array;
  /**
   * Frame timestamps in seconds from buffer start.
   * Computed as frame_index * hop_size / sample_rate.
   * Length matches frameCount.
   */
  timestamps: Float32Array;
  /** Total number of frames analyzed */
  frameCount: number;
  /** Number of voiced frames (pitch > 0) */
  voicedFrameCount: number;
  /**
   * Median pitch across voiced frames in Hz.
   * null if no voiced frames were detected.
   */
  medianPitch: number | null;
  /**
   * Mean pitch across voiced frames in Hz.
   * null if no voiced frames were detected.
   */
  meanPitch: number | null;
}
