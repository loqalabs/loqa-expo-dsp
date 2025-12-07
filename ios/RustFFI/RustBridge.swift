import Foundation

// MARK: - FFI Function Declarations
// These functions use @_extern(c) to bind to Rust extern "C" functions with C ABI
// IMPORTANT: @_extern(c) is required for correct struct return value handling on ARM64
// Using @_silgen_name would cause ABI mismatch (Swift ABI vs C ABI)
// NOTE: Actual Rust function implementations will be added in Epic 2 (FFT), Epic 3 (Pitch/Formants), and Epic 4 (Spectrum)

// MARK: FFT Functions (Epic 2)

/// FFI declaration for FFT computation with window type support
/// Implemented in Story 2.1, called from Story 2.2
/// IMPORTANT: Using @_extern(c) for C ABI compatibility with Rust extern "C" functions
@_extern(c, "compute_fft_rust")
func compute_fft_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ fftSize: Int32,
    _ windowType: Int32
) -> UnsafePointer<Float>?

/// FFI declaration for freeing FFT result memory
/// Implemented in Story 2.2
/// IMPORTANT: Using @_extern(c) for C ABI compatibility with Rust extern "C" functions
@_extern(c, "free_fft_result_rust")
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
/// IMPORTANT: Using @_extern(c) for C ABI compatibility with Rust extern "C" functions
@_extern(c, "detect_pitch_rust")
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
/// IMPORTANT: Using @_extern(c) for C ABI compatibility with Rust extern "C" functions
@_extern(c, "extract_formants_rust")
func extract_formants_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ sampleRate: Int32,
    _ lpcOrder: Int32
) -> FormantsResult

// MARK: Spectrum Analysis Functions (Epic 4)

/// SpectrumResult struct matching Rust #[repr(C)] layout
/// Returned by value from analyze_spectrum_rust
public struct SpectrumResult {
    public let centroid: Float
    public let rolloff: Float
    public let tilt: Float
}

/// FFI declaration for spectral analysis
/// Implemented in Story 4.2, called from Story 4.2
/// Note: Rust returns SpectrumResult by value (small struct, no heap allocation needed)
/// IMPORTANT: Using @_extern(c) for C ABI compatibility with Rust extern "C" functions
@_extern(c, "analyze_spectrum_rust")
func analyze_spectrum_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ sampleRate: Int32
) -> SpectrumResult

// MARK: HNR (Harmonics-to-Noise Ratio) Functions

/// HNRResult struct matching Rust #[repr(C)] layout
/// Returned by value from calculate_hnr_rust
public struct HNRResult {
    public let hnr: Float
    public let f0: Float
    public let isVoiced: Bool
}

/// FFI declaration for HNR calculation using Boersma's autocorrelation method
/// Note: Rust returns HNRResult by value (small struct, no heap allocation needed)
/// IMPORTANT: Using @_extern(c) for C ABI compatibility with Rust extern "C" functions
@_extern(c, "calculate_hnr_rust")
func calculate_hnr_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ sampleRate: Int32,
    _ minFreq: Float,
    _ maxFreq: Float
) -> HNRResult

// MARK: H1-H2 (Harmonic Amplitude Difference) Functions

/// H1H2Result struct matching Rust #[repr(C)] layout
/// Returned by value from calculate_h1h2_rust
public struct H1H2Result {
    public let h1h2: Float
    public let h1AmplitudeDb: Float
    public let h2AmplitudeDb: Float
    public let f0: Float
}

/// FFI declaration for H1-H2 calculation for vocal weight analysis
/// Note: Rust returns H1H2Result by value (small struct, no heap allocation needed)
/// IMPORTANT: Using @_extern(c) for C ABI compatibility with Rust extern "C" functions
@_extern(c, "calculate_h1h2_rust")
func calculate_h1h2_rust(
    _ buffer: UnsafePointer<Float>,
    _ length: Int32,
    _ sampleRate: Int32,
    _ f0: Float
) -> H1H2Result

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

// MARK: Spectrum Analysis Wrapper (Epic 4)

