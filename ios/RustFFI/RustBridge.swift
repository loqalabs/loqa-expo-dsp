import Foundation

// MARK: - FFI Function Declarations
// These functions are declared in loqa_voice_dsp.h (C header) for proper C ABI compatibility
// The C header is included via the module.modulemap, allowing Swift to call Rust extern "C" functions
// IMPORTANT: Using a C bridging header ensures correct struct return value handling on ARM64
// Using @_silgen_name would cause ABI mismatch (Swift ABI vs C ABI)

// MARK: - Swift Result Types
// These wrap the C structs for cleaner Swift API

/// PitchResult for Swift API (wraps PitchResultC from C header)
public struct PitchResult {
    public let frequency: Float
    public let confidence: Float
    public let isVoiced: Bool

    init(from c: PitchResultC) {
        self.frequency = c.frequency
        self.confidence = c.confidence
        self.isVoiced = c.is_voiced
    }
}

/// FormantsResult for Swift API (wraps FormantsResultC from C header)
public struct FormantsResult {
    public let f1: Float
    public let f2: Float
    public let f3: Float
    public let bw1: Float
    public let bw2: Float
    public let bw3: Float

    init(from c: FormantsResultC) {
        self.f1 = c.f1
        self.f2 = c.f2
        self.f3 = c.f3
        self.bw1 = c.bw1
        self.bw2 = c.bw2
        self.bw3 = c.bw3
    }
}

/// SpectrumResult for Swift API (wraps SpectrumResultC from C header)
public struct SpectrumResult {
    public let centroid: Float
    public let rolloff: Float
    public let tilt: Float

    init(from c: SpectrumResultC) {
        self.centroid = c.centroid
        self.rolloff = c.rolloff
        self.tilt = c.tilt
    }
}

/// HNRResult for Swift API (wraps HNRResultC from C header)
public struct HNRResult {
    public let hnr: Float
    public let f0: Float
    public let isVoiced: Bool

    init(from c: HNRResultC) {
        self.hnr = c.hnr
        self.f0 = c.f0
        self.isVoiced = c.is_voiced
    }
}

/// H1H2Result for Swift API (wraps H1H2ResultC from C header)
public struct H1H2Result {
    public let h1h2: Float
    public let h1AmplitudeDb: Float
    public let h2AmplitudeDb: Float
    public let f0: Float

    init(from c: H1H2ResultC) {
        self.h1h2 = c.h1h2
        self.h1AmplitudeDb = c.h1_amplitude_db
        self.h2AmplitudeDb = c.h2_amplitude_db
        self.f0 = c.f0
    }
}

// MARK: - Swift Wrapper Functions
// These functions provide memory-safe wrappers around the Rust FFI calls
// They handle memory marshalling, deallocation, and error handling

// MARK: - Error Types

/// Errors that can occur during Rust FFI calls
public enum RustFFIError: Error, LocalizedError {
    case invalidInput(String)
    case computationFailed(String)
    case memoryAllocationFailed

    public var errorDescription: String? {
        switch self {
        case .invalidInput(let message):
            return "Invalid input: \(message)"
        case .computationFailed(let message):
            return "Computation failed: \(message)"
        case .memoryAllocationFailed:
            return "Memory allocation failed in Rust FFI"
        }
    }
}

// MARK: FFT Wrapper (Epic 2)

/// Swift wrapper for FFT computation
/// MEMORY SAFETY: Returns owned array; Rust memory is freed before return
/// Implemented in Story 2.2
public func computeFFTWrapper(
    buffer: [Float],
    fftSize: Int,
    windowType: Int = 0
) throws -> [Float] {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard fftSize > 0 && (fftSize & (fftSize - 1)) == 0 else {
        throw RustFFIError.invalidInput("FFT size must be a positive power of 2")
    }

    // Call Rust function
    let resultPtr = buffer.withUnsafeBufferPointer { bufferPtr -> UnsafePointer<Float>? in
        guard let baseAddress = bufferPtr.baseAddress else {
            return nil
        }

        return compute_fft_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(fftSize),
            Int32(windowType)
        )
    }

    // Check for allocation failure
    guard let ptr = resultPtr else {
        throw RustFFIError.memoryAllocationFailed
    }

    // Copy to Swift array before freeing Rust memory
    // Result length is fftSize/2 + 1 (DC to Nyquist)
    let resultLength = fftSize / 2 + 1
    let result = Array(UnsafeBufferPointer(start: ptr, count: resultLength))

    // Free Rust-allocated memory
    free_fft_result_rust(ptr)

    return result
}

// MARK: Pitch Detection Wrapper (Epic 3)

/// Swift wrapper for pitch detection
/// MEMORY SAFETY: PitchResult returned by value (no heap allocation, no cleanup needed)
/// Implemented in Story 3.3
public func detectPitchWrapper(
    buffer: [Float],
    sampleRate: Int
) throws -> (frequency: Float?, confidence: Float, isVoiced: Bool) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    // Call Rust function - returns PitchResultC by value (no memory management needed)
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> PitchResultC in
        guard let baseAddress = bufferPtr.baseAddress else {
            // Return error result if buffer pointer is invalid
            return PitchResultC(frequency: 0.0, confidence: 0.0, is_voiced: false)
        }

        return detect_pitch_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate)
        )
    }

    // Convert to Swift result
    let result = PitchResult(from: cResult)

    // Convert frequency: 0.0 -> nil, otherwise use actual value
    let frequency = result.isVoiced && result.frequency > 0 ? result.frequency : nil

    return (frequency, result.confidence, result.isVoiced)
}

