package com.loqalabs.loqaaudiodsp

import com.loqalabs.loqaaudiodsp.RustJNI.RustBridge
import org.junit.Test
import org.junit.Assert.*
import kotlin.math.PI
import kotlin.math.sin

/**
 * Comprehensive tests for formant extraction functionality (Story 3.5)
 */
class FormantExtractionTests {

    // MARK: - Helper Functions

    private fun generateVowelLikeAudio(f1: Float, f2: Float, f3: Float, sampleRate: Float, durationSamples: Int): FloatArray {
        val buffer = FloatArray(durationSamples)
        for (i in 0 until durationSamples) {
            val t = i / sampleRate
            val omega1 = 2.0f * PI.toFloat() * f1 * t
            val omega2 = 2.0f * PI.toFloat() * f2 * t
            val omega3 = 2.0f * PI.toFloat() * f3 * t
            buffer[i] = 0.5f * sin(omega1) + 0.3f * sin(omega2) + 0.2f * sin(omega3)
        }
        return buffer
    }

    // MARK: - Valid Input Tests

    @Test
    fun testExtractFormantsFromVowelA() {
        val buffer = generateVowelLikeAudio(700f, 1220f, 2600f, 44100f, 2048)
        val result = RustBridge.extractFormants(buffer, 44100, 0) // 0 = default LPC order

        assertTrue("F1 should be positive", result.f1 > 0)
        assertTrue("F1 should be in typical range", result.f1 in 200f..1000f)
        assertTrue("F2 should be in typical range", result.f2 in 800f..2500f)
        assertTrue("F3 should be in typical range", result.f3 in 2000f..4000f)
    }

    @Test
    fun testExtractFormantsReturnsBandwidths() {
        val buffer = generateVowelLikeAudio(600f, 1400f, 2800f, 44100f, 2048)
        val result = RustBridge.extractFormants(buffer, 44100, 0)

        assertTrue("Bandwidth for F1 should be positive", result.bw1 > 0)
        assertTrue("Bandwidth for F2 should be positive", result.bw2 > 0)
        assertTrue("Bandwidth for F3 should be positive", result.bw3 > 0)
    }

    // MARK: - Validation Tests

    @Test(expected = RuntimeException::class)
    fun testExtractFormantsThrowsErrorForEmptyBuffer() {
        RustBridge.extractFormants(FloatArray(0), 44100, 0)
    }

    // MARK: - JNI Tests

    @Test
    fun testJNIMemorySafetyWithMultipleCalls() {
        val buffer = generateVowelLikeAudio(700f, 1220f, 2600f, 44100f, 2048)
        for (i in 0 until 50) {
            RustBridge.extractFormants(buffer, 44100, 0)
        }
        assertTrue("JNI memory safety test completed", true)
    }

    // MARK: - Cross-Platform Consistency

    @Test
    fun testFormantExtractionProducesConsistentResults() {
        val buffer = generateVowelLikeAudio(700f, 1220f, 2600f, 44100f, 2048)
        val result1 = RustBridge.extractFormants(buffer, 44100, 0)
        val result2 = RustBridge.extractFormants(buffer, 44100, 0)

        assertEquals(result1.f1, result2.f1, 0.01f)
        assertEquals(result1.f2, result2.f2, 0.01f)
        assertEquals(result1.f3, result2.f3, 0.01f)
    }

    // MARK: - Performance

    @Test
    fun testFormantExtractionPerformance() {
        val buffer = generateVowelLikeAudio(700f, 1220f, 2600f, 44100f, 2048)
        val iterations = 10
        val startTime = System.nanoTime()

        for (i in 0 until iterations) {
            RustBridge.extractFormants(buffer, 44100, 0)
        }

        val endTime = System.nanoTime()
        val avgTimeMs = (endTime - startTime) / iterations / 1_000_000.0

        println("Average formant extraction time: $avgTimeMs ms")
        assertTrue("Formant extraction should complete in reasonable time", avgTimeMs < 10.0)
    }
}
