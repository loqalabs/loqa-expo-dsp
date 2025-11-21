# @loqalabs/loqa-audio-dsp - Architecture Document

**Project:** loqa-audio-dsp
**Author:** Anna
**Date:** 2025-11-20
**Version:** 1.0

---

## Executive Summary

This architecture defines a production-grade Expo native module that wraps the loqa-voice-dsp Rust crate with native iOS (Swift FFI) and Android (Kotlin JNI) bindings. The system follows Expo module conventions, provides TypeScript APIs for four core DSP functions, and emphasizes cross-platform consistency, memory safety at FFI/JNI boundaries, and sub-5ms processing latency.

**Architectural Approach:** Leverage create-expo-module for standardized project structure, use proven FFI/JNI patterns from @loqalabs/loqa-audio-bridge reference implementation, and maintain strict separation between TypeScript API layer, native bindings layer, and Rust DSP core.

---

## Project Initialization

**First Implementation Story: Initialize Expo Module**

```bash
npx create-expo-module@latest loqa-audio-dsp \
  --slug loqa-audio-dsp \
  --name LoqaAudioDsp \
  --package @loqalabs/loqa-audio-dsp \
  --example
```

This establishes:
- Standard Expo module project structure
- iOS module template with Swift
- Android module template with Kotlin
- Example app for testing and demonstration
- TypeScript API scaffolding
- Package.json with Expo module metadata

---

## Decision Summary

| Category | Decision | Version | Affects FRs | Rationale |
|----------|----------|---------|-------------|-----------|
| **Project Foundation** | Expo Module (create-expo-module) | Latest | All FRs | Standard Expo module structure, automatic native integration |
| **TypeScript** | TypeScript strict mode | 5.3+ | FR28-FR43, FR67-FR70 | Type safety, IDE support, developer experience |
| **iOS Language** | Swift | 5.5+ | FR17-FR20 | Modern iOS development, FFI to Rust |
| **Android Language** | Kotlin | 1.9+ | FR21-FR24 | Modern Android development, JNI to Rust |
| **Rust DSP Core** | loqa-voice-dsp crate | 0.x (external) | FR1-FR16 | Battle-tested DSP algorithms |
| **iOS FFI** | Swift FFI (UniFFI or manual) | N/A | FR18-FR19 | Memory-safe Rust interop |
| **Android JNI** | Kotlin JNI via Gradle | N/A | FR22-FR23 | Memory-safe Rust interop |
| **Package Manager** | npm | N/A | FR44-FR51 | Standard JavaScript package distribution |
| **Testing - TypeScript** | Jest | 29+ | FR76-FR77 | Standard React Native testing |
| **Testing - iOS** | XCTest | Xcode default | FR77 | Native iOS unit tests |
| **Testing - Android** | JUnit | 4.13+ | FR77 | Native Android unit tests |
| **CI/CD** | GitHub Actions | N/A | FR75-FR78 | Automated build, test, publish |
| **Linting** | ESLint + Prettier | Latest | FR72 | Code quality and formatting |
| **Documentation** | TypeDoc + JSDoc | Latest | FR67-FR68 | API documentation generation |
| **Versioning** | Semantic Versioning | N/A | FR52-FR54 | Standard npm versioning |
| **Changelog** | Conventional Commits | N/A | FR53 | Automated changelog generation |

---

## Project Structure

