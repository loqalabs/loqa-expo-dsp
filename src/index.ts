// @loqalabs/loqa-expo-dsp
// Expo native module wrapping loqa-voice-dsp for audio DSP analysis

// Export native module (for advanced usage)
export { default as LoqaExpoDspModule } from './LoqaExpoDspModule';

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
  HNROptions,
  HNRResult,
  H1H2Options,
  H1H2Result,
  VoiceAnalyzerConfig,
  VoiceAnalyzerHandle,
  VoiceAnalyzerResult,
  PitchTrack, // v0.5.0: HMM-smoothed Viterbi decoding result
} from './types';

// Export error classes
export {
  LoqaExpoDspError,
  LoqaAudioDspError, // @deprecated alias for backwards compatibility
  ValidationError,
  NativeModuleError,
} from './errors';

// Export utility functions
export { logDebug, logWarning } from './utils';

// Export DSP functions
export { computeFFT } from './computeFFT';
export { detectPitch } from './detectPitch';
export { extractFormants } from './extractFormants';
export { analyzeSpectrum } from './analyzeSpectrum';
export { calculateHNR } from './calculateHNR';
export { calculateH1H2 } from './calculateH1H2';

// Export VoiceAnalyzer streaming API (v0.3.0)
// processBuffer added in v0.5.0 for HMM-smoothed Viterbi decoding
export {
  createVoiceAnalyzer,
  analyzeClip,
  processBuffer, // v0.5.0: Viterbi-decoded pitch track
  resetVoiceAnalyzer,
  freeVoiceAnalyzer,
} from './voiceAnalyzer';
