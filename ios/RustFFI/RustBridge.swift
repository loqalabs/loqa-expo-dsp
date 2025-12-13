import Foundation

// MARK: - FFI Function Declarations
// These functions are declared in loqa_voice_dsp.h (C header) for proper C ABI compatibility
// The C header is included via the module.modulemap, allowing Swift to call Rust extern "C" functions
// IMPORTANT: Using a C bridging header ensures correct struct return value handling on ARM64
//
// loqa-voice-dsp v0.4.0 BREAKING CHANGES:
// - All result structs now have 'success' field first
// - PitchResultFFI adds 'voiced_probability' field
// - FormantResultFFI replaces bandwidths with 'confidence'
// - Function names changed from *_rust to loqa_*
// - loqa_detect_pitch now takes min_frequency and max_frequency

// MARK: - Swift Result Types
// These wrap the C structs for cleaner Swift API

/// PitchResult for Swift API (wraps PitchResultFFI from C header)
public struct PitchResult {
    public let frequency: Float
    public let confidence: Float
    public let isVoiced: Bool
    public let voicedProbability: Float

    init(from c: PitchResultFFI) {
        self.frequency = c.frequency
        self.confidence = c.confidence
        self.isVoiced = c.is_voiced
        self.voicedProbability = c.voiced_probability
    }
}

/// FormantsResult for Swift API (wraps FormantResultFFI from C header)
/// Note: v0.4.0 removed bandwidths, added confidence
public struct FormantsResult {
    public let f1: Float
    public let f2: Float
    public let f3: Float
    public let confidence: Float

    init(from c: FormantResultFFI) {
        self.f1 = c.f1
        self.f2 = c.f2
        self.f3 = c.f3
        self.confidence = c.confidence
    }
}

/// SpectrumResult for Swift API (wraps SpectralFeaturesFFI from C header)
public struct SpectrumResult {
    public let centroid: Float
    public let rolloff: Float
    public let tilt: Float

    init(from c: SpectralFeaturesFFI) {
        self.centroid = c.centroid
        self.rolloff = c.rolloff_95
        self.tilt = c.tilt
    }
}

/// HNRResult for Swift API (wraps HNRResultFFI from C header)
public struct HNRResult {
    public let hnr: Float
    public let f0: Float
    public let isVoiced: Bool

    init(from c: HNRResultFFI) {
        self.hnr = c.hnr
        self.f0 = c.f0
        self.isVoiced = c.is_voiced
    }
}

/// H1H2Result for Swift API (wraps H1H2ResultFFI from C header)
public struct H1H2Result {
    public let h1h2: Float
    public let h1AmplitudeDb: Float
    public let h2AmplitudeDb: Float
    public let f0: Float

    init(from c: H1H2ResultFFI) {
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

// MARK: FFT Wrapper

/// Swift wrapper for FFT computation
/// MEMORY SAFETY: Returns owned array; Rust memory is freed before return
public func computeFFTWrapper(
    buffer: [Float],
    sampleRate: Int,
    fftSize: Int
) throws -> (magnitudes: [Float], frequencies: [Float]) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard fftSize > 0 && (fftSize & (fftSize - 1)) == 0 else {
        throw RustFFIError.invalidInput("FFT size must be a positive power of 2")
    }

    // Call Rust function
    var fftResult = buffer.withUnsafeBufferPointer { bufferPtr -> FFTResultFFI in
        guard let baseAddress = bufferPtr.baseAddress else {
            return FFTResultFFI(
                success: false,
                magnitudes_ptr: nil,
                frequencies_ptr: nil,
                length: 0,
                sample_rate: 0
            )
        }

        return loqa_compute_fft(
            baseAddress,
            buffer.count,
            UInt32(sampleRate),
            fftSize
        )
    }

    // Check for failure
    guard fftResult.success else {
        throw RustFFIError.computationFailed("FFT computation failed")
    }

    guard let magPtr = fftResult.magnitudes_ptr,
          let freqPtr = fftResult.frequencies_ptr else {
        throw RustFFIError.memoryAllocationFailed
    }

    // Copy to Swift arrays before freeing Rust memory
    let magnitudes = Array(UnsafeBufferPointer(start: magPtr, count: fftResult.length))
    let frequencies = Array(UnsafeBufferPointer(start: freqPtr, count: fftResult.length))

    // Free Rust-allocated memory
    loqa_free_fft_result(&fftResult)

    return (magnitudes, frequencies)
}

// MARK: Pitch Detection Wrapper

/// Swift wrapper for pitch detection with min/max frequency support
/// MEMORY SAFETY: PitchResultFFI returned by value (no heap allocation, no cleanup needed)
public func detectPitchWrapper(
    buffer: [Float],
    sampleRate: Int,
    minFrequency: Float = 80.0,
    maxFrequency: Float = 400.0
) throws -> (frequency: Float?, confidence: Float, isVoiced: Bool, voicedProbability: Float) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    guard minFrequency > 0 && maxFrequency > minFrequency else {
        throw RustFFIError.invalidInput("Invalid frequency range: min must be positive and less than max")
    }