```
@loqalabs/loqa-audio-dsp/
├── package.json                    # npm package configuration
├── tsconfig.json                   # TypeScript configuration (strict mode)
├── .eslintrc.js                    # ESLint configuration
├── .prettierrc                     # Prettier configuration
├── expo-module.config.json         # Expo module metadata
├── README.md                       # Main documentation
├── API.md                          # API reference documentation
├── INTEGRATION_GUIDE.md            # Integration patterns guide
├── CHANGELOG.md                    # Version history
├── RELEASING.md                    # Release process documentation
│
├── src/                            # TypeScript source
│   ├── index.ts                    # Main exports (computeFFT, detectPitch, etc.)
│   ├── LoqaAudioDspModule.ts       # Native module bindings
│   ├── types.ts                    # TypeScript type definitions
│   │   ├── FFTResult.ts
│   │   ├── PitchResult.ts
│   │   ├── FormantsResult.ts
│   │   ├── SpectrumResult.ts
│   │   └── LoqaAudioDspConfig.ts
│   ├── validation.ts               # Input validation utilities
│   ├── errors.ts                   # Custom error types
│   └── utils.ts                    # Helper functions
│
├── __tests__/                      # Jest tests for TypeScript
│   ├── computeFFT.test.ts
│   ├── detectPitch.test.ts
│   ├── extractFormants.test.ts
│   ├── analyzeSpectrum.test.ts
│   └── validation.test.ts
│
├── ios/                            # iOS native module
│   ├── LoqaAudioDsp.podspec        # CocoaPods specification
│   ├── LoqaAudioDspModule.swift    # Expo module implementation
│   ├── LoqaAudioDspView.swift      # View component (if needed)
│   ├── RustFFI/                    # Rust FFI bridge
│   │   ├── RustBridge.swift        # Swift wrapper for Rust functions
│   │   └── libloqua_voice_dsp.a    # Compiled Rust library (iOS)
│   └── Tests/                      # XCTest unit tests
│       ├── FFTTests.swift
│       ├── PitchDetectionTests.swift
│       ├── FormantExtractionTests.swift
│       └── SpectrumAnalysisTests.swift
│
├── android/                        # Android native module
│   ├── build.gradle                # Gradle build configuration
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/loqalabs/loquaaudiodsp/
│   │   │   │   ├── LoqaAudioDspModule.kt      # Expo module implementation
│   │   │   │   ├── LoqaAudioDspView.kt        # View component (if needed)
│   │   │   │   └── RustJNI/                   # Rust JNI bridge
│   │   │   │       ├── RustBridge.kt          # Kotlin wrapper for Rust
│   │   │   │       └── libloqua_voice_dsp.so  # Compiled Rust library (Android)
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   │       └── java/com/loqalabs/loquaaudiodsp/
│   │           ├── FFTTests.kt
│   │           ├── PitchDetectionTests.kt
│   │           ├── FormantExtractionTests.kt
│   │           └── SpectrumAnalysisTests.kt
│
├── rust/                           # Rust build configuration (optional)
│   ├── Cargo.toml                  # Rust dependencies (loqa-voice-dsp)
│   ├── build-ios.sh                # iOS library build script
│   └── build-android.sh            # Android library build script
│
├── example/                        # Example Expo app
│   ├── package.json
│   ├── App.tsx                     # Main example app
│   ├── src/
│   │   ├── screens/
│   │   │   ├── FFTDemoScreen.tsx
│   │   │   ├── PitchDemoScreen.tsx
│   │   │   ├── FormantsDemoScreen.tsx
│   │   │   ├── SpectrumDemoScreen.tsx
│   │   │   └── BenchmarkScreen.tsx
│   │   ├── components/
│   │   │   ├── AudioVisualizer.tsx
│   │   │   └── PerformanceMetrics.tsx
│   │   └── utils/
│   │       └── audioBufferGenerator.ts
│
├── .github/                        # GitHub configuration
│   └── workflows/
│       ├── ci.yml                  # CI workflow (lint, test, build)
│       ├── publish.yml             # npm publish workflow
│       └── pr-checks.yml           # Pull request validation
│
└── docs/                           # Additional documentation
    ├── examples/                   # Code examples
    │   ├── basic-fft.md
    │   ├── realtime-pitch.md
    │   ├── formant-analysis.md
    │   └── integration-with-bridge.md
    └── architecture/               # Architecture diagrams (optional)
```

---

## FR Category to Architecture Mapping

| FR Category | Architecture Component | Location |
|-------------|------------------------|----------|
| **Core DSP Capabilities (FR1-FR16)** | Rust loqa-voice-dsp crate via FFI/JNI | `ios/RustFFI/`, `android/src/main/java/.../RustJNI/` |
| **Native Platform Integration (FR17-FR27)** | Swift/Kotlin Expo Modules | `ios/LoqaAudioDspModule.swift`, `android/.../LoqaAudioDspModule.kt` |
| **TypeScript API Layer (FR28-FR43)** | TypeScript API with validation | `src/index.ts`, `src/validation.ts`, `src/types.ts` |
| **Package Distribution (FR44-FR54)** | npm configuration and metadata | `package.json`, `CHANGELOG.md` |
| **Example Application (FR55-FR62)** | Expo example app | `example/` |
| **Documentation (FR63-FR70)** | Markdown docs + JSDoc | `README.md`, `API.md`, `docs/`, inline comments |
| **Build & CI/CD (FR71-FR82)** | GitHub Actions + package scripts | `.github/workflows/`, `package.json` scripts |

---

## Technology Stack Details

### Core Technologies

**Runtime Environment:**
- **Node.js**: 18+ (for development, build, and CI)
- **React Native**: 0.76+ (peer dependency)
- **Expo SDK**: 54+ (peer dependency)

