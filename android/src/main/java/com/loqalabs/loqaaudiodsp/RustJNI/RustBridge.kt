package com.loqalabs.loqaexpodsp.RustJNI

/**
 * PitchResult data class matching Rust #[repr(C)] PitchResultFFI struct.
 * Returned by value from nativeDetectPitch JNI function.
 *
 * v0.4.0 CHANGES:
 * - Added voicedProbability field for soft voiced/unvoiced decisions
 * - nativeDetectPitch now takes minFrequency and maxFrequency parameters
 */
data class PitchResult(
    val frequency: Float,
    val confidence: Float,
    val isVoiced: Boolean,
    val voicedProbability: Float
)

/**
 * FormantsResult data class matching Rust #[repr(C)] FormantResultFFI struct.
 * Returned by value from nativeExtractFormants JNI function.
 *
 * v0.4.0 BREAKING CHANGE:
 * - Removed bw1, bw2, bw3 bandwidth fields
 * - Added confidence score (0-1) indicating reliability of detection
 */
data class FormantsResult(
    val f1: Float,
    val f2: Float,
    val f3: Float,
    val confidence: Float
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
 * PitchTrack data class for HMM-smoothed Viterbi decoding results (v0.5.0).
 *
 * Unlike per-frame PitchResult, this contains the globally optimal pitch track
 * across all frames, reducing octave errors from ~8-12% to ≤3%.
 *
 * @property pitchTrack Pitch estimates per frame in Hz (0.0 = unvoiced)
 * @property voicedProbabilities Voiced probability per frame [0.0, 1.0]
 * @property timestamps Frame timestamps in seconds from buffer start
 */
data class PitchTrackResult(
    val pitchTrack: FloatArray,
    val voicedProbabilities: FloatArray,
    val timestamps: FloatArray
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as PitchTrackResult
        return pitchTrack.contentEquals(other.pitchTrack) &&
            voicedProbabilities.contentEquals(other.voicedProbabilities) &&
            timestamps.contentEquals(other.timestamps)
    }

    override fun hashCode(): Int {
        var result = pitchTrack.contentHashCode()
        result = 31 * result + voicedProbabilities.contentHashCode()
        result = 31 * result + timestamps.contentHashCode()
        return result
    }
}

/**
 * VoiceAnalyzerConfig data class for VoiceAnalyzer initialization.
 *
 * @property sampleRate Sample rate in Hz (8000-48000)
 * @property minFrequency Minimum detectable frequency in Hz (default: 80)
 * @property maxFrequency Maximum detectable frequency in Hz (default: 400)
 * @property frameSize Frame size in samples (default: 2048)
 * @property hopSize Hop size in samples (default: frameSize / 4)
 */
