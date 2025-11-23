import Foundation

// MARK: - FFI Function Declarations
// These functions use @_silgen_name to bind to Rust functions exported by loqa-voice-dsp
// NOTE: Actual Rust function implementations will be added in Epic 2 (FFT), Epic 3 (Pitch/Formants), and Epic 4 (Spectrum)

// MARK: FFT Functions (Epic 2)

/// FFI declaration for FFT computation with window type support
/// Implemented in Story 2.1, called from Story 2.2
@_silgen_name("compute_fft_rust")
func compute_fft_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ fftSize: Int32,
    _ windowType: Int32
) -> UnsafePointer<Float>?

/// Placeholder FFI declaration for freeing FFT result memory
/// Will be implemented in Story 2.2
@_silgen_name("free_fft_result_rust")
func free_fft_result_rust(_ ptr: UnsafePointer<Float>)

// MARK: Pitch Detection Functions (Epic 3)

/// PitchResult struct matching Rust #[repr(C)] layout
/// Returned by value from detect_pitch_rust
public struct PitchResult {
    public let frequency: Float
    public let confidence: Float
    public let isVoiced: Bool
}

/// FFI declaration for pitch detection using YIN algorithm
/// Implemented in Story 3.1, called from Story 3.3
/// Note: Rust returns PitchResult by value (small struct, no heap allocation needed)
@_silgen_name("detect_pitch_rust")
func detect_pitch_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ sampleRate: Int32
) -> PitchResult

// MARK: Formant Extraction Functions (Epic 3)

/// FormantsResult struct matching Rust #[repr(C)] layout
/// Returned by value from extract_formants_rust
public struct FormantsResult {
    public let f1: Float
    public let f2: Float
    public let f3: Float
    public let bw1: Float
    public let bw2: Float
    public let bw3: Float
}

/// FFI declaration for formant extraction using LPC analysis
/// Implemented in Story 3.2, called from Story 3.3
/// Note: Rust returns FormantsResult by value (small struct, no heap allocation needed)
@_silgen_name("extract_formants_rust")
func extract_formants_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ sampleRate: Int32,
    _ lpcOrder: Int32
) -> FormantsResult

// MARK: Spectrum Analysis Functions (Epic 4)

/// Placeholder FFI declaration for spectral analysis
/// Will be implemented in Story 4.2
@_silgen_name("analyze_spectrum_rust")
func analyze_spectrum_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ sampleRate: Int32
) -> UnsafePointer<Float>? // Returns [centroid, rolloff, tilt]

/// Placeholder FFI declaration for freeing spectrum analysis result memory
/// Will be implemented in Story 4.2
@_silgen_name("free_spectrum_result_rust")
func free_spectrum_result_rust(_ ptr: UnsafePointer<Float>)

// MARK: - Swift Wrapper Functions
// These functions provide memory-safe wrappers around the Rust FFI calls
// They handle memory marshalling, deallocation, and error handling

/// Error type for Rust FFI operations
public enum RustFFIError: Error {
    case computationFailed(String)
    case invalidInput(String)
    case memoryAllocationFailed

    var localizedDescription: String {
        switch self {
        case .computationFailed(let message):
            return "Rust computation failed: \(message)"
        case .invalidInput(let message):
            return "Invalid input: \(message)"
        case .memoryAllocationFailed:
            return "Memory allocation failed in Rust"
        }
    }
}

// MARK: FFT Wrapper (Placeholder for Epic 2)