**Language Stack:**
- **TypeScript**: 5.3+ with strict mode enabled
  - Rationale: Type safety, IDE autocomplete, prevents runtime errors
- **Swift**: 5.5+ (iOS)
  - Rationale: Modern iOS development, FFI capabilities
- **Kotlin**: 1.9+ (Android)
  - Rationale: Modern Android development, null safety
- **Rust**: Stable (via loqa-voice-dsp crate)
  - Rationale: High-performance DSP, memory safety

**Native Module Framework:**
- **Expo Modules API**: Latest
  - Rationale: Standardized module creation, automatic linking, turbo module support

**DSP Core:**
- **loqa-voice-dsp**: 0.x (external crate)
  - Provides: YIN pitch detection, LPC formants, FFT, spectral analysis
  - Rationale: Battle-tested algorithms, proven performance

### Build Tools

**iOS:**
- **Xcode**: 15.0+
- **CocoaPods**: 1.12+ (dependency management)
- **Swift Package Manager**: For potential future dependencies

**Android:**
- **Gradle**: 8.0+
- **Android Studio**: 2023.1+
- **NDK**: r26+ (for JNI compilation)

**JavaScript/TypeScript:**
- **npm**: 9+ (package management)
- **TypeScript Compiler**: 5.3+
- **Rollup or TSC**: For TypeScript compilation

### Testing & Quality Tools

**TypeScript Testing:**
- **Jest**: 29+ (unit testing framework)
- **ts-jest**: Latest (TypeScript preprocessor for Jest)

**Native Testing:**
- **XCTest**: Built-in (iOS unit testing)
- **JUnit**: 4.13+ (Android unit testing)

**Code Quality:**
- **ESLint**: 8+ with TypeScript support
- **Prettier**: Latest (code formatting)
- **TypeDoc**: Latest (API documentation generation)

**CI/CD:**
- **GitHub Actions**: Workflow automation
- **npm scripts**: Build automation

### Integration Points

**Expo Modules API Integration:**
- TypeScript layer uses `requireNativeModule('LoqaAudioDsp')` to access native bindings
- Swift/Kotlin modules implement Expo Module Definition protocol
- Supports both old and new architecture (bridge + turbo modules)

**Rust FFI/JNI Integration:**

**iOS (Swift FFI):**
```swift
// RustBridge.swift - FFI declarations
@_silgen_name("compute_fft_rust")
func compute_fft_rust(
    buffer: UnsafePointer<Float>,
    length: Int32,
    fft_size: Int32
) -> UnsafePointer<Float>

// LoqaAudioDspModule.swift - Swift wrapper
public func computeFFT(
    buffer: [Float],
    fftSize: Int
) throws -> [Float] {
    // Marshal Swift array → Rust pointer
    // Call Rust function
    // Marshal Rust result → Swift array
    // Free Rust memory
}
```

**Android (Kotlin JNI):**
```kotlin
// RustBridge.kt - JNI declarations
object RustBridge {
    init {
        System.loadLibrary("loqua_voice_dsp")
    }

    external fun computeFFT(
        buffer: FloatArray,
        fftSize: Int
    ): FloatArray
}

// LoqaAudioDspModule.kt - Kotlin wrapper
@ExpoMethod
fun computeFFT(
    buffer: FloatArray,
    fftSize: Int,
    promise: Promise
) {
    try {
        val result = RustBridge.computeFFT(buffer, fftSize)
        promise.resolve(result)
    } catch (e: Exception) {
        promise.reject("FFT_ERROR", e.message, e)
    }
}
```

**TypeScript to Native Bridge:**
```typescript
// src/LoqaAudioDspModule.ts
import { requireNativeModule } from 'expo-modules-core';

const LoqaAudioDspModule = requireNativeModule('LoqaAudioDsp');

export default LoqaAudioDspModule;

// src/index.ts
import LoqaAudioDspModule from './LoqaAudioDspModule';
import { validateAudioBuffer, validateSampleRate } from './validation';

export async function computeFFT(
  audioBuffer: Float32Array | number[],
  options?: FFTOptions
): Promise<FFTResult> {
  validateAudioBuffer(audioBuffer);

  const fftSize = options?.fftSize || audioBuffer.length;
  validateFFTSize(fftSize);

  const result = await LoqaAudioDspModule.computeFFT(
    Array.from(audioBuffer),
    fftSize
  );

  return {
    magnitude: new Float32Array(result.magnitude),
    phase: result.phase ? new Float32Array(result.phase) : undefined,
    frequencies: new Float32Array(result.frequencies)
  };
}
```