/// Swift wrapper for spectral analysis
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

    // Call Rust function - returns SpectrumResult by value (no memory management needed)
    let result = buffer.withUnsafeBufferPointer { bufferPtr -> SpectrumResult in
        guard let baseAddress = bufferPtr.baseAddress else {
            // Return error result if buffer pointer is invalid
            return SpectrumResult(centroid: 0.0, rolloff: 0.0, tilt: 0.0)
        }

        return analyze_spectrum_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate)
        )
    }

    return (
        centroid: result.centroid,
        rolloff: result.rolloff,
        tilt: result.tilt
    )
}

// MARK: HNR Calculation Wrapper

/// Swift wrapper for HNR (Harmonics-to-Noise Ratio) calculation
/// MEMORY SAFETY: HNRResult returned by value (no heap allocation, no cleanup needed)
///
/// HNR measures the ratio of harmonic to noise energy in voice:
/// - Higher HNR (18-25 dB): Clear, less breathy voice
/// - Lower HNR (12-18 dB): Softer, more breathy voice
///
/// - Parameters:
///   - buffer: Audio samples as Float array
///   - sampleRate: Sample rate in Hz (8000-48000)
///   - minFreq: Minimum F0 to search (default: 75 Hz)
///   - maxFreq: Maximum F0 to search (default: 500 Hz)
/// - Returns: Tuple with hnr (dB), f0 (Hz), and isVoiced flag
public func calculateHNRWrapper(
    buffer: [Float],
    sampleRate: Int,
    minFreq: Float = 75.0,
    maxFreq: Float = 500.0
) throws -> (hnr: Float, f0: Float, isVoiced: Bool) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    guard minFreq > 0 && maxFreq > minFreq else {
        throw RustFFIError.invalidInput("Invalid frequency range: minFreq must be > 0 and maxFreq must be > minFreq")
    }

    // Call Rust function - returns HNRResult by value (no memory management needed)
    let result = buffer.withUnsafeBufferPointer { bufferPtr -> HNRResult in
        guard let baseAddress = bufferPtr.baseAddress else {
            // Return error result if buffer pointer is invalid
            return HNRResult(hnr: 0.0, f0: 0.0, isVoiced: false)
        }

        return calculate_hnr_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate),
            minFreq,
            maxFreq
        )
    }

    return (
        hnr: result.hnr,
        f0: result.f0,
        isVoiced: result.isVoiced
    )
}

// MARK: H1-H2 Calculation Wrapper

/// Swift wrapper for H1-H2 amplitude difference calculation
/// MEMORY SAFETY: H1H2Result returned by value (no heap allocation, no cleanup needed)
///
/// H1-H2 measures the difference between first and second harmonic amplitudes:
/// - Higher H1-H2 (>5 dB): Lighter, breathier vocal quality
/// - Lower H1-H2 (<0 dB): Fuller, heavier vocal quality
///
/// - Parameters:
///   - buffer: Audio samples as Float array
///   - sampleRate: Sample rate in Hz (8000-48000)
///   - f0: Optional fundamental frequency. If nil, auto-detects.
/// - Returns: Tuple with h1h2 (dB), h1AmplitudeDb, h2AmplitudeDb, and f0 (Hz)
public func calculateH1H2Wrapper(
    buffer: [Float],
    sampleRate: Int,
    f0: Float? = nil
) throws -> (h1h2: Float, h1AmplitudeDb: Float, h2AmplitudeDb: Float, f0: Float) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    // Convert f0: nil -> 0.0 (auto-detect), otherwise use provided value
    let f0Value = f0 ?? 0.0

    // Call Rust function - returns H1H2Result by value (no memory management needed)
    let result = buffer.withUnsafeBufferPointer { bufferPtr -> H1H2Result in
        guard let baseAddress = bufferPtr.baseAddress else {
            // Return error result if buffer pointer is invalid
            return H1H2Result(h1h2: 0.0, h1AmplitudeDb: 0.0, h2AmplitudeDb: 0.0, f0: 0.0)
        }

        return calculate_h1h2_rust(
            baseAddress,
            Int32(buffer.count),
            Int32(sampleRate),
            f0Value
        )
    }

    // Check for error (all zeros with f0 = 0 indicates failure if we expected detection)
    if f0 == nil && result.f0 == 0.0 {
        throw RustFFIError.computationFailed("H1-H2 calculation failed - could not detect F0 (signal may be unvoiced)")
    }

    return (
        h1h2: result.h1h2,
        h1AmplitudeDb: result.h1AmplitudeDb,
        h2AmplitudeDb: result.h2AmplitudeDb,
        f0: result.f0
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
