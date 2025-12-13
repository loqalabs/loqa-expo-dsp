package com.loqalabs.loqaexpodsp

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.loqalabs.loqaexpodsp.RustJNI.RustBridge
import com.loqalabs.loqaexpodsp.RustJNI.VoiceAnalyzerConfig

/**
 * LoqaExpoDspModule provides Expo Module API for accessing Rust DSP functions.
 *
 * This module exposes async functions for:
 * - computeFFT: Fast Fourier Transform analysis
 * - detectPitch: pYIN pitch detection algorithm (v0.4.0)
 * - extractFormants: LPC formant extraction
 * - analyzeSpectrum: Spectral feature analysis
 * - calculateHNR: Harmonics-to-Noise Ratio
 * - calculateH1H2: H1-H2 amplitude difference
 *
 * All functions run on background threads automatically via Expo's AsyncFunction.
 * Results are returned via Promises for async/await support in JavaScript/TypeScript.
 *
 * v0.4.0 CHANGES:
 * - detectPitch now uses pYIN algorithm with min/max frequency parameters
 * - detectPitch returns voicedProbability in addition to isVoiced
 * - extractFormants returns confidence instead of bandwidths
 */
class LoqaExpoDspModule : Module() {
  // Module definition for Expo Modules API
  override fun definition() = ModuleDefinition {
    // Module name that JavaScript will use to require this module
    Name("LoqaExpoDsp")

    // ============================================================================
    // Async Function: computeFFT
    // ============================================================================

    /**
     * Computes Fast Fourier Transform (FFT) on audio buffer.
     *
     * Implementation completed in Story 2.3.
     * Expo automatically runs this on a background thread.
     *
     * @param buffer Audio samples as FloatArray
     * @param options Map with optional keys: "fftSize" (Int), "windowType" (String), "sampleRate" (Double)
     * @return Map with keys: "magnitude" (FloatArray), "frequencies" (FloatArray)
     * @throws Exception with error code "VALIDATION_ERROR" or "FFT_ERROR"
     */
    AsyncFunction("computeFFT") { buffer: FloatArray, options: Map<String, Any?> ->
      // Extract options with defaults
      val fftSize = (options["fftSize"] as? Int) ?: buffer.size
      val windowTypeString = (options["windowType"] as? String) ?: "hanning"
      val sampleRate = (options["sampleRate"] as? Double) ?: 44100.0

      // Validate buffer is not empty (AC2)
      if (buffer.isEmpty()) {
        throw Exception("VALIDATION_ERROR: Buffer cannot be empty")
      }

      // Validate fftSize is power of 2 (AC2)
      if (fftSize <= 0 || (fftSize and (fftSize - 1)) != 0) {
        throw Exception("VALIDATION_ERROR: FFT size must be a power of 2, got $fftSize")
      }

      // Validate fftSize is in range 256-8192 (AC2)
      if (fftSize < 256 || fftSize > 8192) {
        throw Exception("VALIDATION_ERROR: FFT size must be between 256 and 8192, got $fftSize")
      }

      // Map windowType string to integer (none=0, hanning=1, hamming=2, blackman=3)
      val windowType: Int = when (windowTypeString.lowercase()) {
        "none" -> 0
        "hanning" -> 1
        "hamming" -> 2
        "blackman" -> 3
        else -> throw Exception("VALIDATION_ERROR: Invalid window type '$windowTypeString'. Must be one of: none, hanning, hamming, blackman")
      }

      try {
        // Call Rust FFT function via JNI (AC3)
        // JNI handles FloatArray marshalling automatically (AC4)
        val magnitude = RustBridge.computeFFT(buffer, fftSize, windowType)

        // Build frequencies array: freq[i] = (sampleRate / fftSize) * i (AC5)
        val frequencies = FloatArray(magnitude.size) { i ->
          (sampleRate / fftSize * i).toFloat()
        }

        // Return result map (AC5)
        mapOf(
          "magnitude" to magnitude,
          "frequencies" to frequencies
        )
      } catch (e: RuntimeException) {
        // Catch JNI/Rust errors and reject with FFT_ERROR code (AC6)
        throw Exception("FFT_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        // Catch any other unexpected errors (AC6)
        throw Exception("FFT_ERROR: Unexpected error during FFT computation - ${e.message}", e)
      }
    }

    // ============================================================================
    // Async Function: detectPitch
    // ============================================================================

    /**
     * Detects pitch using pYIN algorithm (v0.4.0).
     *
     * Expo automatically runs this on a background thread.
     *
     * v0.4.0 CHANGES:
     * - Now uses pYIN algorithm with HMM smoothing for better accuracy
     * - Accepts minFrequency and maxFrequency parameters
     * - Returns voicedProbability in addition to isVoiced
     *
     * @param buffer Audio samples as FloatArray
     * @param sampleRate Sample rate in Hz (Int)
     * @param options Map with optional keys: "minFrequency" (Double), "maxFrequency" (Double)
     * @return Map with keys: "frequency" (Float or null), "confidence" (Float), "isVoiced" (Boolean), "voicedProbability" (Float)
     * @throws Exception with error code "PITCH_ERROR"
     */
    AsyncFunction("detectPitch") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any?> ->
      try {
        // Extract options with defaults for human voice range
        val minFrequency = (options["minFrequency"] as? Double)?.toFloat() ?: 80.0f
        val maxFrequency = (options["maxFrequency"] as? Double)?.toFloat() ?: 400.0f

        // Validate buffer is not empty (AC3)
        if (buffer.isEmpty()) {
          throw Exception("VALIDATION_ERROR: Buffer cannot be empty")
        }

        // Validate sample rate (AC3)
        if (sampleRate < 8000 || sampleRate > 48000) {
          throw Exception("VALIDATION_ERROR: Sample rate must be between 8000 and 48000 Hz, got $sampleRate")
        }

        // Call Rust pYIN pitch detection via JNI with min/max frequency (v0.4.0)
        val result = RustBridge.detectPitch(buffer, sampleRate, minFrequency, maxFrequency)

        // Convert PitchResult to Map for TypeScript
        // frequency is null if not voiced or 0.0
        // v0.4.0: Now includes voicedProbability
        mapOf(
          "frequency" to if (result.isVoiced && result.frequency > 0) result.frequency else null,
          "confidence" to result.confidence,
          "isVoiced" to result.isVoiced,
          "voicedProbability" to result.voicedProbability
        )
      } catch (e: RuntimeException) {
        // Catch JNI/Rust errors and throw with PITCH_ERROR code
        throw Exception("PITCH_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        // Catch validation errors and other unexpected errors
        throw Exception("PITCH_ERROR: ${e.message}", e)
      }
    }

    // ============================================================================
    // Async Function: extractFormants
    // ============================================================================

    /**
     * Extracts formant frequencies (F1, F2, F3) using LPC analysis.
     *
     * Expo automatically runs this on a background thread.
     *
     * v0.4.0 BREAKING CHANGE:
     * - Now returns confidence score instead of bandwidths
     *
     * @param buffer Audio samples as FloatArray
     * @param sampleRate Sample rate in Hz (Int)
     * @param options Map with optional keys: "lpcOrder" (Int)
     * @return Map with keys: "f1" (Float), "f2" (Float), "f3" (Float), "confidence" (Float)
     * @throws Exception with error code "FORMANTS_ERROR"
     */
    AsyncFunction("extractFormants") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any?> ->
      try {
        // Extract optional LPC order from options
        // If not provided, pass 0 to Rust to use default (sampleRate / 1000 + 2)
        val lpcOrder = (options["lpcOrder"] as? Int) ?: 0

        // Validate buffer is not empty (AC3)
        if (buffer.isEmpty()) {
          throw Exception("VALIDATION_ERROR: Buffer cannot be empty")
        }

        // Validate sample rate (AC3)
        if (sampleRate < 8000 || sampleRate > 48000) {
          throw Exception("VALIDATION_ERROR: Sample rate must be between 8000 and 48000 Hz, got $sampleRate")
        }

        // Call Rust formant extraction via JNI
        val result = RustBridge.extractFormants(buffer, sampleRate, lpcOrder)

        // Convert FormantsResult to Map for TypeScript
        // v0.4.0: Now returns confidence instead of bandwidths
        mapOf(
          "f1" to result.f1,
          "f2" to result.f2,
          "f3" to result.f3,
          "confidence" to result.confidence
        )
      } catch (e: RuntimeException) {
        // Catch JNI/Rust errors and throw with FORMANTS_ERROR code
        throw Exception("FORMANTS_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        // Catch validation errors and other unexpected errors
        throw Exception("FORMANTS_ERROR: ${e.message}", e)
      }
    }

    // ============================================================================
    // Async Function: analyzeSpectrum
    // ============================================================================

    /**
     * Analyzes spectral features (centroid, rolloff, tilt).
     *
     * Implemented in Story 4.2.
     * Expo automatically runs this on a background thread.
     *
     * @param buffer Audio samples as FloatArray
     * @param sampleRate Sample rate in Hz (Int)
     * @param options Map with optional configuration
     * @return Map with keys: "centroid" (Float), "rolloff" (Float), "tilt" (Float)
     * @throws Exception with error code "SPECTRUM_ERROR"
     */
    AsyncFunction("analyzeSpectrum") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any?> ->
      try {
        // Validate buffer is not empty (AC3)
        if (buffer.isEmpty()) {
          throw Exception("VALIDATION_ERROR: Buffer cannot be empty")
        }

        // Validate sample rate (AC3)
        if (sampleRate < 8000 || sampleRate > 48000) {
          throw Exception("VALIDATION_ERROR: Sample rate must be between 8000 and 48000 Hz, got $sampleRate")
        }

        // Call Rust spectral analysis via JNI (AC1, AC2)
        // JNI handles FloatArray marshalling automatically (AC5)
        val result = RustBridge.analyzeSpectrum(buffer, sampleRate)

        // Return result map with spectral features (AC4)
        result
      } catch (e: RuntimeException) {
        // Catch JNI/Rust errors and throw with SPECTRUM_ERROR code (AC4)
        throw Exception("SPECTRUM_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        // Catch validation errors and other unexpected errors (AC4)
        throw Exception("SPECTRUM_ERROR: ${e.message}", e)
      }
    }

    // ============================================================================
    // Async Function: calculateHNR
    // ============================================================================

    /**
     * Calculates Harmonics-to-Noise Ratio (HNR) for voice quality analysis.
     *
     * @param buffer Audio samples as FloatArray
     * @param sampleRate Sample rate in Hz (Int)
     * @param options Map with optional keys: "minFreq" (Double), "maxFreq" (Double)
     * @return Map with keys: "hnr" (Float), "f0" (Float), "isVoiced" (Boolean)
     * @throws Exception with error code "HNR_ERROR"
     */
    AsyncFunction("calculateHNR") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any?> ->
      try {
        // Extract options with defaults
        val minFreq = (options["minFreq"] as? Double)?.toFloat() ?: 75.0f
        val maxFreq = (options["maxFreq"] as? Double)?.toFloat() ?: 500.0f

        // Validate buffer is not empty
        if (buffer.isEmpty()) {
          throw Exception("VALIDATION_ERROR: Buffer cannot be empty")
        }

        // Validate sample rate
        if (sampleRate < 8000 || sampleRate > 48000) {
          throw Exception("VALIDATION_ERROR: Sample rate must be between 8000 and 48000 Hz, got $sampleRate")
        }

        // Call Rust HNR calculation via JNI
        val result = RustBridge.calculateHNR(buffer, sampleRate, minFreq, maxFreq)

        // Convert HNRResult to Map for TypeScript
        mapOf(
          "hnr" to result.hnr,
          "f0" to result.f0,
          "isVoiced" to result.isVoiced
        )
      } catch (e: RuntimeException) {
        throw Exception("HNR_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        throw Exception("HNR_ERROR: ${e.message}", e)
      }
    }

    // ============================================================================
    // Async Function: calculateH1H2
    // ============================================================================

    /**
     * Calculates H1-H2 amplitude difference for vocal weight analysis.
     *
     * @param buffer Audio samples as FloatArray
     * @param sampleRate Sample rate in Hz (Int)
     * @param options Map with optional keys: "f0" (Double)
     * @return Map with keys: "h1h2" (Float), "h1AmplitudeDb" (Float), "h2AmplitudeDb" (Float), "f0" (Float)
     * @throws Exception with error code "H1H2_ERROR"
     */
    AsyncFunction("calculateH1H2") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any?> ->
      try {
        // Extract optional f0 (0 means auto-detect)
        val f0 = (options["f0"] as? Double)?.toFloat() ?: 0.0f

        // Validate buffer is not empty
        if (buffer.isEmpty()) {
          throw Exception("VALIDATION_ERROR: Buffer cannot be empty")
        }

        // Validate sample rate
        if (sampleRate < 8000 || sampleRate > 48000) {
          throw Exception("VALIDATION_ERROR: Sample rate must be between 8000 and 48000 Hz, got $sampleRate")
        }

        // Call Rust H1-H2 calculation via JNI
        val result = RustBridge.calculateH1H2(buffer, sampleRate, f0)

        // Convert H1H2Result to Map for TypeScript
        mapOf(
          "h1h2" to result.h1h2,
          "h1AmplitudeDb" to result.h1AmplitudeDb,
          "h2AmplitudeDb" to result.h2AmplitudeDb,
          "f0" to result.f0
        )
      } catch (e: RuntimeException) {
        throw Exception("H1H2_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        throw Exception("H1H2_ERROR: ${e.message}", e)
      }
    }

    // ============================================================================
    // VoiceAnalyzer Streaming API (v0.3.0)
    // ============================================================================

    /**
     * Creates a new VoiceAnalyzer instance with configuration.
     *
     * @param config Map with keys: "sampleRate" (Int), optional: "minFrequency", "maxFrequency", "frameSize", "hopSize"
     * @return Map with keys: "id" (String), "config" (Map)
     * @throws Exception with error code "ANALYZER_ERROR"
     */
    AsyncFunction("createVoiceAnalyzer") { config: Map<String, Any?> ->
      try {
        // Extract config with defaults
        val sampleRate = (config["sampleRate"] as? Int)
          ?: throw Exception("VALIDATION_ERROR: sampleRate is required")
        val minFrequency = (config["minFrequency"] as? Double)?.toFloat() ?: 80.0f
        val maxFrequency = (config["maxFrequency"] as? Double)?.toFloat() ?: 400.0f
        val frameSize = (config["frameSize"] as? Int) ?: 2048
        val hopSize = (config["hopSize"] as? Int) ?: (frameSize / 4)

        // Validate sample rate
        if (sampleRate < 8000 || sampleRate > 48000) {
          throw Exception("VALIDATION_ERROR: Sample rate must be between 8000 and 48000 Hz, got $sampleRate")
        }

        // Create config
        val analyzerConfig = VoiceAnalyzerConfig(
          sampleRate = sampleRate,
          minFrequency = minFrequency,
          maxFrequency = maxFrequency,
          frameSize = frameSize,
          hopSize = hopSize
        )

        // Create analyzer
        val handle = RustBridge.createVoiceAnalyzer(analyzerConfig)

        // Store handle and return ID
        val id = storeAnalyzer(handle, analyzerConfig)

        mapOf(
          "id" to id,
          "config" to mapOf(
            "sampleRate" to sampleRate,
            "minFrequency" to minFrequency,
            "maxFrequency" to maxFrequency,
            "frameSize" to frameSize,
            "hopSize" to hopSize
          )
        )
      } catch (e: RuntimeException) {
        throw Exception("ANALYZER_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        throw Exception("ANALYZER_ERROR: ${e.message}", e)
      }
    }

    /**
     * Process audio through VoiceAnalyzer and return aggregated results.
     *
     * @param analyzerId Analyzer ID from createVoiceAnalyzer
     * @param buffer Audio samples as FloatArray
     * @return VoiceAnalyzerResult map with frames and statistics
     * @throws Exception with error code "ANALYZER_ERROR"
     */
    AsyncFunction("analyzeClip") { analyzerId: String, buffer: FloatArray ->
      try {
        // Get analyzer handle
        val (handle, config) = getAnalyzer(analyzerId)
          ?: throw Exception("VALIDATION_ERROR: Invalid analyzer ID: $analyzerId")

        if (buffer.isEmpty()) {
          throw Exception("VALIDATION_ERROR: Buffer cannot be empty")
        }

        // Process audio through analyzer
        val frames = RustBridge.processAudioWithAnalyzer(handle, buffer)

        // Calculate aggregate statistics
        val voicedFrames = frames.filter { it.isVoiced }
        val voicedFrequencies = voicedFrames
          .filter { it.frequency > 0 }
          .map { it.frequency }

        // Convert frames to maps
        val frameMaps = frames.map { frame ->
          mapOf(
            "frequency" to if (frame.isVoiced && frame.frequency > 0) frame.frequency else null,
            "confidence" to frame.confidence,
            "isVoiced" to frame.isVoiced,
            "voicedProbability" to frame.voicedProbability
          )
        }

        // Calculate statistics
        val medianPitch: Float? = if (voicedFrequencies.isEmpty()) null else {
          val sorted = voicedFrequencies.sorted()
          val mid = sorted.size / 2
          if (sorted.size % 2 == 0) {
            (sorted[mid - 1] + sorted[mid]) / 2
          } else {
            sorted[mid]
          }
        }

        val meanPitch: Float? = if (voicedFrequencies.isEmpty()) null else {
          voicedFrequencies.sum() / voicedFrequencies.size
        }

        val pitchStdDev: Float? = if (voicedFrequencies.size < 2 || meanPitch == null) null else {
          val variance = voicedFrequencies.map { (it - meanPitch) * (it - meanPitch) }.sum() / voicedFrequencies.size
          kotlin.math.sqrt(variance)
        }

        val meanConfidence: Float? = if (voicedFrames.isEmpty()) null else {
          voicedFrames.map { it.confidence }.sum() / voicedFrames.size
        }

        val meanVoicedProbability: Float = if (frames.isEmpty()) 0f else {
          frames.map { it.voicedProbability }.sum() / frames.size
        }

        mapOf(
          "frames" to frameMaps,
          "frameCount" to frames.size,
          "voicedFrameCount" to voicedFrames.size,
          "medianPitch" to medianPitch,
          "meanPitch" to meanPitch,
          "pitchStdDev" to pitchStdDev,
          "meanConfidence" to meanConfidence,
          "meanVoicedProbability" to meanVoicedProbability
        )
      } catch (e: RuntimeException) {
        throw Exception("ANALYZER_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        throw Exception("ANALYZER_ERROR: ${e.message}", e)
      }
    }

    /**
     * Process audio with HMM-smoothed Viterbi decoding for globally optimal pitch track (v0.5.0).
     *
     * Unlike analyzeClip which treats frames independently, this uses Viterbi decoding
     * to reduce octave errors (from ~8-12% to ≤3%) and produce smoother contours.
     *
     * @param analyzerId Analyzer ID from createVoiceAnalyzer
     * @param buffer Audio samples as FloatArray
     * @return PitchTrack map with pitchTrack, voicedProbabilities, timestamps, and statistics
     * @throws Exception with error code "ANALYZER_ERROR"
     */
    AsyncFunction("processBuffer") { analyzerId: String, buffer: FloatArray ->
      try {
        // Get analyzer handle
        val (handle, config) = getAnalyzer(analyzerId)
          ?: throw Exception("VALIDATION_ERROR: Invalid analyzer ID: $analyzerId")

        if (buffer.isEmpty()) {
          throw Exception("VALIDATION_ERROR: Buffer cannot be empty")
        }

        // Process buffer with Viterbi decoding
        val track = RustBridge.processBufferWithAnalyzer(handle, buffer)

        // Calculate aggregate statistics
        val voicedPitches = track.pitchTrack.filter { it > 0 }
        val voicedCount = voicedPitches.size

        // Median pitch
        val medianPitch: Float? = if (voicedPitches.isEmpty()) null else {
          val sorted = voicedPitches.sorted()
          val mid = sorted.size / 2
          if (sorted.size % 2 == 0) {
            (sorted[mid - 1] + sorted[mid]) / 2
          } else {
            sorted[mid]
          }
        }

        // Mean pitch
        val meanPitch: Float? = if (voicedPitches.isEmpty()) null else {
          voicedPitches.sum() / voicedPitches.size
        }

        mapOf(
          "pitchTrack" to track.pitchTrack.toList(),
          "voicedProbabilities" to track.voicedProbabilities.toList(),
          "timestamps" to track.timestamps.toList(),
          "frameCount" to track.pitchTrack.size,
          "voicedFrameCount" to voicedCount,
          "medianPitch" to medianPitch,
          "meanPitch" to meanPitch
        )
      } catch (e: RuntimeException) {
        throw Exception("ANALYZER_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        throw Exception("ANALYZER_ERROR: ${e.message}", e)
      }
    }

    /**
     * Reset analyzer state for reuse with new audio.
     *
     * @param analyzerId Analyzer ID from createVoiceAnalyzer
     * @throws Exception with error code "ANALYZER_ERROR"
     */
    AsyncFunction("resetVoiceAnalyzer") { analyzerId: String ->
      try {
        val (handle, _) = getAnalyzer(analyzerId)
          ?: throw Exception("VALIDATION_ERROR: Invalid analyzer ID: $analyzerId")

        RustBridge.resetVoiceAnalyzer(handle)
        null
      } catch (e: RuntimeException) {
        throw Exception("ANALYZER_ERROR: ${e.message}", e)
      } catch (e: Exception) {
        throw Exception("ANALYZER_ERROR: ${e.message}", e)
      }
    }

    /**
     * Free a VoiceAnalyzer instance.
     *
     * @param analyzerId Analyzer ID from createVoiceAnalyzer
     * @throws Exception with error code "ANALYZER_ERROR"
     */
    AsyncFunction("freeVoiceAnalyzer") { analyzerId: String ->
      if (removeAnalyzer(analyzerId)) {
        null
      } else {
        throw Exception("VALIDATION_ERROR: Invalid analyzer ID: $analyzerId")
      }
    }
  }

  // ============================================================================
  // Analyzer Storage (Thread-safe)
  // ============================================================================

  companion object {
    private val analyzers = mutableMapOf<String, Pair<Long, VoiceAnalyzerConfig>>()
    private val analyzerLock = Any()
    private var nextAnalyzerId = 1

    fun storeAnalyzer(handle: Long, config: VoiceAnalyzerConfig): String {
      synchronized(analyzerLock) {
        val id = "va_$nextAnalyzerId"
        nextAnalyzerId++
        analyzers[id] = Pair(handle, config)
        return id
      }
    }

    fun getAnalyzer(id: String): Pair<Long, VoiceAnalyzerConfig>? {
      synchronized(analyzerLock) {
        return analyzers[id]
      }
    }

    fun removeAnalyzer(id: String): Boolean {
      synchronized(analyzerLock) {
        val entry = analyzers.remove(id)
        if (entry != null) {
          RustBridge.freeVoiceAnalyzer(entry.first)
          return true
        }
        return false
      }
    }
  }
}