---

## Implementation Patterns

### Naming Conventions

**TypeScript:**
- **Functions**: camelCase (`computeFFT`, `detectPitch`)
- **Types/Interfaces**: PascalCase (`FFTResult`, `PitchResult`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SAMPLE_RATE`)
- **Files**: kebab-case for utilities (`audio-validation.ts`), PascalCase for types (`FFTResult.ts`)

**Swift:**
- **Functions**: camelCase (`computeFFT`, `detectPitch`)
- **Classes/Structs**: PascalCase (`LoqaAudioDspModule`)
- **Files**: PascalCase (`LoqaAudioDspModule.swift`)

**Kotlin:**
- **Functions**: camelCase (`computeFFT`, `detectPitch`)
- **Classes**: PascalCase (`LoqaAudioDspModule`)
- **Files**: PascalCase (`LoqaAudioDspModule.kt`)

### Code Organization

**Test Co-location:**
- TypeScript tests: `__tests__/` directory (Jest convention)
- iOS tests: `ios/Tests/` directory (Xcode convention)
- Android tests: `android/src/test/` directory (Gradle convention)

**Component Organization:**
- By feature: Each DSP function has its own test file
- Shared utilities in `src/utils.ts`, `src/validation.ts`

### Error Handling

**Pattern: Custom Error Classes with Typed Errors**

```typescript
// src/errors.ts
export class LoqaAudioDspError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LoqaAudioDspError';
  }
}

export class ValidationError extends LoqaAudioDspError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NativeModuleError extends LoqaAudioDspError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'NATIVE_MODULE_ERROR', details);
    this.name = 'NativeModuleError';
  }
}

// Usage in API functions
export async function computeFFT(
  audioBuffer: Float32Array | number[],
  options?: FFTOptions
): Promise<FFTResult> {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new ValidationError(
      'Audio buffer cannot be empty',
      { bufferLength: audioBuffer?.length || 0 }
    );
  }

  try {
    const result = await LoqaAudioDspModule.computeFFT(/*...*/);
    return result;
  } catch (error) {
    throw new NativeModuleError(
      `FFT computation failed: ${error.message}`,
      { originalError: error }
    );
  }
}
```

**Error Handling Strategy:**
- All validation errors thrown synchronously before native calls
- Native errors wrapped in `NativeModuleError` with context
- All errors include actionable messages
- Error codes are consistent across platforms

### Logging Strategy

**Pattern: Conditional Logging with Debug Mode**

```typescript
// src/utils.ts
const DEBUG = __DEV__ || process.env.LOQA_AUDIO_DSP_DEBUG === 'true';

export function logDebug(message: string, data?: unknown): void {
  if (DEBUG) {
    console.log(`[LoqaAudioDsp] ${message}`, data || '');
  }
}

export function logWarning(message: string, data?: unknown): void {
  console.warn(`[LoqaAudioDsp] ${message}`, data || '');
}

// Usage
export async function computeFFT(
  audioBuffer: Float32Array | number[],
  options?: FFTOptions
): Promise<FFTResult> {
  logDebug('computeFFT called', {
    bufferLength: audioBuffer.length,
    fftSize: options?.fftSize
  });

  const result = await LoqaAudioDspModule.computeFFT(/*...*/);

  logDebug('computeFFT completed', {
    resultLength: result.magnitude.length
  });

  return result;
}
```

**Logging Conventions:**
- Prefix all logs with `[LoqaAudioDsp]`
- Use `logDebug` for development info (gated by DEBUG flag)
- Use `logWarning` for non-critical issues
- Never log in production unless error/warning

### Memory Management at FFI/JNI Boundary

**Critical Pattern: Explicit Memory Lifecycle**

**iOS (Swift FFI):**
```swift
public func computeFFT(buffer: [Float], fftSize: Int) throws -> [Float] {
    var rustBuffer: UnsafePointer<Float>? = nil
    var rustResult: UnsafePointer<Float>? = nil

    defer {
        // ALWAYS free Rust-allocated memory
        if let ptr = rustResult {
            free_fft_result_rust(ptr)
        }
    }

    buffer.withUnsafeBufferPointer { bufferPtr in
        rustResult = compute_fft_rust(
            bufferPtr.baseAddress!,
            Int32(buffer.count),
            Int32(fftSize)
        )
    }

    guard let result = rustResult else {
        throw NSError(/* ... */)
    }

    // Copy to Swift array before freeing
    let output = Array(UnsafeBufferPointer(
        start: result,
        count: fftSize / 2
    ))

    return output
}
```

**Android (Kotlin JNI):**
```kotlin
@ExpoMethod
fun computeFFT(buffer: FloatArray, fftSize: Int, promise: Promise) {
    try {
        // JNI handles memory automatically for primitive arrays
        // but we validate before calling native
        if (buffer.isEmpty()) {
            promise.reject("VALIDATION_ERROR", "Buffer cannot be empty")
            return
        }

        val result = RustBridge.computeFFT(buffer, fftSize)

        promise.resolve(Arguments.fromArray(result))
    } catch (e: Exception) {
        promise.reject("FFT_ERROR", e.message, e)
    }
}
```

**Memory Safety Rules:**
- iOS: Use `defer` blocks to guarantee Rust memory is freed
- Android: Let JNI handle primitive array marshalling
- Never hold references to Rust-allocated memory beyond function scope
- Always copy data from Rust → Swift/Kotlin before freeing

### Async/Promise Pattern

**All DSP functions return Promises:**

```typescript
// TypeScript API
export async function computeFFT(
  audioBuffer: Float32Array | number[],
  options?: FFTOptions
): Promise<FFTResult> {
  // Returns Promise - non-blocking
}

