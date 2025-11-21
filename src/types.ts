// Type definitions for LoqaAudioDsp module
// Will be fully implemented in Story 1.5

export interface FFTOptions {
  fftSize?: number;
  windowType?: 'hanning' | 'hamming' | 'blackman' | 'none';
  includePhase?: boolean;
}

export interface FFTResult {
  magnitude: Float32Array;
  phase?: Float32Array;
  frequencies: Float32Array;
}

export interface PitchDetectionOptions {
  sampleRate: number;
  minFrequency?: number;
  maxFrequency?: number;
}

export interface PitchResult {
  frequency: number | null;
  confidence: number;
  isVoiced: boolean;
}

export interface FormantExtractionOptions {
  sampleRate: number;
  lpcOrder?: number;
}

export interface FormantsResult {
  f1: number;
  f2: number;
  f3: number;
  bandwidths: {
    f1: number;
    f2: number;
    f3: number;
  };
}

export interface SpectrumAnalysisOptions {
  sampleRate: number;
}

export interface SpectrumResult {
  centroid: number;
  rolloff: number;
  tilt: number;
}
