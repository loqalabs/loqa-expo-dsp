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
//# sourceMappingURL=types.d.ts.map