// Swift implementation (Expo Modules)
@objc
func computeFFT(
    buffer: [Float],
    options: [String: Any],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
) {
    DispatchQueue.global(qos: .userInitiated).async {
        do {
            let result = try self.computeFFTInternal(buffer: buffer, options: options)
            resolve(result)
        } catch {
            reject("FFT_ERROR", error.localizedDescription, error)
        }
    }
}

// Kotlin implementation (Expo Modules)
@ExpoMethod
fun computeFFT(buffer: FloatArray, options: Map<String, Any>, promise: Promise) {
    GlobalScope.launch(Dispatchers.Default) {
        try {
            val result = computeFFTInternal(buffer, options)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("FFT_ERROR", e.message, e)
        }
    }
}
```

**Async Rules:**
- All native processing happens off main thread
- Use appropriate QoS/priority (`.userInitiated` for real-time analysis)
- Never block UI thread

---

## Data Architecture

### TypeScript Type Definitions

```typescript
// src/types.ts

/** Configuration options for FFT computation */
export interface FFTOptions {
  /** FFT size (must be power of 2). Defaults to buffer length. */
  fftSize?: number;
  /** Window function type. Defaults to 'hanning'. */
  windowType?: 'hanning' | 'hamming' | 'blackman' | 'none';
  /** Return phase information. Defaults to false. */
  includePhase?: boolean;
}

/** Result of FFT computation */
export interface FFTResult {
  /** Magnitude spectrum (length = fftSize / 2) */
  magnitude: Float32Array;
  /** Phase spectrum (if requested) */
  phase?: Float32Array;
  /** Frequency bin centers in Hz */
  frequencies: Float32Array;
}

/** Configuration options for pitch detection */
export interface PitchDetectionOptions {
  /** Sample rate in Hz */
  sampleRate: number;
  /** Minimum detectable frequency in Hz. Defaults to 80. */
  minFrequency?: number;
  /** Maximum detectable frequency in Hz. Defaults to 400. */
  maxFrequency?: number;
}

/** Result of pitch detection */
export interface PitchResult {
  /** Detected pitch in Hz (or null if no pitch detected) */
  frequency: number | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether audio is voiced */
  isVoiced: boolean;
}

/** Configuration options for formant extraction */
export interface FormantExtractionOptions {
  /** Sample rate in Hz */
  sampleRate: number;
  /** LPC order. Defaults to sampleRate / 1000 + 2. */
  lpcOrder?: number;
}

/** Result of formant extraction */
export interface FormantsResult {
  /** First formant (F1) in Hz */
  f1: number;
  /** Second formant (F2) in Hz */
  f2: number;
  /** Third formant (F3) in Hz */
  f3: number;
  /** Formant bandwidths in Hz */
  bandwidths: {
    f1: number;
    f2: number;
    f3: number;
  };
}

/** Configuration options for spectrum analysis */
export interface SpectrumAnalysisOptions {
  /** Sample rate in Hz */
  sampleRate: number;
}

/** Result of spectrum analysis */
export interface SpectrumResult {
  /** Spectral centroid in Hz (brightness measure) */
  centroid: number;
  /** Spectral rolloff in Hz (95% energy threshold) */
  rolloff: number;
  /** Spectral tilt (slope of spectrum) */
  tilt: number;
}
```

### Data Flow

**computeFFT Flow:**
```
User Code
  ↓ (Float32Array | number[])
