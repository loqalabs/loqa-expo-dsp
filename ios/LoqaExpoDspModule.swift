import ExpoModulesCore

public class LoqaExpoDspModule: Module {
  // Module definition for Expo Modules API
  // Updated for loqa-voice-dsp v0.4.0
  public func definition() -> ModuleDefinition {
    // Module name that JavaScript will use to require this module
    Name("LoqaExpoDsp")

    // MARK: - computeFFT
    // Calls Rust FFT via RustBridge.computeFFTWrapper()
    AsyncFunction("computeFFT") { (buffer: [Float], options: [String: Any], promise: Promise) in
      do {
        // Extract options with defaults
        let fftSize = options["fftSize"] as? Int ?? buffer.count
        let sampleRate = options["sampleRate"] as? Int ?? 44100

        // Validate inputs
        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
          return
        }

        guard fftSize > 0 && (fftSize & (fftSize - 1)) == 0 else {
          promise.reject("VALIDATION_ERROR", "FFT size must be a power of 2")
          return
        }

        guard fftSize >= 256 && fftSize <= 8192 else {
          promise.reject("VALIDATION_ERROR", "FFT size must be between 256 and 8192")
          return
        }

        // Call Rust FFT function via wrapper (v0.4.0 API)
        let (magnitude, frequencies) = try computeFFTWrapper(
          buffer: buffer,
          sampleRate: sampleRate,
          fftSize: fftSize
        )

        // Return result dictionary
        let result: [String: Any] = [
          "magnitude": magnitude,
          "frequencies": frequencies
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        // Handle Rust FFI errors with specific error codes
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("FFT_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("FFT_ERROR", "Memory allocation failed in Rust FFT computation")
        }
      } catch {
        // Handle unexpected errors
        promise.reject("FFT_ERROR", error.localizedDescription)
      }
    }

    // MARK: - detectPitch
    // Calls Rust pYIN pitch detection via RustBridge.detectPitchWrapper()
    // v0.4.0: Now supports min/max frequency and returns voicedProbability
    AsyncFunction("detectPitch") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
      do {
        // Extract options with defaults for human voice
        let minFrequency = (options["minFrequency"] as? Double).map { Float($0) } ?? 80.0
        let maxFrequency = (options["maxFrequency"] as? Double).map { Float($0) } ?? 400.0

        // Validate inputs (basic validation - detailed validation in RustBridge)
        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
          return
        }

        guard sampleRate >= 8000 && sampleRate <= 48000 else {
          promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
          return
        }

        // Call Rust pitch detection via wrapper (v0.4.0 API with min/max frequency)
        let (frequency, confidence, isVoiced, voicedProbability) = try detectPitchWrapper(
          buffer: buffer,
          sampleRate: sampleRate,
          minFrequency: minFrequency,
          maxFrequency: maxFrequency
        )

        // Build result dictionary matching PitchResult type
        // frequency is Optional<Float>, convert to NSNull if nil
        let result: [String: Any] = [
          "frequency": frequency ?? NSNull(),
          "confidence": confidence,
          "isVoiced": isVoiced,
          "voicedProbability": voicedProbability
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        // Handle Rust FFI errors with specific error codes
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("PITCH_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("PITCH_ERROR", "Memory allocation failed in Rust pitch detection")
        }
      } catch {
        // Handle unexpected errors
        promise.reject("PITCH_ERROR", error.localizedDescription)
      }
    }

    // MARK: - extractFormants
    // Calls Rust LPC formant extraction via RustBridge.extractFormantsWrapper()
    // v0.4.0: Now returns confidence instead of bandwidths
    AsyncFunction("extractFormants") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
      do {
        // Extract optional LPC order from options
        let lpcOrder = options["lpcOrder"] as? Int

        // Validate inputs (basic validation - detailed validation in RustBridge)
        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
          return
        }

        guard sampleRate >= 8000 && sampleRate <= 48000 else {
          promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
          return
        }

        // Call Rust formant extraction via wrapper (v0.4.0 API)
        let (f1, f2, f3, confidence) = try extractFormantsWrapper(
          buffer: buffer,
          sampleRate: sampleRate,
          lpcOrder: lpcOrder ?? 12
        )

