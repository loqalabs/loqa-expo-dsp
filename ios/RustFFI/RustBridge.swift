import Foundation

// MARK: - FFI Function Declarations
// These functions use @_silgen_name to bind to Rust functions exported by loqa-voice-dsp
// NOTE: Actual Rust function implementations will be added in Epic 2 (FFT), Epic 3 (Pitch/Formants), and Epic 4 (Spectrum)

// MARK: FFT Functions (Epic 2)

/// Placeholder FFI declaration for FFT computation
/// Will be implemented in Story 2.2
@_silgen_name("compute_fft_rust")
func compute_fft_rust(
    buffer: UnsafePointer<Float>,
    length: Int32,
    fftSize: Int32
) -> UnsafePointer<Float>?

/// Placeholder FFI declaration for freeing FFT result memory
/// Will be implemented in Story 2.2
@_silgen_name("free_fft_result_rust")
func free_fft_result_rust(_ ptr: UnsafePointer<Float>)

// MARK: Pitch Detection Functions (Epic 3)

/// Placeholder FFI declaration for pitch detection using YIN algorithm
/// Will be implemented in Story 3.2
@_silgen_name("detect_pitch_rust")
func detect_pitch_rust(
    buffer: UnsafePointer<Float>,
    length: Int32,
    sampleRate: Int32,
    minFrequency: Float,
    maxFrequency: Float
) -> UnsafePointer<Float>? // Returns [frequency, confidence]

/// Placeholder FFI declaration for freeing pitch detection result memory
/// Will be implemented in Story 3.2
@_silgen_name("free_pitch_result_rust")
func free_pitch_result_rust(_ ptr: UnsafePointer<Float>)

// MARK: Formant Extraction Functions (Epic 3)

/// Placeholder FFI declaration for formant extraction using LPC analysis
/// Will be implemented in Story 3.2
@_silgen_name("extract_formants_rust")
func extract_formants_rust(
    buffer: UnsafePointer<Float>,
    length: Int32,
    sampleRate: Int32,
    lpcOrder: Int32
) -> UnsafePointer<Float>? // Returns [f1, f2, f3, bw1, bw2, bw3]

/// Placeholder FFI declaration for freeing formants result memory
/// Will be implemented in Story 3.2
@_silgen_name("free_formants_result_rust")
func free_formants_result_rust(_ ptr: UnsafePointer<Float>)

// MARK: Spectrum Analysis Functions (Epic 4)

/// Placeholder FFI declaration for spectral analysis
/// Will be implemented in Story 4.2
@_silgen_name("analyze_spectrum_rust")
func analyze_spectrum_rust(
    buffer: UnsafePointer<Float>,
    length: Int32,
    sampleRate: Int32
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

/// Placeholder Swift wrapper for FFT computation
/// MEMORY SAFETY PATTERN: Uses defer block to guarantee Rust memory is freed
/// Will be fully implemented in Story 2.2
public func computeFFTWrapper(buffer: [Float], fftSize: Int) throws -> [Float] {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard fftSize > 0 && (fftSize & (fftSize - 1)) == 0 else {
        throw RustFFIError.invalidInput("FFT size must be a power of 2")
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
            Int32(fftSize)
        )
    }

    guard let result = rustResult else {
        throw RustFFIError.computationFailed("FFT computation returned null")
    }

    // Copy to Swift array before freeing (defer will free after this)
    let outputSize = fftSize / 2
    let output = Array(UnsafeBufferPointer(start: result, count: outputSize))

    return output
}

// MARK: Pitch Detection Wrapper (Placeholder for Epic 3)

/// Placeholder Swift wrapper for pitch detection
/// MEMORY SAFETY PATTERN: Uses defer block to guarantee Rust memory is freed
/// Will be fully implemented in Story 3.3
public func detectPitchWrapper(
    buffer: [Float],
    sampleRate: Int,
    minFrequency: Float = 80.0,
    maxFrequency: Float = 400.0
) throws -> (frequency: Float?, confidence: Float) {
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
            free_pitch_result_rust(ptr)
        }
    }

    buffer.withUnsafeBufferPointer { bufferPtr in
        guard let baseAddress = bufferPtr.baseAddress else {
            return
        }

        rustResult = detect_pitch_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate),
            minFrequency,
            maxFrequency
        )
    }

    guard let result = rustResult else {
        throw RustFFIError.computationFailed("Pitch detection returned null")
    }

    // Copy result: [frequency, confidence]
    let resultArray = Array(UnsafeBufferPointer(start: result, count: 2))
    let frequency = resultArray[0] > 0 ? resultArray[0] : nil
    let confidence = resultArray[1]

    return (frequency, confidence)
}

// MARK: Formant Extraction Wrapper (Placeholder for Epic 3)

/// Placeholder Swift wrapper for formant extraction
/// MEMORY SAFETY PATTERN: Uses defer block to guarantee Rust memory is freed
/// Will be fully implemented in Story 3.3
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
    let order = lpcOrder ?? (sampleRate / 1000 + 2)

    var rustResult: UnsafePointer<Float>? = nil

    // CRITICAL: defer block guarantees Rust memory is freed
    defer {
        if let ptr = rustResult {
            free_formants_result_rust(ptr)
        }
    }

    buffer.withUnsafeBufferPointer { bufferPtr in
        guard let baseAddress = bufferPtr.baseAddress else {
            return
        }

        rustResult = extract_formants_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate),
            Int32(order)
        )
    }

    guard let result = rustResult else {
        throw RustFFIError.computationFailed("Formant extraction returned null")
    }

    // Copy result: [f1, f2, f3, bw1, bw2, bw3]
    let resultArray = Array(UnsafeBufferPointer(start: result, count: 6))

    return (
        f1: resultArray[0],
        f2: resultArray[1],
        f3: resultArray[2],
        bandwidths: (resultArray[3], resultArray[4], resultArray[5])
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