TypeScript API (src/index.ts)
  ↓ Validation + Type Conversion
  ↓ (number[] for React Native bridge)
Native Module (Swift/Kotlin)
  ↓ Array → UnsafePointer/FloatArray
  ↓ FFI/JNI call
Rust loqa-voice-dsp
  ↓ FFT computation
  ↓ Return Vec<f32>
Native Module
  ↓ Copy to Swift/Kotlin array
  ↓ Free Rust memory
TypeScript API
  ↓ Convert to Float32Array
  ↓ Return FFTResult
User Code
```

---

## API Contracts

### TypeScript Public API

**Module Exports:**
```typescript
// src/index.ts - Public API
export { computeFFT } from './computeFFT';
export { detectPitch } from './detectPitch';
export { extractFormants } from './extractFormants';
export { analyzeSpectrum } from './analyzeSpectrum';

export type {
  FFTOptions,
  FFTResult,
  PitchDetectionOptions,
  PitchResult,
  FormantExtractionOptions,
  FormantsResult,
  SpectrumAnalysisOptions,
  SpectrumResult
} from './types';

export {
  LoqaAudioDspError,
  ValidationError,
  NativeModuleError
} from './errors';
```

**Function Signatures:**

```typescript
/**
 * Computes Fast Fourier Transform (FFT) of audio buffer
 * @param audioBuffer - Audio samples (Float32Array or number[])
 * @param options - FFT configuration options
 * @returns Promise resolving to FFT result
 * @throws ValidationError if buffer is invalid
 * @throws NativeModuleError if computation fails
 */
export async function computeFFT(
  audioBuffer: Float32Array | number[],
  options?: FFTOptions
): Promise<FFTResult>;

/**
 * Detects pitch using YIN algorithm
 * @param audioBuffer - Audio samples
 * @param sampleRate - Sample rate in Hz
 * @param options - Pitch detection options
 * @returns Promise resolving to pitch result
 */
export async function detectPitch(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<PitchDetectionOptions>
): Promise<PitchResult>;

/**
 * Extracts formants (F1, F2, F3) using LPC analysis
 * @param audioBuffer - Audio samples
 * @param sampleRate - Sample rate in Hz
 * @param options - Formant extraction options
 * @returns Promise resolving to formants result
 */
export async function extractFormants(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<FormantExtractionOptions>
): Promise<FormantsResult>;

/**
 * Analyzes spectral features (centroid, rolloff, tilt)
 * @param audioBuffer - Audio samples
 * @param sampleRate - Sample rate in Hz
 * @param options - Spectrum analysis options
 * @returns Promise resolving to spectrum result
 */
export async function analyzeSpectrum(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<SpectrumAnalysisOptions>
): Promise<SpectrumResult>;
```

### Native Module Interface

**iOS (Swift):**
```swift
@objc(LoqaAudioDspModule)
public class LoqaAudioDspModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LoqaAudioDsp")

        AsyncFunction("computeFFT") { (buffer: [Float], options: [String: Any]) -> [String: Any] in
            // Implementation
        }

        AsyncFunction("detectPitch") { (buffer: [Float], sampleRate: Int, options: [String: Any]) -> [String: Any] in
            // Implementation
        }

        AsyncFunction("extractFormants") { (buffer: [Float], sampleRate: Int, options: [String: Any]) -> [String: Any] in
            // Implementation
        }

        AsyncFunction("analyzeSpectrum") { (buffer: [Float], sampleRate: Int, options: [String: Any]) -> [String: Any] in
            // Implementation
        }
    }
}
```

**Android (Kotlin):**
```kotlin
class LoqaAudioDspModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("LoqaAudioDsp")

        AsyncFunction("computeFFT") { buffer: FloatArray, options: Map<String, Any> ->
            // Implementation
        }

        AsyncFunction("detectPitch") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any> ->
            // Implementation
        }

        AsyncFunction("extractFormants") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any> ->
            // Implementation
        }

        AsyncFunction("analyzeSpectrum") { buffer: FloatArray, sampleRate: Int, options: Map<String, Any> ->
            // Implementation
        }
    }
}
```

---

## Security Architecture

### Input Validation

**Validation Rules (TypeScript layer):**

```typescript
// src/validation.ts
export function validateAudioBuffer(buffer: Float32Array | number[]): void {
  if (!buffer || buffer.length === 0) {
    throw new ValidationError('Audio buffer cannot be empty');
  }

  if (buffer.length > 16384) {
    throw new ValidationError(
      'Buffer too large (max 16384 samples)',
      { bufferLength: buffer.length }
    );
  }

  // Check for NaN or Infinity
  const hasInvalidValues = Array.from(buffer).some(
    v => !isFinite(v)
  );

  if (hasInvalidValues) {
    throw new ValidationError('Buffer contains NaN or Infinity values');
  }
}