data class VoiceAnalyzerConfig(
    val sampleRate: Int,
    val minFrequency: Float = 80.0f,
    val maxFrequency: Float = 400.0f,
    val frameSize: Int = 2048,
    val hopSize: Int = 512
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
     * The Rust function uses pYIN algorithm for pitch detection (v0.4.0).
     *
     * v0.4.0 CHANGES:
     * - Added minFrequency and maxFrequency parameters
     * - Returns voicedProbability in PitchResult
     * - Uses pYIN algorithm with HMM smoothing
     *
     * @param buffer Input audio samples as FloatArray (JNI auto-converts to *const f32)
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param minFrequency Minimum detectable frequency in Hz (default: 80)
     * @param maxFrequency Maximum detectable frequency in Hz (default: 400)
     * @return PitchResult struct with frequency, confidence, isVoiced, and voicedProbability
     */
    external fun nativeDetectPitch(
        buffer: FloatArray,
        sampleRate: Int,
        minFrequency: Float,
        maxFrequency: Float
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
     * v0.4.0 BREAKING CHANGE:
     * - FormantsResult now returns confidence instead of bandwidths (bw1, bw2, bw3)
     *
     * @param buffer Input audio samples as FloatArray (JNI auto-converts to *const f32)
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param lpcOrder LPC order (0 for default: sampleRate / 1000 + 2)
     * @return FormantsResult struct with f1, f2, f3 and confidence
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
    // VoiceAnalyzer JNI Functions (v0.3.0 Streaming API)
    // ============================================================================

    /**
     * JNI native function to create a VoiceAnalyzer instance.
     *
     * Returns a handle (Long) that must be freed with nativeVoiceAnalyzerFree.
     *
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param minFrequency Minimum detectable frequency in Hz
     * @param maxFrequency Maximum detectable frequency in Hz
     * @param frameSize Frame size in samples
     * @param hopSize Hop size in samples
     * @return Handle to the analyzer (Long pointer), or 0 if creation failed
     */
    external fun nativeVoiceAnalyzerNew(
        sampleRate: Int,
        minFrequency: Float,
        maxFrequency: Float,
        frameSize: Int,
        hopSize: Int
    ): Long

    /**
     * JNI native function to process audio through a VoiceAnalyzer.
     *
     * Returns an array of PitchResult for each frame processed.
     *
     * @param handle Analyzer handle from nativeVoiceAnalyzerNew
     * @param buffer Audio samples to process
     * @return Array of PitchResult for each frame
     */
    external fun nativeVoiceAnalyzerProcessStream(
        handle: Long,
        buffer: FloatArray
    ): Array<PitchResult>

    /**
     * JNI native function to reset a VoiceAnalyzer's state.
     *
     * @param handle Analyzer handle from nativeVoiceAnalyzerNew
     */
    external fun nativeVoiceAnalyzerReset(handle: Long)

    /**
     * JNI native function to free a VoiceAnalyzer instance.
     *
     * @param handle Analyzer handle from nativeVoiceAnalyzerNew
     */
    external fun nativeVoiceAnalyzerFree(handle: Long)

    /**
     * JNI native function to process buffer with HMM-smoothed Viterbi decoding (v0.5.0).
     *
     * Unlike nativeVoiceAnalyzerProcessStream which treats frames independently,
     * this method uses Viterbi decoding to find the globally optimal pitch track,
     * reducing octave errors from ~8-12% to ≤3%.
     *
     * @param handle Analyzer handle from nativeVoiceAnalyzerNew
     * @param buffer Complete audio buffer to process
     * @return PitchTrackResult with pitchTrack, voicedProbabilities, and timestamps
     */
    external fun nativeVoiceAnalyzerProcessBuffer(
        handle: Long,
        buffer: FloatArray
    ): PitchTrackResult

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
     * v0.4.0 CHANGES:
     * - Added minFrequency and maxFrequency parameters (with defaults for human voice)
     * - Returns voicedProbability in PitchResult
     * - Uses pYIN algorithm with HMM smoothing for better accuracy
     *
     * @param buffer Input audio samples
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param minFrequency Minimum detectable frequency in Hz (default: 80)
     * @param maxFrequency Maximum detectable frequency in Hz (default: 400)
     * @return PitchResult with frequency, confidence, isVoiced, and voicedProbability
     * @throws RuntimeException if JNI call fails
     */
    fun detectPitch(
        buffer: FloatArray,
        sampleRate: Int,
        minFrequency: Float = 80.0f,
        maxFrequency: Float = 400.0f
    ): PitchResult {
        return try {
            nativeDetectPitch(buffer, sampleRate, minFrequency, maxFrequency)
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
     * v0.4.0 BREAKING CHANGE:
     * - FormantsResult now returns confidence instead of bandwidths (bw1, bw2, bw3)
     *
     * @param buffer Input audio samples
     * @param sampleRate Sample rate in Hz (8000-48000)
     * @param lpcOrder LPC order (0 for default: sampleRate / 1000 + 2)
     * @return FormantsResult with f1, f2, f3 and confidence
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

    // ============================================================================
    // VoiceAnalyzer Wrapper Functions (v0.3.0 Streaming API)
    // ============================================================================

    /**
     * Creates a new VoiceAnalyzer instance with the given configuration.
     *
     * @param config VoiceAnalyzerConfig with sample rate and frequency range
     * @return Handle to the analyzer (must be freed with freeVoiceAnalyzer)
     * @throws RuntimeException if creation fails
     */
    fun createVoiceAnalyzer(config: VoiceAnalyzerConfig): Long {
        return try {
            val handle = nativeVoiceAnalyzerNew(
                config.sampleRate,
                config.minFrequency,
                config.maxFrequency,
                config.frameSize,
                config.hopSize
            )
            if (handle == 0L) {
                throw RuntimeException("Failed to create VoiceAnalyzer")
            }
            handle
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeVoiceAnalyzerNew failed", e)
        }
    }

    /**
     * Process audio samples through the VoiceAnalyzer.
     *
     * @param handle Analyzer handle from createVoiceAnalyzer
     * @param buffer Audio samples to process
     * @return Array of PitchResult for each frame
     * @throws RuntimeException if processing fails
     */
    fun processAudioWithAnalyzer(
        handle: Long,
        buffer: FloatArray
    ): Array<PitchResult> {
        return try {
            nativeVoiceAnalyzerProcessStream(handle, buffer)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeVoiceAnalyzerProcessStream failed", e)
        }
    }

    /**
     * Reset the VoiceAnalyzer state for reuse with new audio.
     *
     * @param handle Analyzer handle from createVoiceAnalyzer
     * @throws RuntimeException if reset fails
     */
    fun resetVoiceAnalyzer(handle: Long) {
        try {
            nativeVoiceAnalyzerReset(handle)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeVoiceAnalyzerReset failed", e)
        }
    }

    /**
     * Free a VoiceAnalyzer instance.
     *
     * @param handle Analyzer handle from createVoiceAnalyzer
     */
    fun freeVoiceAnalyzer(handle: Long) {
        try {
            nativeVoiceAnalyzerFree(handle)
        } catch (e: Exception) {
            // Log but don't throw - this is cleanup
        }
    }

    /**
     * Process audio buffer with HMM-smoothed Viterbi decoding (v0.5.0).
     *
     * Unlike processAudioWithAnalyzer which treats frames independently,
     * this method uses Viterbi decoding to find the globally optimal pitch track,
     * reducing octave errors from ~8-12% to ≤3% and producing smoother contours.
     *
     * Best suited for offline analysis of complete utterances (typically < 60 seconds).
     * For longer recordings, segment into utterances first.
     *
     * @param handle Analyzer handle from createVoiceAnalyzer
     * @param buffer Complete audio buffer to process
     * @return PitchTrackResult with smoothed pitch estimates
     * @throws RuntimeException if processing fails
     */
    fun processBufferWithAnalyzer(
        handle: Long,
        buffer: FloatArray
    ): PitchTrackResult {
        return try {
            nativeVoiceAnalyzerProcessBuffer(handle, buffer)
        } catch (e: Exception) {
            throw RuntimeException("JNI call to nativeVoiceAnalyzerProcessBuffer failed", e)
        }
    }
}
