// Type definitions for LoqaAudioDsp module

/**
 * Configuration options for FFT computation
 */
export interface FFTOptions {
  /** FFT size (must be power of 2). Defaults to buffer length. */
  fftSize?: number;
  /** Window function type. Defaults to 'hanning'. */
  windowType?: 'hanning' | 'hamming' | 'blackman' | 'none';
  /** Return phase information. Defaults to false. */
  includePhase?: boolean;
}

/**
 * Result of FFT computation
 */
export interface FFTResult {
  /** Magnitude spectrum (length = fftSize / 2) */
  magnitude: Float32Array;
  /** Phase spectrum (if requested) */
  phase?: Float32Array;
  /** Frequency bin centers in Hz */
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
 */
export interface PitchResult {
  /** Detected pitch in Hz (or null if no pitch detected) */
  frequency: number | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether audio is voiced */
  isVoiced: boolean;
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
 */
export interface FormantsResult {
  /** First formant (F1) in Hz */
  f1: number;
  /** Second formant (F2) in Hz */
  f2: number;
  /** Third formant (F3) in Hz */
  f3: number;
  /** Formant bandwidths in Hz */
  bandwidths: {
    f1: number;
    f2: number;
    f3: number;
  };
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