export function validateSampleRate(sampleRate: number): void {
  if (!Number.isInteger(sampleRate)) {
    throw new ValidationError('Sample rate must be an integer');
  }

  if (sampleRate < 8000 || sampleRate > 48000) {
    throw new ValidationError(
      'Sample rate must be between 8000 and 48000 Hz',
      { sampleRate }
    );
  }
}

export function validateFFTSize(fftSize: number): void {
  if (!Number.isInteger(fftSize)) {
    throw new ValidationError('FFT size must be an integer');
  }

  // Check if power of 2
  if (fftSize <= 0 || (fftSize & (fftSize - 1)) !== 0) {
    throw new ValidationError(
      'FFT size must be a power of 2',
      { fftSize }
    );
  }

  if (fftSize < 256 || fftSize > 8192) {
    throw new ValidationError(
      'FFT size must be between 256 and 8192',
      { fftSize }
    );
  }
}
```

**Buffer Overflow Protection:**
- TypeScript layer validates all buffer sizes before native calls
- Native layer performs additional bounds checking
- Rust code uses safe array indexing (no unsafe indexing)

**No Arbitrary Code Execution:**
- Audio data treated as pure data, never evaluated
- No dynamic code generation or eval
- All function calls statically typed

### Dependency Security

**npm Audit:**
- CI pipeline runs `npm audit` on every build
- Fail build if critical/high severity vulnerabilities detected
- Dependencies from trusted sources only (npm registry)

**Dependency Management:**
```json
// package.json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix"
  }
}
```

**GitHub Actions Security Check:**
```yaml
# .github/workflows/ci.yml
- name: Security Audit
  run: npm audit --audit-level=high
```

### Data Privacy

**No Data Transmission:**
- All audio processing happens on-device
- No network calls from native module
- No telemetry or analytics collection

**No Data Storage:**
- Audio buffers processed in memory only
- No automatic file system writes
- Buffers released after processing

---

## Performance Considerations

### Processing Latency Targets

**Target: <5ms per function call (2048-sample buffer)**

**Optimization Strategies:**

1. **Pre-allocated Buffers:**
   - Rust DSP core reuses buffers where possible
   - Minimize memory allocations in hot path

2. **Zero-Copy Where Possible:**
   - iOS: Use `UnsafeBufferPointer` to avoid copying input
   - Android: JNI automatically handles primitive arrays efficiently

3. **Async/Off-Main-Thread:**
   - All processing on background threads
   - Use appropriate QoS (`.userInitiated` for iOS)

4. **Rust Optimizations:**
   - Compile loqa-voice-dsp with `--release` flag
   - Enable LTO (Link-Time Optimization)
   - SIMD instructions where applicable

### Memory Efficiency

**Target: <50MB peak memory usage**

**Memory Management:**
- Immediate deallocation after processing
- No caching of processed results (user's responsibility)
- Explicit `defer` blocks (iOS) to guarantee cleanup
- JNI handles Android memory automatically

### Startup Performance

**Target: Package import <200ms, first call <10ms overhead**

**Lazy Initialization:**
- Native modules loaded on-demand by Expo
- Rust library initialization happens on first call
- No expensive setup in module initialization

---

## Deployment Architecture

### npm Package Structure

**Published Files:**
```
@loqalabs/loqa-audio-dsp/
├── lib/                    # Compiled TypeScript
│   ├── index.js
│   ├── index.d.ts
│   └── ...
├── ios/                    # iOS native code
├── android/                # Android native code
├── package.json
├── README.md
├── API.md
└── LICENSE
```

**package.json Configuration:**
```json
{
  "name": "@loqalabs/loqa-audio-dsp",
  "version": "0.1.0",
  "description": "Production-grade audio DSP analysis for React Native/Expo",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "files": [
    "lib",
    "ios",
    "android",
    "README.md",
    "API.md",
    "LICENSE"
  ],
  "peerDependencies": {
    "expo": "^54.0.0",
    "react": "*",
    "react-native": "*"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "expo-module-scripts": "^3.0.0"
  }
}
```

### CI/CD Pipeline

**GitHub Actions Workflows:**

**1. CI Workflow (`.github/workflows/ci.yml`):**
```yaml
name: CI

