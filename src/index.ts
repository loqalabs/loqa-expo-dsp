// @loqalabs/loqa-audio-dsp
// Production-grade audio DSP analysis for React Native/Expo

// Export native module (for advanced usage)
export { default as LoqaAudioDspModule } from './LoqaAudioDspModule';

// Export type definitions
export type {
  FFTOptions,
  FFTResult,
  PitchDetectionOptions,
  PitchResult,
  FormantExtractionOptions,
  FormantsResult,
  SpectrumAnalysisOptions,
  SpectrumResult,
} from './types';

// Export error classes
export {
  LoqaAudioDspError,
  ValidationError,
  NativeModuleError,
} from './errors';

// Export utility functions
export { logDebug, logWarning } from './utils';

// Placeholder for future DSP function exports (Epic 2+)
// export { computeFFT } from './computeFFT';
// export { detectPitch } from './detectPitch';
// export { extractFormants } from './extractFormants';
// export { analyzeSpectrum } from './analyzeSpectrum';
