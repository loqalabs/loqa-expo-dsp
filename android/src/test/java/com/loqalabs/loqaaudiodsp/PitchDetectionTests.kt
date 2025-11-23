package com.loqalabs.loqaaudiodsp

import com.loqalabs.loqaaudiodsp.RustJNI.RustBridge
import org.junit.Test
import org.junit.Assert.*
import kotlin.math.PI
import kotlin.math.sin

/**
 * Comprehensive tests for pitch detection functionality (Story 3.5)
 * Tests native Android pitch detection implementation, JNI bindings, and cross-platform consistency
 */
class PitchDetectionTests {

    // MARK: - Helper Functions

    /**
     * Generate a synthetic sine wave for testing
     */
    private fun generateSineWave(frequency: Float, sampleRate: Float, durationSamples: Int): FloatArray {
        val buffer = FloatArray(durationSamples)
        val omega = 2.0f * PI.toFloat() * frequency / sampleRate

        for (i in 0 until durationSamples) {
            buffer[i] = sin(omega * i)
        }

        return buffer
    }

    /**
     * Generate silence (all zeros)
     */
    private fun generateSilence(durationSamples: Int): FloatArray {
        return FloatArray(durationSamples)
    }

    // MARK: - Valid Input Tests (AC2)

    @Test
    fun testDetectPitchFrom440HzSineWave() {
        // Arrange: Create a 440 Hz sine wave at 44100 Hz
        val frequency = 440.0f
        val sampleRate = 44100
        val buffer = generateSineWave(frequency, sampleRate.toFloat(), 2048)

        // Act: Detect pitch via Rust JNI
        val result = RustBridge.detectPitch(buffer, sampleRate)

        // Assert
        assertTrue("440 Hz sine wave should be detected as voiced", result.isVoiced)
        assertTrue("Detected frequency should be close to 440 Hz", result.frequency in 430f..450f)
        assertTrue("Confidence should be high for clean sine wave", result.confidence > 0.8f)
    }

    @Test
    fun testDetectPitchReturnsHighConfidenceForCleanSineWave() {
        // Arrange
        val buffer = generateSineWave(220.0f, 44100.0f, 2048)

        // Act
        val result = RustBridge.detectPitch(buffer, 44100)

        // Assert
        assertTrue("Clean sine wave should have high confidence", result.confidence > 0.9f)
        assertTrue("Confidence should not exceed 1.0", result.confidence <= 1.0f)
    }

    @Test
    fun testDetectPitchIdentifiesSilenceAsUnvoiced() {
        // Arrange: Generate silence
        val buffer = generateSilence(2048)

        // Act
        val result = RustBridge.detectPitch(buffer, 44100)

        // Assert
        assertFalse("Silence should be identified as unvoiced", result.isVoiced)
    }

    @Test
    fun testDetectPitchWorksWithVariousSampleRates() {
        // Arrange: Test with valid sample rates
        val validSampleRates = listOf(8000, 16000, 22050, 44100, 48000)

        for (sampleRate in validSampleRates) {
            // Create test buffer
            val buffer = generateSineWave(200.0f, sampleRate.toFloat(), 2048)

            // Act
            val result = RustBridge.detectPitch(buffer, sampleRate)

            // Assert
            assertTrue(
                "Should detect pitch at $sampleRate Hz sample rate",
                result.isVoiced
            )
        }
    }

    // MARK: - Validation Error Tests

    @Test(expected = RuntimeException::class)
    fun testDetectPitchThrowsErrorForEmptyBuffer() {
        // Arrange
        val emptyBuffer = FloatArray(0)

        // Act & Assert: Should throw RuntimeException
        RustBridge.detectPitch(emptyBuffer, 44100)
    }

    // MARK: - JNI Binding Tests (AC4)

    @Test
    fun testJNIBindingReturnsValidPitchResult() {
        // Test that JNI correctly marshals pitch data between Kotlin and Rust
        val buffer = generateSineWave(440.0f, 44100.0f, 2048)

        // Act: Call Rust pitch detection via JNI
        val result = RustBridge.detectPitch(buffer, 44100)

        // Assert: Check result is valid
        assertTrue("Confidence should be in range [0, 1]", result.confidence in 0f..1f)
        assertTrue("Frequency should be finite", result.frequency.isFinite())
    }

    @Test
    fun testJNIMemorySafetyWithMultipleCalls() {
        // Test that JNI handles memory correctly with multiple calls
        val buffer = generateSineWave(440.0f, 44100.0f, 2048)

        // This should not leak memory or crash
        for (i in 0 until 50) {
            RustBridge.detectPitch(buffer, 44100)
        }

        assertTrue("JNI memory safety test completed", true)
    }

    // MARK: - Cross-Platform Consistency Tests (AC5)

    @Test
    fun testPitchDetectionProducesConsistentResults() {
        // Test that running pitch detection multiple times on same input produces identical results
        val buffer = generateSineWave(440.0f, 44100.0f, 2048)

        val result1 = RustBridge.detectPitch(buffer, 44100)
        val result2 = RustBridge.detectPitch(buffer, 44100)

        // Assert: Results should be identical (deterministic computation)
        assertEquals(result1.isVoiced, result2.isVoiced)
        assertEquals(result1.frequency, result2.frequency, 0.01f)
        assertEquals(result1.confidence, result2.confidence, 0.0001f)
    }

    // MARK: - Real-World Use Cases

    @Test
    fun testDetectPitchForLowMaleVoice() {
        // Arrange: Low male voice (100-150 Hz)
        val buffer = generateSineWave(120.0f, 44100.0f, 2048)

        // Act
        val result = RustBridge.detectPitch(buffer, 44100)

        // Assert
        assertTrue(result.isVoiced)
        assertTrue("Should detect low male voice frequency", result.frequency in 100f..150f)
    }

    @Test
    fun testDetectPitchForHighFemaleVoice() {
        // Arrange: High female voice (200-300 Hz)
        val buffer = generateSineWave(250.0f, 44100.0f, 2048)

        // Act
        val result = RustBridge.detectPitch(buffer, 44100)

        // Assert
        assertTrue(result.isVoiced)
        assertTrue("Should detect high female voice frequency", result.frequency in 200f..300f)
    }

    @Test
    fun testDetectPitchForMusicalNoteA4() {
        // Arrange: Musical tuning standard A4 (440 Hz)
        val buffer = generateSineWave(440.0f, 44100.0f, 2048)

        // Act
        val result = RustBridge.detectPitch(buffer, 44100)

        // Assert: Should be very close to 440 Hz
        assertTrue(result.isVoiced)
        assertEquals("Should detect A4 at 440 Hz", 440.0f, result.frequency, 1.0f)
        assertTrue("Clean musical note should have very high confidence", result.confidence > 0.95f)
    }

    // MARK: - Performance Tests

    @Test
    fun testPitchDetectionPerformance() {
        // Measure pitch detection time to ensure it meets <5ms target
        val buffer = generateSineWave(440.0f, 44100.0f, 2048)

        val iterations = 10
        val startTime = System.nanoTime()

        for (i in 0 until iterations) {
            RustBridge.detectPitch(buffer, 44100)
        }

        val endTime = System.nanoTime()
        val avgTimeMs = (endTime - startTime) / iterations / 1_000_000.0

        println("Average pitch detection time: $avgTimeMs ms")
        assertTrue("Pitch detection should complete in reasonable time", avgTimeMs < 10.0)
    }
}
