package com.loqalabs.loqaexpodsp.RustJNI

/**
 * PitchResult data class matching Rust #[repr(C)] PitchResult struct.
 * Returned by value from nativeDetectPitch JNI function.
 */
data class PitchResult(
    val frequency: Float,
    val confidence: Float,
    val isVoiced: Boolean
)

/**
 * FormantsResult data class matching Rust #[repr(C)] FormantsResult struct.
 * Returned by value from nativeExtractFormants JNI function.
 */
data class FormantsResult(
    val f1: Float,
    val f2: Float,
    val f3: Float,
    val bw1: Float,
    val bw2: Float,
    val bw3: Float
)

/**
 * HNRResult data class matching Rust #[repr(C)] HNRResult struct.
 * Returned by value from nativeCalculateHNR JNI function.
 *
 * HNR (Harmonics-to-Noise Ratio) measures the ratio of harmonic to noise energy:
 * - Higher HNR (18-25 dB): Clear, less breathy voice
 * - Lower HNR (12-18 dB): Softer, more breathy voice
 */
data class HNRResult(
    val hnr: Float,
    val f0: Float,
    val isVoiced: Boolean
)

/**
 * H1H2Result data class matching Rust #[repr(C)] H1H2Result struct.
 * Returned by value from nativeCalculateH1H2 JNI function.
 *
 * H1-H2 measures the difference between first and second harmonic amplitudes:
 * - Higher H1-H2 (>5 dB): Lighter, breathier vocal quality
 * - Lower H1-H2 (<0 dB): Fuller, heavier vocal quality
 */
data class H1H2Result(
    val h1h2: Float,
    val h1AmplitudeDb: Float,
    val h2AmplitudeDb: Float,
    val f0: Float
)

/**
 * RustBridge provides JNI bindings to the Rust loqa-voice-dsp library.
 *
 * This class handles:
 * - Loading the native Rust library (libloqa_voice_dsp.so)
 * - Declaring external JNI function signatures for Rust DSP functions
 * - Providing Kotlin wrapper functions with error handling
 *
 * Memory Management Notes:
 * - JNI automatically handles FloatArray marshalling for primitive arrays
 * - Structs (PitchResult, FormantsResult) are returned by value (no heap allocation)
 * - No manual memory management needed (simpler than iOS FFI)
 * - All native calls are wrapped in try-catch for error handling
 *
 * Implementation Status:
 * - Story 1.4: Placeholder JNI function declarations
 * - Story 2.3: Real FFT implementation
 * - Story 3.3: Pitch and formant implementations (this story)
 * - Story 4.2: Spectrum analysis implementation
 */
object RustBridge {
    init {
        try {
            System.loadLibrary("loqa_voice_dsp")
        } catch (e: UnsatisfiedLinkError) {
            throw RuntimeException(
                "Failed to load native library 'loqa_voice_dsp'. " +
                "Ensure the .so files are included in jniLibs directory.",
                e
            )
        }
    }

    // ============================================================================
    // External JNI Function Declarations (C ABI from Rust)
    // ============================================================================

    /**
     * JNI native function for FFT computation.
     *
     * Implemented in Story 2.3. Maps to Rust function:
     * Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeComputeFFT
     *
     * This external function is resolved by JNI to the Rust implementation in lib.rs.
     * The Rust function delegates to compute_fft_rust with a default sample rate of 44100 Hz.
     *
     * @param buffer Input audio samples as FloatArray (JNI auto-converts to *const f32)
     * @param fftSize FFT size (must be power of 2, range 256-8192)
     * @param windowType Window function type (0=none, 1=hanning, 2=hamming, 3=blackman) - ignored in v0.1.0
     * @return Magnitude spectrum as FloatArray (length = fftSize / 2 + 1)
     */
    external fun nativeComputeFFT(
        buffer: FloatArray,
        fftSize: Int,
        windowType: Int
    ): FloatArray

