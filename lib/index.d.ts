export { default as LoqaExpoDspModule } from './LoqaExpoDspModule';
export type { FFTOptions, FFTResult, PitchDetectionOptions, PitchResult, FormantExtractionOptions, FormantsResult, SpectrumAnalysisOptions, SpectrumResult, HNROptions, HNRResult, H1H2Options, H1H2Result, VoiceAnalyzerConfig, VoiceAnalyzerHandle, VoiceAnalyzerResult, PitchTrack, } from './types';
export { LoqaExpoDspError, LoqaAudioDspError, // @deprecated alias for backwards compatibility
ValidationError, NativeModuleError, } from './errors';
export { logDebug, logWarning } from './utils';
export { computeFFT } from './computeFFT';
export { detectPitch } from './detectPitch';
export { extractFormants } from './extractFormants';
export { analyzeSpectrum } from './analyzeSpectrum';
export { calculateHNR } from './calculateHNR';
export { calculateH1H2 } from './calculateH1H2';
export { createVoiceAnalyzer, analyzeClip, processBuffer, // v0.5.0: Viterbi-decoded pitch track
resetVoiceAnalyzer, freeVoiceAnalyzer, } from './voiceAnalyzer';
//# sourceMappingURL=index.d.ts.map