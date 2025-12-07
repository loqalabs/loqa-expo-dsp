// @loqalabs/loqa-expo-dsp
// Expo native module wrapping loqa-voice-dsp for audio DSP analysis
// Export native module (for advanced usage)
export { default as LoqaExpoDspModule } from './LoqaExpoDspModule';
// Export error classes
export { LoqaExpoDspError, LoqaAudioDspError, // @deprecated alias for backwards compatibility
ValidationError, NativeModuleError, } from './errors';
// Export utility functions
export { logDebug, logWarning } from './utils';
// Export DSP functions
export { computeFFT } from './computeFFT';
export { detectPitch } from './detectPitch';
export { extractFormants } from './extractFormants';
export { analyzeSpectrum } from './analyzeSpectrum';
export { calculateHNR } from './calculateHNR';
export { calculateH1H2 } from './calculateH1H2';
//# sourceMappingURL=index.js.map