    /**
     * JNI native function for pitch detection.
     *
     * Implemented in Story 3.1/3.3. Maps to Rust function:
     * Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeDetectPitch
     *
     * This external function is resolved by JNI to the Rust implementation in lib.rs.
     * The Rust function uses YIN algorithm for pitch detection.
     *
     * @param buffer Input audio samples as FloatArray (JNI auto-converts to *const f32)
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @return PitchResult struct with frequency, confidence, and isVoiced
     */
    external fun nativeDetectPitch(
        buffer: FloatArray,
        sampleRate: Int
    ): PitchResult

    /**
     * JNI native function for formant extraction.
     *
     * Implemented in Story 3.2/3.3. Maps to Rust function:
     * Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeExtractFormants
     *
     * This external function is resolved by JNI to the Rust implementation in lib.rs.
     * The Rust function uses LPC analysis for formant extraction.
     *
     * @param buffer Input audio samples as FloatArray (JNI auto-converts to *const f32)
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param lpcOrder LPC order (0 for default: sampleRate / 1000 + 2)
     * @return FormantsResult struct with f1, f2, f3 and bandwidths
     */
    external fun nativeExtractFormants(
        buffer: FloatArray,
        sampleRate: Int,
        lpcOrder: Int
    ): FormantsResult

    /**
     * Placeholder JNI function for spectral analysis.
     *
     * This will be implemented in Story 4.1/4.2 to call Rust's analyze_spectrum_rust.
     *
     * @param buffer Input audio samples as FloatArray
     * @param sampleRate Sample rate in Hz
     * @return Map with keys: "centroid" (Float), "rolloff" (Float), "tilt" (Float)
     */
    external fun nativeAnalyzeSpectrum(
        buffer: FloatArray,
        sampleRate: Int
    ): Map<String, Any>

    /**
     * JNI native function for HNR (Harmonics-to-Noise Ratio) calculation.
     *
     * Maps to Rust function:
     * Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeCalculateHNR
     *
     * This external function is resolved by JNI to the Rust implementation in lib.rs.
     * The Rust function uses Boersma's autocorrelation method for HNR calculation.
     *
     * @param buffer Input audio samples as FloatArray (JNI auto-converts to *const f32)
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param minFreq Minimum F0 frequency to search (typically 75 Hz)
     * @param maxFreq Maximum F0 frequency to search (typically 500 Hz)
     * @return HNRResult struct with hnr (dB), f0 (Hz), and isVoiced flag
     */
    external fun nativeCalculateHNR(
        buffer: FloatArray,
        sampleRate: Int,
        minFreq: Float,
        maxFreq: Float
    ): HNRResult

    /**
     * JNI native function for H1-H2 amplitude difference calculation.
     *
     * Maps to Rust function:
     * Java_com_loqalabs_loqaexpodsp_RustJNI_RustBridge_nativeCalculateH1H2
     *
     * This external function is resolved by JNI to the Rust implementation in lib.rs.
     * H1-H2 measures the difference between first and second harmonic amplitudes.
     *
     * @param buffer Input audio samples as FloatArray (JNI auto-converts to *const f32)
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param f0 Fundamental frequency in Hz, or 0.0 to auto-detect
     * @return H1H2Result struct with h1h2, h1AmplitudeDb, h2AmplitudeDb, and f0
     */
    external fun nativeCalculateH1H2(
        buffer: FloatArray,
        sampleRate: Int,
        f0: Float
    ): H1H2Result

    // ============================================================================
    // Kotlin Wrapper Functions with Error Handling
    // ============================================================================

    /**
     * Computes FFT on audio buffer with error handling.
     *
     * Implemented in Story 2.3. This wrapper calls the native JNI function and
     * provides Kotlin-friendly error handling.
     *
     * @param buffer Input audio samples
     * @param fftSize FFT size (power of 2, range 256-8192)
     * @param windowType Window function type (0=none, 1=hanning, 2=hamming, 3=blackman) - ignored in v0.1.0
     * @return Magnitude spectrum (length = fftSize / 2 + 1)
     * @throws RuntimeException if JNI call fails
     */
    fun computeFFT(buffer: FloatArray, fftSize: Int, windowType: Int): FloatArray {
        return try {
            nativeComputeFFT(buffer, fftSize, windowType)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeComputeFFT failed", e)
        }
    }

