export { default as LoqaAudioDspModule } from './LoqaAudioDspModule';
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
export { LoqaAudioDspError, ValidationError, NativeModuleError } from './errors';
export { logDebug, logWarning } from './utils';
export { computeFFT } from './computeFFT';
export { detectPitch } from './detectPitch';
export { extractFormants } from './extractFormants';
export { analyzeSpectrum } from './analyzeSpectrum';
//# sourceMappingURL=index.d.ts.map
