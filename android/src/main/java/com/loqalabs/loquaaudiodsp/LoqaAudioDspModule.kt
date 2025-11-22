package com.loqalabs.loquaaudiodsp

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import com.loqalabs.loquaaudiodsp.RustJNI.RustBridge

/**
 * LoqaAudioDspModule provides Expo Module API for accessing Rust DSP functions.
 *
 * This module exposes async functions for:
 * - computeFFT: Fast Fourier Transform analysis
 * - detectPitch: YIN pitch detection algorithm
 * - extractFormants: LPC formant extraction
 * - analyzeSpectrum: Spectral feature analysis
 *
 * All functions run on background threads automatically via Expo's AsyncFunction.
 * Results are returned via Promises for async/await support in JavaScript/TypeScript.
 *
 * Implementation Notes:
 * - Story 1.4: Placeholder async function stubs (this story)
 * - Story 2.3: Real FFT implementation
 * - Story 3.3: Real pitch and formant implementations
 * - Story 4.2: Real spectrum analysis implementation
 */
class LoqaAudioDspModule : Module() {
  // Module definition for Expo Modules API
  override fun definition() = ModuleDefinition {
    // Module name that JavaScript will use to require this module
    Name("LoqaAudioDsp")

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
     * Detects pitch using YIN algorithm.
     *
     * Placeholder implementation - will be completed in Story 3.3.
     * Expo automatically runs this on a background thread.
     *
     * @param buffer Audio samples as FloatArray
     * @param sampleRate Sample rate in Hz (Int)
     * @param options Map with optional keys: "minFrequency" (Float), "maxFrequency" (Float)
     * @return Map with keys: "frequency" (Float), "confidence" (Float), "isVoiced" (Boolean)
     * @throws Exception with error code "PITCH_ERROR"
     */
    AsyncFunction("detectPitch") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any?> ->
      try {
        // Placeholder: This will call RustBridge.detectPitch in Story 3.3
        throw UnsupportedOperationException(
          "detectPitch not yet implemented. Will be completed in Story 3.3."
        )
      } catch (e: Exception) {
        throw Exception("PITCH_ERROR: ${e.message}", e)
      }
    }

    // ============================================================================
    // Async Function: extractFormants
    // ============================================================================

    /**
     * Extracts formant frequencies (F1, F2, F3) using LPC analysis.
     *
     * Placeholder implementation - will be completed in Story 3.3.
     * Expo automatically runs this on a background thread.
     *
     * @param buffer Audio samples as FloatArray
     * @param sampleRate Sample rate in Hz (Int)
     * @param options Map with optional keys: "lpcOrder" (Int)
     * @return Map with keys: "f1" (Float), "f2" (Float), "f3" (Float), "bandwidths" (Map)
     * @throws Exception with error code "FORMANTS_ERROR"
     */
    AsyncFunction("extractFormants") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any?> ->
      try {
        // Placeholder: This will call RustBridge.extractFormants in Story 3.3
        throw UnsupportedOperationException(
          "extractFormants not yet implemented. Will be completed in Story 3.3."
        )
      } catch (e: Exception) {
        throw Exception("FORMANTS_ERROR: ${e.message}", e)
      }
    }

    // ============================================================================
    // Async Function: analyzeSpectrum
    // ============================================================================

    /**
     * Analyzes spectral features (centroid, rolloff, tilt).
     *
     * Placeholder implementation - will be completed in Story 4.2.
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
        // Placeholder: This will call RustBridge.analyzeSpectrum in Story 4.2
        throw UnsupportedOperationException(
          "analyzeSpectrum not yet implemented. Will be completed in Story 4.2."
        )
      } catch (e: Exception) {
        throw Exception("SPECTRUM_ERROR: ${e.message}", e)
      }
    }
  }
}