// MARK: Formant Extraction Wrapper (Epic 3)

/// Swift wrapper for formant extraction
/// MEMORY SAFETY: FormantsResult returned by value (no heap allocation, no cleanup needed)
/// Implemented in Story 3.3
public func extractFormantsWrapper(
    buffer: [Float],
    sampleRate: Int,
    lpcOrder: Int = 12
) throws -> (f1: Float, f2: Float, f3: Float, bw1: Float, bw2: Float, bw3: Float) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    guard lpcOrder >= 8 && lpcOrder <= 16 else {
        throw RustFFIError.invalidInput("LPC order must be between 8 and 16")
    }

    // Call Rust function - returns FormantsResultC by value
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> FormantsResultC in
        guard let baseAddress = bufferPtr.baseAddress else {
            return FormantsResultC(f1: 0, f2: 0, f3: 0, bw1: 0, bw2: 0, bw3: 0)
        }

        return extract_formants_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate),
            Int32(lpcOrder)
        )
    }

    let result = FormantsResult(from: cResult)
    return (result.f1, result.f2, result.f3, result.bw1, result.bw2, result.bw3)
}

// MARK: Spectrum Analysis Wrapper (Epic 4)

/// Swift wrapper for spectrum analysis
/// MEMORY SAFETY: SpectrumResult returned by value (no heap allocation, no cleanup needed)
/// Implemented in Story 4.2
public func analyzeSpectrumWrapper(
    buffer: [Float],
    sampleRate: Int
) throws -> (centroid: Float, rolloff: Float, tilt: Float) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    // Call Rust function - returns SpectrumResultC by value
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> SpectrumResultC in
        guard let baseAddress = bufferPtr.baseAddress else {
            return SpectrumResultC(centroid: 0, rolloff: 0, tilt: 0)
        }

        return analyze_spectrum_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate)
        )
    }

    let result = SpectrumResult(from: cResult)
    return (result.centroid, result.rolloff, result.tilt)
}

// MARK: HNR Wrapper

/// Swift wrapper for HNR calculation
/// MEMORY SAFETY: HNRResult returned by value (no heap allocation, no cleanup needed)
public func calculateHNRWrapper(
    buffer: [Float],
    sampleRate: Int,
    minFrequency: Float = 75.0,
    maxFrequency: Float = 500.0
) throws -> (hnr: Float, f0: Float, isVoiced: Bool) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    guard minFrequency > 0 && maxFrequency > minFrequency else {
        throw RustFFIError.invalidInput("Invalid frequency range")
    }

    // Call Rust function - returns HNRResultC by value
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> HNRResultC in
        guard let baseAddress = bufferPtr.baseAddress else {
            return HNRResultC(hnr: 0, f0: 0, is_voiced: false)
        }

        return calculate_hnr_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate),
            minFrequency,
            maxFrequency
        )
    }

    let result = HNRResult(from: cResult)
    return (result.hnr, result.f0, result.isVoiced)
}

// MARK: H1-H2 Wrapper

/// Swift wrapper for H1-H2 calculation
/// MEMORY SAFETY: H1H2Result returned by value (no heap allocation, no cleanup needed)
/// f0: Pass nil or 0 for auto-detection, or provide known fundamental frequency
public func calculateH1H2Wrapper(
    buffer: [Float],
    sampleRate: Int,
    f0: Float?
) throws -> (h1h2: Float, h1AmplitudeDb: Float, h2AmplitudeDb: Float, f0: Float) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    // Use 0 to signal auto-detection to Rust, or use provided f0
    let f0Value = f0 ?? 0.0

    // Call Rust function - returns H1H2ResultC by value
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> H1H2ResultC in
        guard let baseAddress = bufferPtr.baseAddress else {
            return H1H2ResultC(h1h2: 0, h1_amplitude_db: 0, h2_amplitude_db: 0, f0: 0)
        }

        return calculate_h1h2_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate),
            f0Value
        )
    }

    let result = H1H2Result(from: cResult)
    return (result.h1h2, result.h1AmplitudeDb, result.h2AmplitudeDb, result.f0)
}

/*
 MEMORY MANAGEMENT PATTERN FOR FFI CALLS
 ========================================

 This file implements a consistent pattern for safe memory management across the FFI boundary:

 1. POINTER-RETURNING FUNCTIONS (e.g., compute_fft_rust):
    - Rust allocates memory and returns a pointer
    - Swift copies data to a Swift-owned array immediately
    - Swift calls free_*_rust() to deallocate Rust memory
    - Pattern: allocate -> copy -> free -> return Swift array

 2. VALUE-RETURNING FUNCTIONS (e.g., detect_pitch_rust, extract_formants_rust):
    - Rust returns a small struct by value (not a pointer)
    - No memory management needed - struct is copied to Swift stack
    - Pattern: call -> receive value -> return Swift tuple

 CRITICAL SAFETY RULES:
 - Always copy pointer data before any operation that could fail
 - Always free Rust memory in the same function that receives it
 - Never store Rust pointers in Swift properties
 - Use defer { } for cleanup when there are multiple exit points

 ERROR HANDLING:
 When validation fails or an error occurs, the wrapper functions:
 - Throwing an error
 - Early return

 This pattern ensures no memory leaks at the FFI boundary.

 REFERENCE:
 See Architecture Document - Memory Management at FFI/JNI Boundary
 docs/architecture.md#memory-management-at-ffijni-boundary
 */
