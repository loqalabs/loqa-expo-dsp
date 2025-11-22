import ExpoModulesCore

public class LoqaAudioDspModule: Module {
  // Module definition for Expo Modules API
  public func definition() -> ModuleDefinition {
    // Module name that JavaScript will use to require this module
    Name("LoqaAudioDsp")

    // MARK: - computeFFT (Implemented in Story 2.2)
    // Calls Rust FFT via RustBridge.computeFFTWrapper()
    AsyncFunction("computeFFT") { (buffer: [Float], options: [String: Any], promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
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
    }

    // MARK: - detectPitch (Placeholder for Epic 3)
    // Will be fully implemented in Story 3.3 with actual Rust FFI calls
    AsyncFunction("detectPitch") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          // Placeholder implementation - returns zero values
          // Story 3.3 will call RustBridge.detectPitchWrapper()
          let minFrequency = options["minFrequency"] as? Float ?? 80.0
          let maxFrequency = options["maxFrequency"] as? Float ?? 400.0

          // Validate inputs
          guard !buffer.isEmpty else {
            promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
            return
          }

          guard sampleRate >= 8000 && sampleRate <= 48000 else {
            promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
            return
          }

          // Placeholder: Return null frequency and zero confidence
          let result: [String: Any] = [
            "frequency": NSNull(),
            "confidence": 0.0,
            "isVoiced": false
          ]

          promise.resolve(result)
        } catch {
          promise.reject("PITCH_ERROR", error.localizedDescription, error)
        }
      }
    }

    // MARK: - extractFormants (Placeholder for Epic 3)
    // Will be fully implemented in Story 3.3 with actual Rust FFI calls
    AsyncFunction("extractFormants") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          // Placeholder implementation - returns zero values
          // Story 3.3 will call RustBridge.extractFormantsWrapper()
          let lpcOrder = options["lpcOrder"] as? Int

          // Validate inputs
          guard !buffer.isEmpty else {
            promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
            return
          }

          guard sampleRate >= 8000 && sampleRate <= 48000 else {
            promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
            return
          }

          // Placeholder: Return zero formants
          let result: [String: Any] = [
            "f1": 0.0,
            "f2": 0.0,
            "f3": 0.0,
            "bandwidths": [
              "f1": 0.0,
              "f2": 0.0,
              "f3": 0.0
            ]
          ]

          promise.resolve(result)
        } catch {
          promise.reject("FORMANTS_ERROR", error.localizedDescription, error)
        }
      }
    }

    // MARK: - analyzeSpectrum (Placeholder for Epic 4)
    // Will be fully implemented in Story 4.2 with actual Rust FFI calls
    AsyncFunction("analyzeSpectrum") { (buffer: [Float], sampleRate: Int, options: [String: Any], promise: Promise) in
      DispatchQueue.global(qos: .userInitiated).async {
        do {
          // Placeholder implementation - returns zero values
          // Story 4.2 will call RustBridge.analyzeSpectrumWrapper()

          // Validate inputs
          guard !buffer.isEmpty else {
            promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
            return
          }

          guard sampleRate >= 8000 && sampleRate <= 48000 else {
            promise.reject("VALIDATION_ERROR", "Sample rate must be between 8000 and 48000 Hz")
            return
          }

          // Placeholder: Return zero spectral features
          let result: [String: Any] = [
            "centroid": 0.0,
            "rolloff": 0.0,
            "tilt": 0.0
          ]

          promise.resolve(result)
        } catch {
          promise.reject("SPECTRUM_ERROR", error.localizedDescription, error)
        }
      }
    }
  }
}
