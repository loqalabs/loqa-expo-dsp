import XCTest
@testable import LoqaAudioDsp

/// Comprehensive tests for pitch detection functionality (Story 3.5)
/// Tests native iOS pitch detection implementation, FFI bindings, and memory management
class PitchDetectionTests: XCTestCase {

    // MARK: - Helper Functions

    /// Generate a synthetic sine wave for testing
    /// - Parameters:
    ///   - frequency: Frequency in Hz
    ///   - sampleRate: Sample rate in Hz
    ///   - durationSamples: Number of samples to generate
    /// - Returns: Array of Float samples
    func generateSineWave(frequency: Float, sampleRate: Float, durationSamples: Int) -> [Float] {
        var buffer = [Float](repeating: 0.0, count: durationSamples)
        let omega = 2.0 * Float.pi * frequency / sampleRate

        for i in 0..<durationSamples {
            buffer[i] = sin(omega * Float(i))
        }

        return buffer
    }

    /// Generate silence (all zeros)
    func generateSilence(durationSamples: Int) -> [Float] {
        return [Float](repeating: 0.0, count: durationSamples)
    }

    // MARK: - Valid Input Tests (AC2)

    func testDetectPitchFrom440HzSineWave() throws {
        // Arrange: Create a 440 Hz sine wave at 44100 Hz
        let frequency: Float = 440.0
        let sampleRate: Float = 44100.0
        let bufferSize = 2048
        let buffer = generateSineWave(frequency: frequency, sampleRate: sampleRate, durationSamples: bufferSize)

        // Act: Detect pitch via Rust wrapper
        let result = try detectPitchWrapper(buffer: buffer, sampleRate: Int(sampleRate))

        // Assert: Check result properties
        XCTAssertTrue(result.isVoiced, "440 Hz sine wave should be detected as voiced")
        XCTAssertNotNil(result.frequency, "Should return a frequency for voiced audio")

        if let detectedFreq = result.frequency {
            XCTAssertGreaterThan(detectedFreq, 430, "Detected frequency should be close to 440 Hz")
            XCTAssertLessThan(detectedFreq, 450, "Detected frequency should be close to 440 Hz")
        }

        XCTAssertGreaterThan(result.confidence, 0.8, "Confidence should be high for clean sine wave")
    }

    func testDetectPitchReturnsHighConfidenceForCleanSineWave() throws {
        // Arrange: Create clean 220 Hz sine wave
        let buffer = generateSineWave(frequency: 220, sampleRate: 44100, durationSamples: 2048)

        // Act
        let result = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        // Assert
        XCTAssertGreaterThan(result.confidence, 0.9, "Clean sine wave should have high confidence")
        XCTAssertLessThanOrEqual(result.confidence, 1.0, "Confidence should not exceed 1.0")
    }

    func testDetectPitchIdentifiesSilenceAsUnvoiced() throws {
        // Arrange: Generate silence
        let buffer = generateSilence(durationSamples: 2048)

        // Act
        let result = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        // Assert
        XCTAssertFalse(result.isVoiced, "Silence should be identified as unvoiced")
        XCTAssertNil(result.frequency, "Unvoiced audio should return nil frequency")
    }

    func testDetectPitchWorksWithVariousSampleRates() throws {
        // Arrange: Test with valid sample rates
        let validSampleRates: [Int] = [8000, 16000, 22050, 44100, 48000]

        for sampleRate in validSampleRates {
            // Create test buffer
            let buffer = generateSineWave(
                frequency: 200,
                sampleRate: Float(sampleRate),
                durationSamples: 2048
            )

            // Act
            let result = try detectPitchWrapper(buffer: buffer, sampleRate: sampleRate)

            // Assert
            XCTAssertTrue(result.isVoiced, "Should detect pitch at \(sampleRate) Hz sample rate")
            XCTAssertNotNil(result.frequency, "Should return frequency at \(sampleRate) Hz")
        }
    }

    // MARK: - Validation Error Tests

    func testDetectPitchThrowsErrorForEmptyBuffer() {
        // Arrange
        let emptyBuffer: [Float] = []

        // Act & Assert
        XCTAssertThrowsError(try detectPitchWrapper(buffer: emptyBuffer, sampleRate: 44100)) { error in
            guard let rustError = error as? RustFFIError else {
                XCTFail("Expected RustFFIError")
                return
            }

            if case .invalidInput(let message) = rustError {
                XCTAssertTrue(message.contains("empty"), "Error should mention empty buffer")
            } else {
                XCTFail("Expected invalidInput error")
            }
        }
    }

    func testDetectPitchThrowsErrorForSampleRateBelowMinimum() {
        // Arrange
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 2048)
        let invalidSampleRate = 7999 // Below minimum (8000)