on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm audit --audit-level=high

  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: cd example && npm ci
      - run: cd example/ios && pod install
      - run: cd example && npx expo run:ios --configuration Release

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
      - run: npm ci
      - run: cd example && npm ci
      - run: cd example && npx expo run:android --variant release
```

**2. Publish Workflow (`.github/workflows/publish.yml`):**
```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Release Process

**Steps (documented in RELEASING.md):**

1. **Version Bump:**
   ```bash
   npm version patch|minor|major
   ```

2. **Update CHANGELOG:**
   - Document all changes since last release
   - Follow Conventional Commits format

3. **Tag and Push:**
   ```bash
   git push origin main --tags
   ```

4. **Automated Publish:**
   - GitHub Actions automatically publishes to npm on tag push
   - Runs full test suite before publishing

---

## Development Environment

### Prerequisites

**System Requirements:**
- macOS 13+ (for iOS development)
- Node.js 18+
- npm 9+

**iOS Development:**
- Xcode 15.0+
- CocoaPods 1.12+
- iOS Simulator or physical device (iOS 15.1+)

**Android Development:**
- Android Studio 2023.1+
- Android SDK (API 24+)
- Android NDK r26+
- Java 17+

### Setup Commands

**Initial Setup:**
```bash
# Clone repository
git clone https://github.com/loqalabs/loqa-audio-dsp.git
cd loqa-audio-dsp

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Set up example app
cd example
npm install

# iOS: Install pods
cd ios
pod install
cd ..

# Run example app (iOS)
npx expo run:ios

# Run example app (Android)
npx expo run:android
```

**Development Workflow:**
```bash
# Watch mode for TypeScript
npm run dev

# Run linter
npm run lint

# Run type checker
npm run typecheck

# Run all checks
npm run validate
```

**Building Rust Libraries (if modifying Rust):**
```bash
# iOS
cd rust
./build-ios.sh

# Android
./build-android.sh
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Use Expo Modules API Instead of React Native Native Modules

**Context:** Need to create native bindings for iOS and Android.

**Decision:** Use Expo Modules API instead of legacy React Native native modules.

**Rationale:**
- Standard approach for modern Expo development
- Automatic linking and configuration
- Turbo module support for future compatibility
- Better TypeScript integration
- Simpler setup for end users

**Consequences:**
- Requires Expo SDK 54+ (acceptable constraint)
- Slightly different API than pure React Native modules
- Better developer experience overall

### ADR-002: Direct FFI/JNI to Rust Instead of JavaScript DSP

**Context:** Need high-performance DSP computation.

**Decision:** Use native FFI/JNI bindings to Rust loqa-voice-dsp crate.

**Rationale:**
- JavaScript DSP too slow for real-time (<5ms target)
- Rust provides memory safety and performance
- loqa-voice-dsp is battle-tested and proven
- Matches architecture of @loqalabs/loqa-audio-bridge

**Consequences:**
- More complex build process (Rust compilation)
- Requires careful memory management at FFI/JNI boundary
- Much better performance (meets <5ms target)

### ADR-003: Validation in TypeScript Layer, Not Native

**Context:** Need input validation to prevent crashes.

**Decision:** Perform all validation in TypeScript layer before calling native code.

**Rationale:**
- Fail fast with clear error messages
- Reduce native code complexity
- Better error messages (can reference documentation)
- Easier to test validation logic

**Consequences:**
- Slight overhead for validation
- Requires TypeScript and native validation to stay in sync
- Much better developer experience

### ADR-004: Float32Array for Audio Data

**Context:** Need efficient audio buffer representation.

**Decision:** Accept Float32Array or number[] in TypeScript API, convert to native arrays for bridge.

**Rationale:**
- Float32Array is standard for Web Audio API
- Efficient typed array for audio samples
- Easy conversion to Swift/Kotlin arrays
- Familiar to audio developers

**Consequences:**
- Must convert between TypeScript and native representations
- Slight memory overhead for conversion
- Industry-standard API

### ADR-005: Async/Promise-Based API

**Context:** DSP operations should not block UI.

**Decision:** All DSP functions return Promises and run on background threads.

**Rationale:**
- Prevents UI blocking
- Standard React Native async pattern
- Allows concurrent processing
- Better user experience

**Consequences:**
- Slightly more complex API (async/await required)
- Must manage promise lifecycle
- Better app responsiveness

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-11-20_
_For: Anna_