    // Call Rust function - returns PitchResultFFI by value (no memory management needed)
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> PitchResultFFI in
        guard let baseAddress = bufferPtr.baseAddress else {
            // Return error result if buffer pointer is invalid
            return PitchResultFFI(
                success: false,
                frequency: 0.0,
                confidence: 0.0,
                is_voiced: false,
                voiced_probability: 0.0
            )
        }

        return loqa_detect_pitch(
            baseAddress,
            buffer.count,
            UInt32(sampleRate),
            minFrequency,
            maxFrequency
        )
    }

    // Check for failure
    guard cResult.success else {
        throw RustFFIError.computationFailed("Pitch detection failed")
    }

    // Convert to Swift result
    let result = PitchResult(from: cResult)

    // Convert frequency: 0.0 -> nil, otherwise use actual value
    let frequency = result.isVoiced && result.frequency > 0 ? result.frequency : nil

    return (frequency, result.confidence, result.isVoiced, result.voicedProbability)
}

// MARK: Formant Extraction Wrapper

/// Swift wrapper for formant extraction
/// MEMORY SAFETY: FormantResultFFI returned by value (no heap allocation, no cleanup needed)
/// Note: v0.4.0 returns confidence instead of bandwidths
public func extractFormantsWrapper(
    buffer: [Float],
    sampleRate: Int,
    lpcOrder: Int = 12
) throws -> (f1: Float, f2: Float, f3: Float, confidence: Float) {
    // Input validation
    guard !buffer.isEmpty else {
        throw RustFFIError.invalidInput("Buffer cannot be empty")
    }

    guard sampleRate >= 8000 && sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    guard lpcOrder >= 10 && lpcOrder <= 24 else {
        throw RustFFIError.invalidInput("LPC order must be between 10 and 24")
    }

    // Call Rust function - returns FormantResultFFI by value
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> FormantResultFFI in
        guard let baseAddress = bufferPtr.baseAddress else {
            return FormantResultFFI(success: false, f1: 0, f2: 0, f3: 0, confidence: 0)
        }

        return loqa_extract_formants(
            baseAddress,
            buffer.count,
            UInt32(sampleRate),
            lpcOrder
        )
    }

    // Check for failure
    guard cResult.success else {
        throw RustFFIError.computationFailed("Formant extraction failed")
    }

    let result = FormantsResult(from: cResult)
    return (result.f1, result.f2, result.f3, result.confidence)
}

// MARK: Spectrum Analysis Wrapper

/// Swift wrapper for spectrum analysis
/// MEMORY SAFETY: SpectralFeaturesFFI returned by value (no heap allocation, no cleanup needed)
/// Note: This now requires FFT result as input per v0.4.0 API
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

    // First compute FFT
    let fftSize = 2048  // Default FFT size for spectrum analysis
    var fftResult = buffer.withUnsafeBufferPointer { bufferPtr -> FFTResultFFI in
        guard let baseAddress = bufferPtr.baseAddress else {
            return FFTResultFFI(
                success: false,
                magnitudes_ptr: nil,
                frequencies_ptr: nil,
                length: 0,
                sample_rate: 0
            )
        }

        return loqa_compute_fft(
            baseAddress,
            buffer.count,
            UInt32(sampleRate),
            fftSize
        )
    }

    // Check FFT success
    guard fftResult.success else {
        throw RustFFIError.computationFailed("FFT computation failed for spectrum analysis")
    }

    // Call spectrum analysis with FFT result
    let cResult = loqa_analyze_spectrum(&fftResult)

    // Free FFT memory
    loqa_free_fft_result(&fftResult)

    // Check for failure
    guard cResult.success else {
        throw RustFFIError.computationFailed("Spectrum analysis failed")
    }

    let result = SpectrumResult(from: cResult)
    return (result.centroid, result.rolloff, result.tilt)
}