/// Swift wrapper for FFT computation with window type support
/// MEMORY SAFETY PATTERN: Uses defer block to guarantee Rust memory is freed
/// Implemented in Story 2.2
public func computeFFTWrapper(buffer: [Float], fftSize: Int, windowType: Int32) throws -> [Float] {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard fftSize > 0 && (fftSize & (fftSize - 1)) == 0 else {
        throw RustFFIError.invalidInput("FFT size must be a power of 2")
    }

    guard fftSize >= 256 && fftSize <= 8192 else {
        throw RustFFIError.invalidInput("FFT size must be between 256 and 8192")
    }

    var rustResult: UnsafePointer<Float>? = nil

    // CRITICAL: defer block guarantees Rust memory is freed even if error occurs
    defer {
        if let ptr = rustResult {
            free_fft_result_rust(ptr)
        }
    }

    // Use withUnsafeBufferPointer for zero-copy access
    buffer.withUnsafeBufferPointer { bufferPtr in
        guard let baseAddress = bufferPtr.baseAddress else {
            return
        }

        rustResult = compute_fft_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(fftSize),
            windowType
        )
    }

    guard let result = rustResult else {
        throw RustFFIError.computationFailed("FFT computation failed - Rust returned null (validation failure or computation error)")
    }

    // Copy to Swift array before freeing (defer will free after this)
    let outputSize = fftSize / 2
    let output = Array(UnsafeBufferPointer(start: result, count: outputSize))

    return output
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

    // Call Rust function - returns PitchResult by value (no memory management needed)
    let result = buffer.withUnsafeBufferPointer { bufferPtr -> PitchResult in
        guard let baseAddress = bufferPtr.baseAddress else {
            // Return error result if buffer pointer is invalid
            return PitchResult(frequency: 0.0, confidence: 0.0, isVoiced: false)
        }

        return detect_pitch_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate)
        )
    }

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
    lpcOrder: Int? = nil
) throws -> (f1: Float, f2: Float, f3: Float, bandwidths: (Float, Float, Float)) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    // Default LPC order: sampleRate / 1000 + 2
    // If lpcOrder is provided, use it; otherwise use 0 to signal Rust to use default
    let order = lpcOrder ?? 0

    // Call Rust function - returns FormantsResult by value (no memory management needed)
    let result = buffer.withUnsafeBufferPointer { bufferPtr -> FormantsResult in
        guard let baseAddress = bufferPtr.baseAddress else {
            // Return error result if buffer pointer is invalid
            return FormantsResult(f1: 0.0, f2: 0.0, f3: 0.0, bw1: 0.0, bw2: 0.0, bw3: 0.0)
        }

        return extract_formants_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate),
            Int32(order)
        )
    }

    return (
        f1: result.f1,
        f2: result.f2,
        f3: result.f3,
        bandwidths: (result.bw1, result.bw2, result.bw3)
    )
}

// MARK: Spectrum Analysis Wrapper (Placeholder for Epic 4)

/// Placeholder Swift wrapper for spectrum analysis
/// MEMORY SAFETY PATTERN: Uses defer block to guarantee Rust memory is freed
/// Will be fully implemented in Story 4.2
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

    var rustResult: UnsafePointer<Float>? = nil

    // CRITICAL: defer block guarantees Rust memory is freed
    defer {
        if let ptr = rustResult {
            free_spectrum_result_rust(ptr)
        }
    }

    buffer.withUnsafeBufferPointer { bufferPtr in
        guard let baseAddress = bufferPtr.baseAddress else {
            return
        }

        rustResult = analyze_spectrum_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate)
        )
    }

    guard let result = rustResult else {
        throw RustFFIError.computationFailed("Spectrum analysis returned null")
    }

    // Copy result: [centroid, rolloff, tilt]
    let resultArray = Array(UnsafeBufferPointer(start: result, count: 3))

    return (
        centroid: resultArray[0],
        rolloff: resultArray[1],
        tilt: resultArray[2]
    )
}

// MARK: - Memory Management Documentation

/*
 MEMORY SAFETY RULES FOR FFI BOUNDARY:

 1. Always use defer blocks to guarantee Rust memory is freed
 2. Use UnsafeBufferPointer for zero-copy input where possible
 3. Never hold references to Rust-allocated memory beyond function scope
 4. Always copy data from Rust → Swift before freeing
 5. Pattern: Call Rust → Copy result → Free Rust memory (via defer)

 DEALLOCATION GUARANTEE:
 The defer block executes when the function exits, regardless of:
 - Normal return
 - Throwing an error
 - Early return

 This pattern ensures no memory leaks at the FFI boundary.

 REFERENCE:
 See Architecture Document - Memory Management at FFI/JNI Boundary
 docs/architecture.md#memory-management-at-ffijni-boundary
 */
