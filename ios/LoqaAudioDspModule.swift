import ExpoModulesCore

public class LoqaAudioDspModule: Module {
  // Module definition for Expo Modules API
  public func definition() -> ModuleDefinition {
    // Module name that JavaScript will use to require this module
    Name("LoqaAudioDsp")

    // MARK: - computeFFT (Implemented in Story 2.2)
    // Calls Rust FFT via RustBridge.computeFFTWrapper()
    AsyncFunction("computeFFT") { (buffer: [Float], options: [String: Any], promise: Promise) in
      do {
        // Extract options with defaults
        let fftSize = options["fftSize"] as? Int ?? buffer.count
        let windowTypeString = options["windowType"] as? String ?? "hanning"
        let sampleRate = options["sampleRate"] as? Double ?? 44100.0

        // Validate inputs
        guard !buffer.isEmpty else {
          promise.reject("VALIDATION_ERROR", "Buffer cannot be empty", nil)
          return
        }

        guard fftSize > 0 && (fftSize & (fftSize - 1)) == 0 else {
          promise.reject("VALIDATION_ERROR", "FFT size must be a power of 2", nil)
          return
        }

        guard fftSize >= 256 && fftSize <= 8192 else {
          promise.reject("VALIDATION_ERROR", "FFT size must be between 256 and 8192", nil)
          return
        }

        // Map windowType string to integer (none=0, hanning=1, hamming=2, blackman=3)
        let windowType: Int32
        switch windowTypeString.lowercased() {
        case "none":
          windowType = 0
        case "hanning":
          windowType = 1
        case "hamming":
          windowType = 2
        case "blackman":
          windowType = 3
        default:
          promise.reject("VALIDATION_ERROR", "Invalid window type. Must be one of: none, hanning, hamming, blackman", nil)
          return
        }

        // Call Rust FFT function via wrapper
        let magnitude = try computeFFTWrapper(buffer: buffer, fftSize: fftSize, windowType: windowType)

        // Build frequency array: freq[i] = (sampleRate / fftSize) * i
        let frequencies = (0..<magnitude.count).map { Float(sampleRate / Double(fftSize) * Double($0)) }

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
          promise.reject("VALIDATION_ERROR", message, nil)
        case .computationFailed(let message):
          promise.reject("FFT_ERROR", message, nil)
        case .memoryAllocationFailed:
          promise.reject("FFT_ERROR", "Memory allocation failed in Rust FFT computation", nil)
        }
      } catch {
        // Handle unexpected errors
        promise.reject("FFT_ERROR", error.localizedDescription, error)
      }
    }

    // MARK: - detectPitch (Implemented in Story 3.3)
    // Calls Rust YIN pitch detection via RustBridge.detectPitchWrapper()
    AsyncFunction("detectPitch") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
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

        // Call Rust pitch detection via wrapper
        let (frequency, confidence, isVoiced) = try detectPitchWrapper(
          buffer: buffer,
          sampleRate: sampleRate
        )

        // Build result dictionary matching PitchResult type
        // frequency is Optional<Float>, convert to NSNull if nil
        let result: [String: Any] = [
          "frequency": frequency ?? NSNull(),
          "confidence": confidence,
          "isVoiced": isVoiced
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
        promise.reject("PITCH_ERROR", error.localizedDescription, error)
      }
    }

    // MARK: - extractFormants (Implemented in Story 3.3)
    // Calls Rust LPC formant extraction via RustBridge.extractFormantsWrapper()
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

        // Call Rust formant extraction via wrapper
        let (f1, f2, f3, bandwidths) = try extractFormantsWrapper(
          buffer: buffer,
          sampleRate: sampleRate,
          lpcOrder: lpcOrder
        )

        // Build result dictionary matching FormantsResult type
        let result: [String: Any] = [
          "f1": f1,
          "f2": f2,
          "f3": f3,
          "bandwidths": [
            "f1": bandwidths.0,
            "f2": bandwidths.1,
            "f3": bandwidths.2
          ]
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
        promise.reject("FORMANTS_ERROR", error.localizedDescription, error)
      }
    }

    // MARK: - analyzeSpectrum (Implemented in Story 4.2)
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
        promise.reject("SPECTRUM_ERROR", error.localizedDescription, error)
      }
    }
  }
}