// MARK: HNR Wrapper

/// Swift wrapper for HNR calculation
/// MEMORY SAFETY: HNRResultFFI returned by value (no heap allocation, no cleanup needed)
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

    // Call Rust function - returns HNRResultFFI by value
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> HNRResultFFI in
        guard let baseAddress = bufferPtr.baseAddress else {
            return HNRResultFFI(success: false, hnr: 0, f0: 0, is_voiced: false)
        }

        return loqa_calculate_hnr(
            baseAddress,
            buffer.count,
            UInt32(sampleRate),
            minFrequency,
            maxFrequency
        )
    }

    // Check for failure
    guard cResult.success else {
        throw RustFFIError.computationFailed("HNR calculation failed")
    }

    let result = HNRResult(from: cResult)
    return (result.hnr, result.f0, result.isVoiced)
}

// MARK: H1-H2 Wrapper

/// Swift wrapper for H1-H2 calculation
/// MEMORY SAFETY: H1H2ResultFFI returned by value (no heap allocation, no cleanup needed)
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

    // Call Rust function - returns H1H2ResultFFI by value
    let cResult = buffer.withUnsafeBufferPointer { bufferPtr -> H1H2ResultFFI in
        guard let baseAddress = bufferPtr.baseAddress else {
            return H1H2ResultFFI(success: false, h1h2: 0, h1_amplitude_db: 0, h2_amplitude_db: 0, f0: 0)
        }

        return loqa_calculate_h1h2(
            baseAddress,
            buffer.count,
            UInt32(sampleRate),
            f0Value
        )
    }

    // Check for failure
    guard cResult.success else {
        throw RustFFIError.computationFailed("H1-H2 calculation failed")
    }

    let result = H1H2Result(from: cResult)
    return (result.h1h2, result.h1AmplitudeDb, result.h2AmplitudeDb, result.f0)
}

// MARK: - VoiceAnalyzer Wrapper (Streaming API)

/// Pitch detection algorithm selection
public enum PitchAlgorithm: UInt32 {
    case auto = 0       // Auto-select best algorithm
    case pyin = 1       // Probabilistic YIN (recommended)
    case yin = 2        // Classic YIN
    case autocorr = 3   // Autocorrelation
}

/// VoiceAnalyzer configuration for Swift
public struct VoiceAnalyzerConfig {
    public let sampleRate: UInt32
    public let frameSize: UInt32
    public let hopSize: UInt32
    public let minFrequency: Float
    public let maxFrequency: Float
    public let algorithm: PitchAlgorithm
    public let threshold: Float
    public let minConfidence: Float
    public let interpolate: Bool

    public init(
        sampleRate: UInt32,
        minFrequency: Float = 80.0,
        maxFrequency: Float = 400.0,
        frameSize: UInt32 = 2048,
        hopSize: UInt32 = 512,
        algorithm: PitchAlgorithm = .auto,
        threshold: Float = 0.1,
        minConfidence: Float = 0.5,
        interpolate: Bool = true
    ) {
        self.sampleRate = sampleRate
        self.frameSize = frameSize
        self.hopSize = hopSize
        self.minFrequency = minFrequency
        self.maxFrequency = maxFrequency
        self.algorithm = algorithm
        self.threshold = threshold
        self.minConfidence = minConfidence
        self.interpolate = interpolate
    }

    /// Convert to C FFI struct (field order must match Rust struct exactly)
    func toFFI() -> AnalysisConfigFFI {
        return AnalysisConfigFFI(
            sample_rate: sampleRate,
            frame_size: frameSize,
            hop_size: hopSize,
            min_frequency: minFrequency,
            max_frequency: maxFrequency,
            algorithm: algorithm.rawValue,
            threshold: threshold,
            min_confidence: minConfidence,
            interpolate: interpolate
        )
    }
}

/// Opaque handle to a VoiceAnalyzer instance
/// MEMORY SAFETY: The pointer is owned by this class and freed on deinit
public class VoiceAnalyzerHandle {
    private var pointer: UnsafeMutableRawPointer?
    public let config: VoiceAnalyzerConfig

    init(pointer: UnsafeMutableRawPointer, config: VoiceAnalyzerConfig) {
        self.pointer = pointer
        self.config = config
    }