    /**
     * Detects pitch from audio buffer with error handling.
     *
     * Implemented in Story 3.3. This wrapper calls the native JNI function and
     * provides Kotlin-friendly error handling.
     *
     * @param buffer Input audio samples
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @return PitchResult with frequency, confidence, and isVoiced
     * @throws RuntimeException if JNI call fails
     */
    fun detectPitch(
        buffer: FloatArray,
        sampleRate: Int
    ): PitchResult {
        return try {
            nativeDetectPitch(buffer, sampleRate)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeDetectPitch failed", e)
        }
    }

    /**
     * Extracts formants from audio buffer with error handling.
     *
     * Implemented in Story 3.3. This wrapper calls the native JNI function and
     * provides Kotlin-friendly error handling.
     *
     * @param buffer Input audio samples
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param lpcOrder LPC order (0 for default: sampleRate / 1000 + 2)
     * @return FormantsResult with f1, f2, f3 and bandwidths
     * @throws RuntimeException if JNI call fails
     */
    fun extractFormants(
        buffer: FloatArray,
        sampleRate: Int,
        lpcOrder: Int
    ): FormantsResult {
        return try {
            nativeExtractFormants(buffer, sampleRate, lpcOrder)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeExtractFormants failed", e)
        }
    }

    /**
     * Analyzes spectral features of audio buffer with error handling.
     *
     * Note: This is a placeholder wrapper. Full implementation in Story 4.2.
     *
     * @param buffer Input audio samples
     * @param sampleRate Sample rate in Hz
     * @return Spectral analysis result
     * @throws RuntimeException if JNI call fails
     */
    fun analyzeSpectrum(buffer: FloatArray, sampleRate: Int): Map<String, Any> {
        return try {
            nativeAnalyzeSpectrum(buffer, sampleRate)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeAnalyzeSpectrum failed", e)
        }
    }

    /**
     * Calculates HNR (Harmonics-to-Noise Ratio) with error handling.
     *
     * HNR measures the ratio of harmonic to noise energy in voice:
     * - Higher HNR (18-25 dB): Clear, less breathy voice
     * - Lower HNR (12-18 dB): Softer, more breathy voice
     *
     * @param buffer Input audio samples
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param minFreq Minimum F0 frequency to search (default: 75 Hz)
     * @param maxFreq Maximum F0 frequency to search (default: 500 Hz)
     * @return HNRResult with hnr (dB), f0 (Hz), and isVoiced flag
     * @throws RuntimeException if JNI call fails
     */
    fun calculateHNR(
        buffer: FloatArray,
        sampleRate: Int,
        minFreq: Float = 75.0f,
        maxFreq: Float = 500.0f
    ): HNRResult {
        return try {
            nativeCalculateHNR(buffer, sampleRate, minFreq, maxFreq)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeCalculateHNR failed", e)
        }
    }

    /**
     * Calculates H1-H2 amplitude difference with error handling.
     *
     * H1-H2 measures the difference between first and second harmonic amplitudes:
     * - Higher H1-H2 (>5 dB): Lighter, breathier vocal quality
     * - Lower H1-H2 (<0 dB): Fuller, heavier vocal quality
     *
     * @param buffer Input audio samples
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param f0 Fundamental frequency in Hz, or 0.0 to auto-detect
     * @return H1H2Result with h1h2, h1AmplitudeDb, h2AmplitudeDb, and f0
     * @throws RuntimeException if JNI call fails
     */
    fun calculateH1H2(
        buffer: FloatArray,
        sampleRate: Int,
        f0: Float = 0.0f
    ): H1H2Result {
        return try {
            nativeCalculateH1H2(buffer, sampleRate, f0)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeCalculateH1H2 failed", e)
        }
    }
}
