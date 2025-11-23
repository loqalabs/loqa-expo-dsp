import type { SpectrumAnalysisOptions, SpectrumResult } from './types';
/**
 * Analyzes spectral features (centroid, rolloff, tilt)
 *
 * This function computes spectral characteristics of audio data, including:
 * - Spectral centroid: "center of mass" of the spectrum (brightness measure)
 * - Spectral rolloff: frequency below which 95% of energy is concentrated
 * - Spectral tilt: overall slope of the spectrum (timbre indicator)
 *
 * All features are computed in a single call for efficiency.
 *
 * @param audioBuffer - Audio samples (Float32Array or number[])
 * @param sampleRate - Sample rate in Hz (8000-48000)
 * @param options - Spectrum analysis options
 * @returns Promise resolving to spectrum result with centroid, rolloff, and tilt
 * @throws ValidationError if buffer or sample rate are invalid
 * @throws NativeModuleError if native computation fails
 *
 * @example
 * ```typescript
 * const audioData = new Float32Array(2048);
 * // ... fill with audio samples ...
 *
 * const result = await analyzeSpectrum(audioData, 44100);
 *
 * console.log(`Spectral centroid: ${result.centroid} Hz`);
 * console.log(`Spectral rolloff: ${result.rolloff} Hz`);
 * console.log(`Spectral tilt: ${result.tilt}`);
 * ```
 */
export declare function analyzeSpectrum(audioBuffer: Float32Array | number[], sampleRate: number, options?: Partial<SpectrumAnalysisOptions>): Promise<SpectrumResult>;
//# sourceMappingURL=analyzeSpectrum.d.ts.map