    deinit {
        if let ptr = pointer {
            loqa_voice_analyzer_free(ptr)
            pointer = nil
        }
    }

    /// Get the raw pointer for FFI calls
    func getPointer() -> UnsafeMutableRawPointer? {
        return pointer
    }

    /// Invalidate the handle (for manual cleanup)
    func invalidate() {
        if let ptr = pointer {
            loqa_voice_analyzer_free(ptr)
            pointer = nil
        }
    }
}

/// Creates a new VoiceAnalyzer instance
/// MEMORY SAFETY: Returns a handle that owns the Rust memory; freed on handle deinit
public func createVoiceAnalyzerWrapper(
    config: VoiceAnalyzerConfig
) throws -> VoiceAnalyzerHandle {
    // Validate config
    guard config.sampleRate >= 8000 && config.sampleRate <= 48000 else {
        throw RustFFIError.invalidInput("Sample rate must be between 8000 and 48000 Hz")
    }

    guard config.minFrequency > 0 && config.maxFrequency > config.minFrequency else {
        throw RustFFIError.invalidInput("Invalid frequency range")
    }

    guard config.frameSize > 0 && config.hopSize > 0 else {
        throw RustFFIError.invalidInput("Frame size and hop size must be positive")
    }

    // Create the analyzer
    let ffiConfig = config.toFFI()
    guard let pointer = loqa_voice_analyzer_new(ffiConfig) else {
        throw RustFFIError.memoryAllocationFailed
    }

    return VoiceAnalyzerHandle(pointer: pointer, config: config)
}

/// Process audio samples through the VoiceAnalyzer
/// Returns an array of PitchResult for each frame
/// MEMORY SAFETY: Results are copied to Swift before returning
public func processAudioWithAnalyzer(
    analyzer: VoiceAnalyzerHandle,
    samples: [Float]
) throws -> [PitchResult] {
    guard let pointer = analyzer.getPointer() else {
        throw RustFFIError.invalidInput("Analyzer handle is invalid")
    }

    guard !samples.isEmpty else {
        return []
    }

    // Calculate maximum number of results based on frame/hop size
    let frameSize = Int(analyzer.config.frameSize)
    let hopSize = Int(analyzer.config.hopSize)
    let maxResults = max(1, (samples.count - frameSize) / hopSize + 1)

    // Allocate output buffer for results
    var resultsBuffer = [PitchResultFFI](repeating: PitchResultFFI(
        success: false,
        frequency: 0,
        confidence: 0,
        is_voiced: false,
        voiced_probability: 0
    ), count: maxResults)

    // Call Rust function
    let resultCount = samples.withUnsafeBufferPointer { samplesPtr -> Int in
        guard let samplesBase = samplesPtr.baseAddress else { return 0 }

        return resultsBuffer.withUnsafeMutableBufferPointer { resultsPtr -> Int in
            guard let resultsBase = resultsPtr.baseAddress else { return 0 }

            return loqa_voice_analyzer_process_stream(
                pointer,
                samplesBase,
                samples.count,
                resultsBase,
                maxResults
            )
        }
    }

    // Convert FFI results to Swift
    var pitchResults: [PitchResult] = []
    for i in 0..<resultCount {
        let ffiResult = resultsBuffer[i]
        if ffiResult.success {
            pitchResults.append(PitchResult(from: ffiResult))
        }
    }

    return pitchResults
}

/// Reset the VoiceAnalyzer state (for reusing with new audio)
public func resetVoiceAnalyzerWrapper(analyzer: VoiceAnalyzerHandle) throws {
    guard let pointer = analyzer.getPointer() else {
        throw RustFFIError.invalidInput("Analyzer handle is invalid")
    }
    loqa_voice_analyzer_reset(pointer)
}

/// Free the VoiceAnalyzer (called automatically on handle deinit)
public func freeVoiceAnalyzerWrapper(analyzer: VoiceAnalyzerHandle) {
    analyzer.invalidate()
}

// MARK: - PitchTrack for HMM-smoothed Viterbi decoding (v0.5.0)

/// Result of process_buffer with HMM-smoothed Viterbi decoding
public struct PitchTrack {
    /// Pitch estimates per frame in Hz (0.0 = unvoiced)
    public let pitchTrack: [Float]
    /// Voiced probability per frame [0.0, 1.0]
    public let voicedProbabilities: [Float]
    /// Frame timestamps in seconds from buffer start
    public let timestamps: [Float]
}