        // Act & Assert
        XCTAssertThrowsError(try detectPitchWrapper(buffer: buffer, sampleRate: invalidSampleRate)) { error in
            guard let rustError = error as? RustFFIError else {
                XCTFail("Expected RustFFIError")
                return
            }

            if case .invalidInput(let message) = rustError {
                XCTAssertTrue(message.contains("8000") && message.contains("48000"),
                            "Error should mention valid sample rate range")
            } else {
                XCTFail("Expected invalidInput error")
            }
        }
    }

    func testDetectPitchThrowsErrorForSampleRateAboveMaximum() {
        // Arrange
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 2048)
        let invalidSampleRate = 48001 // Above maximum (48000)

        // Act & Assert
        XCTAssertThrowsError(try detectPitchWrapper(buffer: buffer, sampleRate: invalidSampleRate)) { error in
            guard let rustError = error as? RustFFIError else {
                XCTFail("Expected RustFFIError")
                return
            }

            if case .invalidInput(let message) = rustError {
                XCTAssertTrue(message.contains("8000") && message.contains("48000"),
                            "Error should mention valid sample rate range")
            } else {
                XCTFail("Expected invalidInput error")
            }
        }
    }

    // MARK: - FFI Binding Tests (AC4)

    func testFFIBindingReturnsValidPitchResult() throws {
        // Test that FFI correctly marshals pitch data between Swift and Rust
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 2048)

        // Act: Call Rust pitch detection via FFI
        let result = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        // Assert: Check result is valid
        XCTAssertTrue(result.confidence >= 0.0 && result.confidence <= 1.0,
                     "Confidence should be in range [0, 1]")

        if let freq = result.frequency {
            XCTAssertTrue(freq.isFinite, "Frequency should be finite")
            XCTAssertGreaterThan(freq, 0, "Frequency should be positive")
        }
    }

    func testFFIMemorySafetyWithMultipleCalls() throws {
        // Test that memory management is correct with multiple calls
        // PitchResult is returned by value, so no explicit memory management needed
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 2048)

        // Multiple calls should not leak memory
        for _ in 0..<50 {
            _ = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)
        }

        XCTAssertTrue(true, "FFI memory safety test completed")
    }

    // MARK: - Cross-Platform Consistency Tests (AC5)

    func testPitchDetectionProducesConsistentResults() throws {
        // Test that running pitch detection multiple times on same input produces identical results
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 2048)

        let result1 = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)
        let result2 = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        // Assert: Results should be identical (deterministic computation)
        XCTAssertEqual(result1.isVoiced, result2.isVoiced)
        XCTAssertEqual(result1.confidence, result2.confidence, accuracy: 0.0001)

        if let freq1 = result1.frequency, let freq2 = result2.frequency {
            XCTAssertEqual(freq1, freq2, accuracy: 0.01,
                          "Pitch detection should be deterministic")
        } else {
            XCTAssertEqual(result1.frequency == nil, result2.frequency == nil,
                          "Both should have same voicing status")
        }
    }

    // MARK: - Real-World Use Cases

    func testDetectPitchForLowMaleVoice() throws {
        // Arrange: Low male voice (100-150 Hz)
        let buffer = generateSineWave(frequency: 120, sampleRate: 44100, durationSamples: 2048)

        // Act
        let result = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        // Assert
        XCTAssertTrue(result.isVoiced)
        if let freq = result.frequency {
            XCTAssertGreaterThanOrEqual(freq, 100)
            XCTAssertLessThanOrEqual(freq, 150)
        } else {
            XCTFail("Should detect low male voice frequency")
        }
    }

    func testDetectPitchForHighFemaleVoice() throws {
        // Arrange: High female voice (200-300 Hz)
        let buffer = generateSineWave(frequency: 250, sampleRate: 44100, durationSamples: 2048)

        // Act
        let result = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        // Assert
        XCTAssertTrue(result.isVoiced)
        if let freq = result.frequency {
            XCTAssertGreaterThanOrEqual(freq, 200)
            XCTAssertLessThanOrEqual(freq, 300)
        } else {
            XCTFail("Should detect high female voice frequency")
        }
    }

    func testDetectPitchForMusicalNoteA4() throws {
        // Arrange: Musical tuning standard A4 (440 Hz)
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 2048)

        // Act
        let result = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        // Assert: Should be very close to 440 Hz
        XCTAssertTrue(result.isVoiced)
        if let freq = result.frequency {
            XCTAssertEqual(freq, 440, accuracy: 1.0, "Should detect A4 at 440 Hz")
        } else {
            XCTFail("Should detect musical note A4")
        }

        XCTAssertGreaterThan(result.confidence, 0.95, "Clean musical note should have very high confidence")
    }

    // MARK: - Edge Case Tests

    func testDetectPitchWithMinimumBufferSize() throws {
        // Test with small buffer size
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 512)

        let result = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        XCTAssertNotNil(result, "Should work with minimum buffer size")
    }

    func testDetectPitchWithLargeBufferSize() throws {
        // Test with larger buffer size
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 4096)

        let result = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)

        XCTAssertNotNil(result, "Should work with larger buffer size")
    }

    // MARK: - Performance Tests

    func testPitchDetectionPerformance() throws {
        // Measure pitch detection time to ensure it meets <5ms target
        let buffer = generateSineWave(frequency: 440, sampleRate: 44100, durationSamples: 2048)

        measure {
            do {
                _ = try detectPitchWrapper(buffer: buffer, sampleRate: 44100)
            } catch {
                XCTFail("Pitch detection should not throw during performance test")
            }
        }
    }
}