        // Build result dictionary matching FormantsResult type
        // v0.4.0 BREAKING CHANGE: confidence replaces bandwidths
        let result: [String: Any] = [
          "f1": f1,
          "f2": f2,
          "f3": f3,
          "confidence": confidence
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        // Handle Rust FFI errors with specific error codes
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("FORMANTS_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("FORMANTS_ERROR", "Memory allocation failed in Rust formant extraction")
        }
      } catch {
        // Handle unexpected errors
        promise.reject("FORMANTS_ERROR", error.localizedDescription)
      }
    }

    // MARK: - analyzeSpectrum
    // Calls Rust spectral analysis via RustBridge.analyzeSpectrumWrapper()
    AsyncFunction("analyzeSpectrum") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
      do {
        // Validate inputs (basic validation - detailed validation in RustBridge)
        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
          return
        }

        guard sampleRate >= 8000 && sampleRate <= 48000 else {
          promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
          return
        }

        // Call Rust spectral analysis via wrapper
        let (centroid, rolloff, tilt) = try analyzeSpectrumWrapper(
          buffer: buffer,
          sampleRate: sampleRate
        )

        // Build result dictionary matching SpectrumResult type
        let result: [String: Any] = [
          "centroid": centroid,
          "rolloff": rolloff,
          "tilt": tilt
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        // Handle Rust FFI errors with specific error codes
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("SPECTRUM_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("SPECTRUM_ERROR", "Memory allocation failed in Rust spectrum analysis")
        }
      } catch {
        // Handle unexpected errors
        promise.reject("SPECTRUM_ERROR", error.localizedDescription)
      }
    }

    // MARK: - calculateHNR (Harmonics-to-Noise Ratio for breathiness analysis)
    // Calls Rust HNR calculation via RustBridge.calculateHNRWrapper()
    AsyncFunction("calculateHNR") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
      do {
        // Extract options with defaults
        let minFreq = options["minFreq"] as? Float ?? 75.0
        let maxFreq = options["maxFreq"] as? Float ?? 500.0

        // Validate inputs (basic validation - detailed validation in RustBridge)
        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
          return
        }

        guard sampleRate >= 8000 && sampleRate <= 48000 else {
          promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
          return
        }

        // Call Rust HNR calculation via wrapper
        let (hnr, f0, isVoiced) = try calculateHNRWrapper(
          buffer: buffer,
          sampleRate: sampleRate,
          minFrequency: minFreq,
          maxFrequency: maxFreq
        )

        // Build result dictionary matching HNRResult type
        let result: [String: Any] = [
          "hnr": hnr,
          "f0": f0,
          "isVoiced": isVoiced
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        // Handle Rust FFI errors with specific error codes
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("HNR_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("HNR_ERROR", "Memory allocation failed in Rust HNR calculation")
        }
      } catch {
        // Handle unexpected errors
        promise.reject("HNR_ERROR", error.localizedDescription)
      }
    }

    // MARK: - calculateH1H2 (H1-H2 amplitude difference for vocal weight analysis)
    // Calls Rust H1-H2 calculation via RustBridge.calculateH1H2Wrapper()
    AsyncFunction("calculateH1H2") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
      do {
        // Extract optional f0 from options (0 or nil means auto-detect)
        let f0 = options["f0"] as? Float

        // Validate inputs (basic validation - detailed validation in RustBridge)
        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
          return
        }

        guard sampleRate >= 8000 && sampleRate <= 48000 else {
          promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
          return
        }

        // Call Rust H1-H2 calculation via wrapper
        let (h1h2, h1AmplitudeDb, h2AmplitudeDb, detectedF0) = try calculateH1H2Wrapper(
          buffer: buffer,
          sampleRate: sampleRate,
          f0: f0
        )

        // Build result dictionary matching H1H2Result type
        let result: [String: Any] = [
          "h1h2": h1h2,
          "h1AmplitudeDb": h1AmplitudeDb,
          "h2AmplitudeDb": h2AmplitudeDb,
          "f0": detectedF0
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        // Handle Rust FFI errors with specific error codes
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("H1H2_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("H1H2_ERROR", "Memory allocation failed in Rust H1-H2 calculation")
        }
      } catch {
        // Handle unexpected errors
        promise.reject("H1H2_ERROR", error.localizedDescription)
      }
    }

    // MARK: - VoiceAnalyzer Streaming API (v0.3.0)
    // Stateful pitch tracking with HMM smoothing for analyzing longer audio clips

    // MARK: - createVoiceAnalyzer
    // Creates a new VoiceAnalyzer instance with configuration
    AsyncFunction("createVoiceAnalyzer") { (config: [String: Any], promise: Promise) in
      do {
        // Extract config with defaults
        guard let sampleRate = config["sampleRate"] as? Int else {
          promise.reject("VALIDATION_ERROR", "sampleRate is required")
          return
        }
        let minFrequency = (config["minFrequency"] as? Double).map { Float($0) } ?? 80.0
        let maxFrequency = (config["maxFrequency"] as? Double).map { Float($0) } ?? 400.0
        let frameSize = UInt32(config["frameSize"] as? Int ?? 2048)
        let hopSize = UInt32(config["hopSize"] as? Int ?? Int(frameSize / 4))

        // Validate sample rate
        guard sampleRate >= 8000 && sampleRate <= 48000 else {
          promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
          return
        }

        // Create config struct with all required fields for Rust FFI
        let analyzerConfig = VoiceAnalyzerConfig(
          sampleRate: UInt32(sampleRate),
          minFrequency: minFrequency,
          maxFrequency: maxFrequency,
          frameSize: frameSize,
          hopSize: hopSize,
          algorithm: .auto,       // Use auto-selection for best results
          threshold: 0.1,         // Default YIN threshold
          minConfidence: 0.5,     // Minimum confidence for voiced detection
          interpolate: true       // Enable parabolic interpolation
        )

        // Create analyzer
        let handle = try createVoiceAnalyzerWrapper(config: analyzerConfig)

        // Store handle and return ID
        let id = LoqaExpoDspModule.storeAnalyzer(handle)

        let result: [String: Any] = [
          "id": id,
          "config": [
            "sampleRate": sampleRate,
            "minFrequency": minFrequency,
            "maxFrequency": maxFrequency,
            "frameSize": Int(frameSize),
            "hopSize": Int(hopSize)
          ]
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("ANALYZER_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("ANALYZER_ERROR", "Memory allocation failed creating VoiceAnalyzer")
        }
      } catch {
        promise.reject("ANALYZER_ERROR", error.localizedDescription)
      }
    }

    // MARK: - analyzeClip
    // Process audio through VoiceAnalyzer and return aggregated results
    AsyncFunction("analyzeClip") { (analyzerId: String, buffer: [Float], promise: Promise) in
      do {
        // Get analyzer handle
        guard let handle = LoqaExpoDspModule.getAnalyzer(id: analyzerId) else {
          promise.reject("VALIDATION_ERROR", "Invalid analyzer ID: \(analyzerId)")
          return
        }

        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
          return
        }

        // Process audio through analyzer
        let frames = try processAudioWithAnalyzer(analyzer: handle, samples: buffer)

        // Calculate aggregate statistics
        let voicedFrames = frames.filter { $0.isVoiced }
        let voicedFrequencies = voicedFrames.compactMap { $0.frequency > 0 ? $0.frequency : nil }

        // Convert frames to dictionaries
        let frameDicts: [[String: Any]] = frames.map { frame in
          return [
            "frequency": frame.frequency > 0 && frame.isVoiced ? frame.frequency : NSNull(),
            "confidence": frame.confidence,
            "isVoiced": frame.isVoiced,
            "voicedProbability": frame.voicedProbability
          ]
        }

        // Calculate statistics
        let medianPitch: Float? = voicedFrequencies.isEmpty ? nil : {
          let sorted = voicedFrequencies.sorted()
          let mid = sorted.count / 2
          if sorted.count % 2 == 0 {
            return (sorted[mid - 1] + sorted[mid]) / 2
          } else {
            return sorted[mid]
          }
        }()

        let meanPitch: Float? = voicedFrequencies.isEmpty ? nil : voicedFrequencies.reduce(0, +) / Float(voicedFrequencies.count)

        let pitchStdDev: Float? = voicedFrequencies.count < 2 ? nil : {
          guard let mean = meanPitch else { return nil }
          let variance = voicedFrequencies.reduce(0) { $0 + pow($1 - mean, 2) } / Float(voicedFrequencies.count)
          return sqrt(variance)
        }()

        let meanConfidence: Float? = voicedFrames.isEmpty ? nil : voicedFrames.reduce(0) { $0 + $1.confidence } / Float(voicedFrames.count)

        let meanVoicedProbability: Float = frames.isEmpty ? 0 : frames.reduce(0) { $0 + $1.voicedProbability } / Float(frames.count)

        // Build result
        let result: [String: Any] = [
          "frames": frameDicts,
          "frameCount": frames.count,
          "voicedFrameCount": voicedFrames.count,
          "medianPitch": medianPitch ?? NSNull(),
          "meanPitch": meanPitch ?? NSNull(),
          "pitchStdDev": pitchStdDev ?? NSNull(),
          "meanConfidence": meanConfidence ?? NSNull(),
          "meanVoicedProbability": meanVoicedProbability
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("ANALYZER_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("ANALYZER_ERROR", "Memory allocation failed during analysis")
        }
      } catch {
        promise.reject("ANALYZER_ERROR", error.localizedDescription)
      }
    }

    // MARK: - processBuffer
    // Process audio with HMM-smoothed Viterbi decoding for globally optimal pitch track
    // Unlike analyzeClip which treats frames independently, this uses Viterbi decoding
    // to reduce octave errors (from ~8-12% to ≤3%) and produce smoother contours.
    AsyncFunction("processBuffer") { (analyzerId: String, buffer: [Float], promise: Promise) in
      do {
        // Get analyzer handle
        guard let handle = LoqaExpoDspModule.getAnalyzer(id: analyzerId) else {
          promise.reject("VALIDATION_ERROR", "Invalid analyzer ID: \(analyzerId)")
          return
        }

        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
          return
        }

        // Process buffer with Viterbi decoding
        let track = try processBufferWithAnalyzer(analyzer: handle, samples: buffer)

        // Calculate aggregate statistics
        let voicedPitches = track.pitchTrack.filter { $0 > 0 }
        let voicedCount = voicedPitches.count

        // Median pitch
        let medianPitch: Float? = voicedPitches.isEmpty ? nil : {
          let sorted = voicedPitches.sorted()
          let mid = sorted.count / 2
          if sorted.count % 2 == 0 {
            return (sorted[mid - 1] + sorted[mid]) / 2
          } else {
            return sorted[mid]
          }
        }()

        // Mean pitch
        let meanPitch: Float? = voicedPitches.isEmpty ? nil :
            voicedPitches.reduce(0, +) / Float(voicedPitches.count)

        // Build result
        let result: [String: Any] = [
          "pitchTrack": track.pitchTrack,
          "voicedProbabilities": track.voicedProbabilities,
          "timestamps": track.timestamps,
          "frameCount": track.pitchTrack.count,
          "voicedFrameCount": voicedCount,
          "medianPitch": medianPitch ?? NSNull(),
          "meanPitch": meanPitch ?? NSNull()
        ]

        promise.resolve(result)
      } catch let error as RustFFIError {
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("ANALYZER_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("ANALYZER_ERROR", "Memory allocation failed during buffer processing")
        }
      } catch {
        promise.reject("ANALYZER_ERROR", error.localizedDescription)
      }
    }

    // MARK: - resetVoiceAnalyzer
    // Reset analyzer state for reuse with new audio
    AsyncFunction("resetVoiceAnalyzer") { (analyzerId: String, promise: Promise) in
      do {
        guard let handle = LoqaExpoDspModule.getAnalyzer(id: analyzerId) else {
          promise.reject("VALIDATION_ERROR", "Invalid analyzer ID: \(analyzerId)")
          return
        }

        try resetVoiceAnalyzerWrapper(analyzer: handle)
        promise.resolve(nil)
      } catch let error as RustFFIError {
        switch error {
        case .invalidInput(let message):
          promise.reject("VALIDATION_ERROR", message)
        case .computationFailed(let message):
          promise.reject("ANALYZER_ERROR", message)
        case .memoryAllocationFailed:
          promise.reject("ANALYZER_ERROR", "Memory allocation failed during reset")
        }
      } catch {
        promise.reject("ANALYZER_ERROR", error.localizedDescription)
      }
    }

    // MARK: - freeVoiceAnalyzer
    // Explicitly free an analyzer (also freed on module unload)
    AsyncFunction("freeVoiceAnalyzer") { (analyzerId: String, promise: Promise) in
      if LoqaExpoDspModule.removeAnalyzer(id: analyzerId) {
        promise.resolve(nil)
      } else {
        promise.reject("VALIDATION_ERROR", "Invalid analyzer ID: \(analyzerId)")
      }
    }
  }

  // MARK: - Analyzer Storage
  // Thread-safe storage for VoiceAnalyzer handles

  private static var analyzers: [String: VoiceAnalyzerHandle] = [:]
  private static let analyzerLock = NSLock()
  private static var nextAnalyzerId: Int = 1

  static func storeAnalyzer(_ handle: VoiceAnalyzerHandle) -> String {
    analyzerLock.lock()
    defer { analyzerLock.unlock() }

    let id = "va_\(nextAnalyzerId)"
    nextAnalyzerId += 1
    analyzers[id] = handle
    return id
  }

  static func getAnalyzer(id: String) -> VoiceAnalyzerHandle? {
    analyzerLock.lock()
    defer { analyzerLock.unlock() }

    return analyzers[id]
  }

  static func removeAnalyzer(id: String) -> Bool {
    analyzerLock.lock()
    defer { analyzerLock.unlock() }

    if analyzers.removeValue(forKey: id) != nil {
      return true
    }
    return false
  }
}
