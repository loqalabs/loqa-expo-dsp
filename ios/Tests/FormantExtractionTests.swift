import XCTest
@testable import LoqaAudioDsp

/// Comprehensive tests for formant extraction functionality (Story 3.5)
class FormantExtractionTests: XCTestCase {

    // MARK: - Helper Functions

    func generateVowelLikeAudio(f1: Float, f2: Float, f3: Float, sampleRate: Float, durationSamples: Int) -> [Float] {
        var buffer = [Float](repeating: 0.0, count: durationSamples)
        for i in 0..<durationSamples {
            let t = Float(i) / sampleRate
            let omega1 = 2.0 * Float.pi * f1 * t
            let omega2 = 2.0 * Float.pi * f2 * t
            let omega3 = 2.0 * Float.pi * f3 * t
            buffer[i] = 0.5 * sin(omega1) + 0.3 * sin(omega2) + 0.2 * sin(omega3)
        }
        return buffer
    }

    // MARK: - Valid Input Tests

    func testExtractFormantsFromVowelA() throws {
        let buffer = generateVowelLikeAudio(f1: 700, f2: 1220, f3: 2600, sampleRate: 44100, durationSamples: 2048)
        let result = try extractFormantsWrapper(buffer: buffer, sampleRate: 44100)

        XCTAssertGreaterThan(result.f1, 0)
        XCTAssertGreaterThanOrEqual(result.f1, 200)
        XCTAssertLessThanOrEqual(result.f1, 1000)
    }

    func testExtractFormantsReturnsBandwidths() throws {
        let buffer = generateVowelLikeAudio(f1: 600, f2: 1400, f3: 2800, sampleRate: 44100, durationSamples: 2048)
        let result = try extractFormantsWrapper(buffer: buffer, sampleRate: 44100)

        XCTAssertGreaterThan(result.bandwidths.0, 0)
        XCTAssertGreaterThan(result.bandwidths.1, 0)
        XCTAssertGreaterThan(result.bandwidths.2, 0)
    }

    // MARK: - Validation Tests

    func testExtractFormantsThrowsErrorForEmptyBuffer() {
        XCTAssertThrowsError(try extractFormantsWrapper(buffer: [], sampleRate: 44100))
    }

    func testExtractFormantsThrowsErrorForInvalidSampleRate() {
        let buffer = generateVowelLikeAudio(f1: 700, f2: 1220, f3: 2600, sampleRate: 44100, durationSamples: 2048)
        XCTAssertThrowsError(try extractFormantsWrapper(buffer: buffer, sampleRate: 7999))
        XCTAssertThrowsError(try extractFormantsWrapper(buffer: buffer, sampleRate: 48001))
    }

    // MARK: - FFI Tests

    func testFFIMemorySafetyWithMultipleCalls() throws {
        let buffer = generateVowelLikeAudio(f1: 700, f2: 1220, f3: 2600, sampleRate: 44100, durationSamples: 2048)
        for _ in 0..<50 {
            _ = try extractFormantsWrapper(buffer: buffer, sampleRate: 44100)
        }
        XCTAssertTrue(true)
    }

    // MARK: - Cross-Platform Consistency

    func testFormantExtractionProducesConsistentResults() throws {
        let buffer = generateVowelLikeAudio(f1: 700, f2: 1220, f3: 2600, sampleRate: 44100, durationSamples: 2048)
        let result1 = try extractFormantsWrapper(buffer: buffer, sampleRate: 44100)
        let result2 = try extractFormantsWrapper(buffer: buffer, sampleRate: 44100)

        XCTAssertEqual(result1.f1, result2.f1, accuracy: 0.01)
        XCTAssertEqual(result1.f2, result2.f2, accuracy: 0.01)
        XCTAssertEqual(result1.f3, result2.f3, accuracy: 0.01)
    }

    // MARK: - Performance

    func testFormantExtractionPerformance() throws {
        let buffer = generateVowelLikeAudio(f1: 700, f2: 1220, f3: 2600, sampleRate: 44100, durationSamples: 2048)
        measure {
            _ = try? extractFormantsWrapper(buffer: buffer, sampleRate: 44100)
        }
    }
}