/// Process audio buffer with HMM-smoothed Viterbi decoding for globally optimal pitch track
///
/// Unlike `processAudioWithAnalyzer` which treats frames independently, this method uses
/// Viterbi decoding to find the globally optimal pitch track across all frames,
/// reducing octave errors (from ~8-12% to ≤3%) and producing smoother contours.
///
/// Best suited for offline analysis of complete utterances (typically < 60 seconds).
/// For longer recordings, segment into utterances first.
///
/// **Note:** Always uses pYIN algorithm regardless of config settings.
///
/// - Parameters:
///   - analyzer: VoiceAnalyzerHandle from createVoiceAnalyzerWrapper
///   - samples: Complete audio buffer to analyze
/// - Returns: PitchTrack with smoothed pitch estimates
/// - Throws: RustFFIError if analyzer is invalid or processing fails
public func processBufferWithAnalyzer(
    analyzer: VoiceAnalyzerHandle,
    samples: [Float]
) throws -> PitchTrack {
    guard let pointer = analyzer.getPointer() else {
        throw RustFFIError.invalidInput("Analyzer handle is invalid")
    }

    guard !samples.isEmpty else {
        throw RustFFIError.invalidInput("Samples cannot be empty")
    }

    // Call Rust FFI function
    var result = samples.withUnsafeBufferPointer { samplesPtr -> PitchTrackFFI in
        guard let samplesBase = samplesPtr.baseAddress else {
            return PitchTrackFFI(
                success: false,
                pitch_track_ptr: nil,
                voiced_probs_ptr: nil,
                timestamps_ptr: nil,
                length: 0
            )
        }
        return loqa_voice_analyzer_process_buffer(pointer, samplesBase, samples.count)
    }

    // Check for success
    guard result.success else {
        throw RustFFIError.computationFailed("Buffer processing with Viterbi decoding failed")
    }

    // Copy to Swift arrays before freeing Rust memory
    let length = result.length

    var pitchTrack: [Float] = []
    var voicedProbs: [Float] = []
    var timestamps: [Float] = []

    if let pitchPtr = result.pitch_track_ptr, length > 0 {
        pitchTrack = Array(UnsafeBufferPointer(start: pitchPtr, count: length))
    }

    if let probsPtr = result.voiced_probs_ptr, length > 0 {
        voicedProbs = Array(UnsafeBufferPointer(start: probsPtr, count: length))
    }

    if let timesPtr = result.timestamps_ptr, length > 0 {
        timestamps = Array(UnsafeBufferPointer(start: timesPtr, count: length))
    }

    // Free Rust memory
    loqa_free_pitch_track(&result)

    return PitchTrack(
        pitchTrack: pitchTrack,
        voicedProbabilities: voicedProbs,
        timestamps: timestamps
    )
}

/*
 MEMORY MANAGEMENT PATTERN FOR FFI CALLS
 ========================================

 This file implements a consistent pattern for safe memory management across the FFI boundary:

 1. POINTER-RETURNING FUNCTIONS (e.g., loqa_compute_fft):
    - Rust allocates memory and returns a struct with pointers
    - Swift copies data to Swift-owned arrays immediately
    - Swift calls loqa_free_fft_result() to deallocate Rust memory
    - Pattern: allocate -> copy -> free -> return Swift array

 2. VALUE-RETURNING FUNCTIONS (e.g., loqa_detect_pitch):
    - Rust returns a struct by value (not a pointer)
    - Each struct has a 'success' field to indicate success/failure
    - No memory management needed - struct is copied to Swift stack
    - Pattern: call -> check success -> return Swift tuple

 CRITICAL SAFETY RULES:
 - Always check the 'success' field before using other fields
 - Always copy pointer data before any operation that could fail
 - Always free Rust memory in the same function that receives it
 - Never store Rust pointers in Swift properties
 - Use defer { } for cleanup when there are multiple exit points

 loqa-voice-dsp v0.4.0 CHANGES:
 - All result structs now have 'success: bool' as first field
 - PitchResultFFI has new 'voiced_probability' field
 - FormantResultFFI changed from bandwidths to 'confidence'
 - Function names changed from *_rust to loqa_*
 - loqa_detect_pitch now takes min_frequency and max_frequency

 REFERENCE:
 See Architecture Document - Memory Management at FFI/JNI Boundary
 docs/architecture.md#memory-management-at-ffijni-boundary
 */
