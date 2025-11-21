# loqa-audio-dsp - Epic Breakdown

**Author:** Anna
**Date:** 2025-11-20
**Project Type:** Developer Tool (SDK/Library)
**Project Complexity:** Low
**Target Scale:** MVP v0.1.0

---

## Overview

This document provides the complete epic and story breakdown for loqa-audio-dsp, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This document includes technical implementation details from the Architecture document. UX Design workflow can be run later if UI-specific components are needed.

### Epic Overview

This project is broken down into **5 epics** that deliver incremental value:

1. **Epic 1: Foundation & Project Setup** - Establish Expo module infrastructure and build system
2. **Epic 2: FFT Analysis Capability** - Deliver working FFT function (first usable DSP capability)
3. **Epic 3: Pitch & Formant Analysis** - Add YIN pitch detection and LPC formant extraction
4. **Epic 4: Spectral Analysis & API Completion** - Complete all four DSP functions with full TypeScript API
5. **Epic 5: Distribution & Developer Experience** - Package for npm, create example app, complete documentation

**Sequencing Rationale:**
- Epic 1 creates the foundation that all subsequent work depends on
- Epics 2-4 deliver DSP capabilities incrementally (FFT → Pitch/Formants → Spectrum)
- Epic 5 makes the package ready for distribution and developer adoption

Each epic delivers something developers can use and test, enabling incremental validation of the architecture.

---

## Functional Requirements Inventory

**Core DSP Analysis Capabilities:**
- FR1: System can compute FFT on audio buffer input and return frequency spectrum data
- FR2: Users can specify FFT size (default: match buffer size, power-of-2 required)
- FR3: System returns magnitude spectrum and optionally phase information
- FR4: System supports windowing functions (Hanning, Hamming, Blackman)
- FR5: System can detect fundamental frequency (F0) using YIN algorithm
- FR6: Users can analyze audio buffers at specified sample rates (8kHz - 48kHz)
- FR7: System returns pitch in Hz with confidence score
- FR8: System handles both voiced and unvoiced audio segments appropriately
- FR9: System can extract formant frequencies (F1, F2, F3) using LPC analysis
- FR10: Users can specify LPC order (default: appropriate for sample rate)
- FR11: System returns formant frequencies in Hz with bandwidth information
- FR12: System validates input is appropriate for formant analysis
- FR13: System can compute spectral centroid (brightness measure)
- FR14: System can compute spectral rolloff (frequency below which X% energy concentrated)
- FR15: System can compute spectral tilt (slope of spectrum)
- FR16: System returns all spectral features in single analysis call

**Native Platform Integration:**
- FR17: All four DSP functions work on iOS 15.1+ devices
- FR18: Swift FFI bindings correctly marshal data to/from Rust loqa-voice-dsp crate
- FR19: Memory management prevents leaks in FFI boundary
- FR20: iOS native module integrates with Expo Modules API
- FR21: All four DSP functions work on Android API 24+ devices
- FR22: Kotlin JNI bindings correctly marshal data to/from Rust loqa-voice-dsp crate
- FR23: Memory management prevents leaks in JNI boundary
- FR24: Android native module integrates with Expo Modules API
- FR25: Identical API signatures on iOS and Android
- FR26: Identical numerical results (within floating-point tolerance) on both platforms
- FR27: Identical error handling and validation on both platforms

**TypeScript API Layer:**
- FR28: Package exports four primary functions: computeFFT, detectPitch, extractFormants, analyzeSpectrum
- FR29: All functions accept audio data as Float32Array or number[]
- FR30: All functions return Promise-based results
- FR31: All functions have full TypeScript type definitions
- FR32: System validates audio buffer is not empty
- FR33: System validates sample rate is within supported range (8000-48000 Hz)
- FR34: System validates FFT size is power of 2
- FR35: System provides clear error messages for invalid inputs
- FR36: System throws typed errors for invalid inputs
- FR37: System handles native module initialization failures gracefully
- FR38: System provides actionable error messages with suggested fixes
- FR39: System logs warnings for sub-optimal configurations
- FR40: Users can optionally configure FFT window type
- FR41: Users can optionally configure LPC order for formant extraction
- FR42: Users can optionally configure pitch detection parameters (min/max frequency)
- FR43: System provides sensible defaults for all optional parameters

**Package Distribution:**
- FR44: Package is published to npm registry as @loqalabs/loqa-audio-dsp
- FR45: Package includes TypeScript type definitions (.d.ts files)
- FR46: Package includes source maps for debugging
- FR47: Package metadata includes correct peer dependencies
- FR48: Package installs via `npx expo install @loqalabs/loqa-audio-dsp`
- FR49: Package works with Expo managed workflow without ejecting
- FR50: Package works with bare React Native after prebuild
- FR51: Native dependencies are automatically configured for Expo users

**Versioning:**
- FR52: Package follows semantic versioning (semver)
- FR53: CHANGELOG.md documents all changes between versions
- FR54: Breaking changes are clearly marked and documented

**Example Application:**
- FR55: Example app demonstrates all four DSP functions working
- FR56: Example app includes real-time audio visualization
- FR57: Example app shows integration with @loqalabs/loqa-audio-bridge
- FR58: Example app runs successfully on both iOS and Android
- FR59: Example app includes performance benchmarking tools
- FR60: Benchmarks measure processing latency for each DSP function
- FR61: Benchmarks test with various buffer sizes (512, 1024, 2048, 4096 samples)
- FR62: Benchmark results are displayed in the app UI

**Documentation:**
- FR63: README.md includes quick start guide with installation instructions
- FR64: API.md documents all functions, parameters, and return types
- FR65: INTEGRATION_GUIDE.md provides common integration patterns
- FR66: Code examples demonstrate typical use cases
- FR67: All exported functions have JSDoc comments
- FR68: All TypeScript types have descriptive comments
- FR69: Complex algorithms have explanatory comments
- FR70: Error messages reference documentation when applicable

**Build & CI/CD:**
- FR71: Package builds successfully for iOS and Android
- FR72: TypeScript compiles without errors with strict mode enabled
- FR73: Native modules compile without warnings
- FR74: Build process is automated via package.json scripts
- FR75: GitHub Actions workflow runs on all pull requests
- FR76: CI runs TypeScript type checking
- FR77: CI runs unit tests for TypeScript and native code
- FR78: CI verifies package can be built and published
- FR79: Automated publishing workflow publishes to npm on version tag
- FR80: Publishing includes version bumping and changelog generation
- FR81: Publishing validates all tests pass before release
- FR82: RELEASING.md documents the release process

---

## FR Coverage Map

### Epic 1: Foundation & Project Setup
**FRs Covered:** FR71-FR82 (Build & CI/CD), FR44-FR47 (Package structure)

**Purpose:** Creates the infrastructure that enables all subsequent development

### Epic 2: FFT Analysis Capability
**FRs Covered:** FR1-FR4 (FFT), FR17-FR27 (Native platform integration), FR28-FR31 (Basic TypeScript API), FR32-FR39 (Validation & error handling)

**Purpose:** Delivers first working DSP function with complete native bindings

### Epic 3: Pitch & Formant Analysis
**FRs Covered:** FR5-FR12 (Pitch detection & formant extraction), FR40-FR43 (Configuration options)

**Purpose:** Adds voice analysis capabilities building on Epic 2 infrastructure

### Epic 4: Spectral Analysis & API Completion
**FRs Covered:** FR13-FR16 (Spectral analysis)

**Purpose:** Completes all four core DSP functions

### Epic 5: Distribution & Developer Experience
**FRs Covered:** FR48-FR54 (Installation & versioning), FR55-FR62 (Example app), FR63-FR70 (Documentation)

**Purpose:** Makes package ready for developer adoption and distribution

---

## Epic 1: Foundation & Project Setup

**Goal:** Establish the Expo native module infrastructure, Rust build system, and CI/CD pipeline that enables all subsequent DSP development.

**Value Delivered:** A buildable, testable Expo module with complete native platform support and automated quality checks.

**FRs Covered:** FR71-FR82 (Build & CI/CD), FR44-FR47 (Package structure)

---

### Story 1.1: Initialize Expo Module Project Structure

As a developer,
I want a standard Expo module project structure,
So that I can develop native iOS and Android bindings following Expo best practices.

**Acceptance Criteria:**

**Given** I am starting a new Expo native module project
**When** I run `npx create-expo-module@latest loqa-audio-dsp`
**Then** the following structure is created:
- Root package.json with Expo module metadata
- src/ directory for TypeScript source
- ios/ directory with LoqaAudioDsp.podspec and LoqaAudioDspModule.swift
- android/ directory with build.gradle and LoqaAudioDspModule.kt
- example/ directory with demo Expo app
- expo-module.config.json with module configuration

**And** TypeScript is configured with strict mode enabled (tsconfig.json)

**And** ESLint and Prettier are configured for code quality

**And** Initial README.md is created with project description

**Prerequisites:** None (first story)

**Technical Notes:**
- Use create-expo-module CLI as specified in Architecture document
- Configure for both iOS 15.1+ and Android API 24+
- Set package name as @loqalabs/loqa-audio-dsp
- Include .gitignore for node_modules, build artifacts, and IDE files
- Architecture reference: [architecture.md](./architecture.md) - "Project Initialization" section

---

### Story 1.2: Set Up Rust Build Infrastructure

As a developer,
I want Rust compilation integrated into the native build process,
So that the loqa-voice-dsp crate is automatically built for iOS and Android.

**Acceptance Criteria:**

**Given** the Expo module structure exists
**When** I add Rust build configuration
**Then** a rust/ directory is created with:
- Cargo.toml declaring loqa-voice-dsp dependency
- build-ios.sh script that compiles for iOS architectures (arm64, x86_64 simulator)
- build-android.sh script that compiles for Android architectures (arm64-v8a, armeabi-v7a, x86_64)

**And** iOS Podspec is configured to include compiled libloqua_voice_dsp.a

**And** Android build.gradle is configured to include compiled libloqua_voice_dsp.so

**And** Build scripts compile Rust in release mode with optimizations enabled

**And** Compiled libraries are placed in correct platform-specific directories:
- iOS: ios/RustFFI/libloqua_voice_dsp.a
- Android: android/src/main/jniLibs/{arch}/libloqua_voice_dsp.so

**Prerequisites:** Story 1.1

**Technical Notes:**
- Reference VoicelineDSP v0.2.0 for Rust build patterns
- Use cargo with --release flag for optimizations
- Enable LTO (Link-Time Optimization) for performance
- iOS requires universal binary for device + simulator
- Android requires separate .so for each architecture
- Architecture reference: "Rust FFI/JNI Integration" section

---

### Story 1.3: Implement iOS Swift FFI Bindings Scaffold

As a developer,
I want Swift FFI bindings to Rust DSP functions,
So that iOS can call Rust loqa-voice-dsp functions safely.

**Acceptance Criteria:**

**Given** Rust libraries are compiled for iOS
**When** I create Swift FFI bridge code
**Then** ios/RustFFI/RustBridge.swift is created with:
- FFI function declarations using @_silgen_name for Rust functions
- Swift wrapper functions that handle memory marshalling
- Proper use of UnsafePointer for array passing
- defer blocks to guarantee Rust memory deallocation
- Error handling for FFI failures

**And** LoqaAudioDspModule.swift implements Expo Module Definition protocol

**And** Module exposes placeholder async functions for future DSP operations

**And** Memory safety patterns prevent leaks at FFI boundary (as per Architecture)

**Prerequisites:** Story 1.2

**Technical Notes:**
- Follow memory management patterns from Architecture document
- Use UnsafeBufferPointer for zero-copy where possible
- All FFI calls must have corresponding free functions
- Architecture reference: "Memory Management at FFI/JNI Boundary" section
- Pattern: Copy data from Rust → Swift, then immediately free Rust memory

---

### Story 1.4: Implement Android Kotlin JNI Bindings Scaffold

As a developer,
I want Kotlin JNI bindings to Rust DSP functions,
So that Android can call Rust loqa-voice-dsp functions safely.

**Acceptance Criteria:**

**Given** Rust libraries are compiled for Android
**When** I create Kotlin JNI bridge code
**Then** android/src/main/java/com/loqalabs/loquaaudiodsp/RustJNI/RustBridge.kt is created with:
- JNI external function declarations for Rust functions
- System.loadLibrary("loqua_voice_dsp") initialization
- Kotlin wrapper functions that handle array marshalling
- Error handling for JNI failures

**And** LoqaAudioDspModule.kt implements Expo Module Definition protocol

**And** Module exposes placeholder async functions for future DSP operations

**And** JNI handles primitive array marshalling automatically (FloatArray)

**Prerequisites:** Story 1.2

**Technical Notes:**
- JNI automatically manages primitive arrays - simpler than iOS FFI
- Use GlobalScope.launch(Dispatchers.Default) for async processing
- All native calls wrapped in try-catch with Promise rejection
- Architecture reference: "Android (Kotlin JNI)" integration pattern section

---

### Story 1.5: Create TypeScript API Scaffold with Types

As a developer,
I want a complete TypeScript API structure,
So that I can implement DSP functions with full type safety.

**Acceptance Criteria:**

**Given** native modules are scaffolded
**When** I create TypeScript source files
**Then** the following files exist in src/:
- index.ts (main exports - currently empty placeholder exports)
- LoqaAudioDspModule.ts (native module imports using requireNativeModule)
- types.ts with complete type definitions for all DSP functions:
  - FFTOptions, FFTResult
  - PitchDetectionOptions, PitchResult
  - FormantExtractionOptions, FormantsResult
  - SpectrumAnalysisOptions, SpectrumResult
- errors.ts with custom error classes:
  - LoqaAudioDspError (base class)
  - ValidationError
  - NativeModuleError
- validation.ts with validation function signatures (to be implemented)
- utils.ts with logging utilities (logDebug, logWarning)

**And** All types have JSDoc comments describing their purpose

**And** TypeScript compiles without errors in strict mode

**Prerequisites:** Story 1.4

**Technical Notes:**
- Follow type definitions exactly as specified in Architecture document
- Use Float32Array for audio buffers (Web Audio API standard)
- All functions return Promise<Result> for async operations
- Architecture reference: "TypeScript Type Definitions" section

---

### Story 1.6: Set Up Jest Testing Infrastructure

As a developer,
I want a complete testing infrastructure,
So that I can write unit tests for TypeScript, iOS, and Android code.

**Acceptance Criteria:**

**Given** the module structure is complete
**When** I configure testing frameworks
**Then** Jest is configured for TypeScript tests:
- __tests__/ directory created
- jest.config.js with ts-jest preset
- Package.json includes test scripts: "test", "test:watch"

**And** iOS XCTest infrastructure is configured:
- ios/Tests/ directory created
- Xcode test target configured
- Placeholder test files for each DSP function

**And** Android JUnit infrastructure is configured:
- android/src/test/ directory created
- build.gradle includes JUnit 4.13+ dependency
- Placeholder test files for each DSP function

**And** npm test runs TypeScript tests successfully (even if placeholder)

**Prerequisites:** Story 1.5

**Technical Notes:**
- Use ts-jest for TypeScript test preprocessing
- Configure Jest to ignore native code
- Native tests run via Xcode (iOS) and Gradle (Android) separately
- Architecture reference: "Testing & Validation" section

---

### Story 1.7: Configure GitHub Actions CI/CD Pipeline

As a developer,
I want automated CI/CD with GitHub Actions,
So that every commit is validated and releases are automatically published.

**Acceptance Criteria:**

**Given** the codebase is ready for CI
**When** I create GitHub Actions workflows
**Then** .github/workflows/ci.yml is created that:
- Runs on push and pull_request events
- Executes lint (ESLint)
- Executes typecheck (TypeScript)
- Executes npm test (Jest unit tests)
- Executes npm audit (security check, fail on high severity)
- Runs on ubuntu-latest with Node.js 18

**And** .github/workflows/publish.yml is created that:
- Triggers on version tags (v*)
- Runs full test suite
- Publishes to npm registry with public access
- Uses NPM_TOKEN secret for authentication

**And** Both workflows use actions/checkout@v4 and actions/setup-node@v4

**And** CI passes on current codebase (even with placeholder implementations)

**Prerequisites:** Story 1.6

**Technical Notes:**
- Follow CI/CD patterns from Architecture document
- iOS/Android build tests can be added in later epics
- For now, focus on TypeScript validation
- Architecture reference: "CI/CD Pipeline" section
- npm publish requires NPM_TOKEN GitHub secret (set in repo settings)

---

### Story 1.8: Create Package Configuration for npm

As a developer,
I want proper npm package configuration,
So that the module can be published and installed correctly.

**Acceptance Criteria:**

**Given** the module is buildable
**When** I configure package.json for distribution
**Then** package.json includes:
- name: "@loqalabs/loqa-audio-dsp"
- version: "0.1.0"
- description: "Production-grade audio DSP analysis for React Native/Expo"
- main: "lib/index.js"
- types: "lib/index.d.ts"
- files: ["lib", "ios", "android", "README.md", "API.md", "LICENSE"]
- peerDependencies: expo ^54.0.0, react, react-native
- Proper keywords for npm discoverability
- Repository, bugs, homepage URLs

**And** Build script compiles TypeScript to lib/ directory

**And** Package includes source maps for debugging

**And** CHANGELOG.md is created with initial entry for v0.1.0

**And** RELEASING.md documents the release process

**Prerequisites:** Story 1.7

**Technical Notes:**
- Follow package structure from Architecture document
- Use expo-module-scripts for building
- Include MIT LICENSE file
- Architecture reference: "npm Package Structure" section

---

**Epic 1 Complete:** Foundation is established - buildable Expo module with Rust integration, native scaffolding, TypeScript types, testing infrastructure, and CI/CD pipeline.

## Epic 2: FFT Analysis Capability

**Goal:** Deliver the first working DSP function (computeFFT) with complete native bindings, TypeScript API, validation, and error handling across iOS and Android.

**Value Delivered:** Developers can compute FFT on audio buffers - the foundational DSP capability that enables frequency analysis.

**FRs Covered:** FR1-FR4 (FFT), FR17-FR27 (Native platform integration), FR28-FR31 (Basic TypeScript API), FR32-FR39 (Validation & error handling)

---

### Story 2.1: Implement FFT Rust Function Bindings

As a developer,
I want the loqa-voice-dsp FFT function exposed via FFI/JNI,
So that iOS and Android can call Rust FFT computation.

**Acceptance Criteria:**

**Given** the Rust loqa-voice-dsp crate is compiled
**When** I expose FFT functions for FFI/JNI
**Then** Rust exports the following C-compatible functions:
- `compute_fft_rust(buffer: *const f32, length: i32, fft_size: i32, window_type: i32) -> *mut f32`
- `free_fft_result_rust(ptr: *mut f32)`
- Functions use #[no_mangle] and extern "C" for C ABI compatibility

**And** FFT function accepts window type parameter (0=none, 1=hanning, 2=hamming, 3=blackman)

**And** FFT result is heap-allocated Rust Vec converted to raw pointer for FFI

**And** Calling code must call free function to prevent memory leaks

**And** FFT size is validated to be power of 2 in Rust code

**Prerequisites:** Story 1.4 (Android bindings scaffold)

**Technical Notes:**
- Use loqa-voice-dsp crate's existing FFT implementation
- Return magnitude spectrum (length = fft_size / 2)
- Follow memory safety patterns: caller receives pointer, must free it
- Architecture reference: FFI/JNI integration patterns

---

### Story 2.2: Implement iOS computeFFT Native Function

As a developer,
I want computeFFT working on iOS,
So that iOS apps can perform frequency analysis.

**Acceptance Criteria:**

**Given** Rust FFT bindings exist
**When** I implement Swift computeFFT
**Then** LoqaAudioDspModule.swift exposes async function:
```swift
AsyncFunction("computeFFT") { (buffer: [Float], options: [String: Any]) -> [String: Any]
```

**And** Function validates inputs before calling Rust:
- Buffer is not empty
- FFT size (from options or buffer.length) is power of 2
- FFT size is between 256 and 8192

**And** Function marshals Swift Float array to UnsafePointer for Rust

**And** Function calls compute_fft_rust with appropriate window type

**And** Function copies Rust result to Swift array before freeing Rust memory (using defer)

**And** Function returns dictionary with:
- "magnitude": Float array (length = fftSize / 2)
- "frequencies": Float array of frequency bin centers

**And** Function handles errors by throwing descriptive NSError

**Prerequisites:** Story 2.1

**Technical Notes:**
- Calculate frequencies: `freq[i] = (sampleRate / fftSize) * i`
- Assume default sample rate 44100 Hz for frequency calculation
- Memory safety: ALWAYS use defer to free Rust memory
- Architecture reference: "iOS (Swift FFI)" section

---

### Story 2.3: Implement Android computeFFT Native Function

As a developer,
I want computeFFT working on Android,
So that Android apps can perform frequency analysis.

**Acceptance Criteria:**

**Given** Rust FFT bindings exist
**When** I implement Kotlin computeFFT
**Then** LoqaAudioDspModule.kt exposes async function:
```kotlin
AsyncFunction("computeFFT") { buffer: FloatArray, options: Map<String, Any> -> Map<String, Any>
```

**And** Function validates inputs before calling Rust:
- Buffer is not empty
- FFT size (from options or buffer.size) is power of 2
- FFT size is between 256 and 8192

**And** Function calls RustBridge.computeFFT(buffer, fftSize, windowType)

**And** JNI handles FloatArray marshalling automatically

**And** Function returns map with:
- "magnitude": FloatArray (length = fftSize / 2)
- "frequencies": FloatArray of frequency bin centers

**And** Function catches exceptions and rejects Promise with error code and message

**Prerequisites:** Story 2.1

**Technical Notes:**
- Use Dispatchers.Default for async processing
- JNI simplifies memory management vs iOS
- Architecture reference: "Android (Kotlin JNI)" section

---

### Story 2.4: Implement TypeScript Input Validation

As a developer,
I want comprehensive input validation,
So that invalid inputs are caught early with clear error messages.

**Acceptance Criteria:**

**Given** the validation.ts file exists
**When** I implement validation functions
**Then** the following functions are created:

`validateAudioBuffer(buffer)`:
- Throws ValidationError if buffer is null/undefined
- Throws ValidationError if buffer.length === 0
- Throws ValidationError if buffer.length > 16384 (max buffer size)
- Throws ValidationError if buffer contains NaN or Infinity values

`validateSampleRate(sampleRate)`:
- Throws ValidationError if not an integer
- Throws ValidationError if < 8000 or > 48000 Hz

`validateFFTSize(fftSize)`:
- Throws ValidationError if not an integer
- Throws ValidationError if not power of 2
- Throws ValidationError if < 256 or > 8192

**And** All error messages include the invalid value and expected range

**And** ValidationError extends LoqaAudioDspError with code "VALIDATION_ERROR"

**Prerequisites:** Story 1.5 (TypeScript scaffold)

**Technical Notes:**
- Power of 2 check: `(n & (n-1)) === 0 && n > 0`
- Use isFinite() to check for NaN/Infinity
- Architecture reference: "Input Validation" section

---

### Story 2.5: Implement TypeScript computeFFT API Function

As a developer,
I want a clean TypeScript computeFFT API,
So that users have a typed, validated interface to FFT analysis.

**Acceptance Criteria:**

**Given** native computeFFT functions work and validation exists
**When** I implement src/computeFFT.ts
**Then** the function signature is:
```typescript
export async function computeFFT(
  audioBuffer: Float32Array | number[],
  options?: FFTOptions
): Promise<FFTResult>
```

**And** Function validates audioBuffer using validateAudioBuffer()

**And** Function extracts and validates fftSize from options (default: audioBuffer.length)

**And** Function extracts windowType from options (default: 'hanning')

**And** Function converts Float32Array to number[] for native bridge

**And** Function calls LoqaAudioDspModule.computeFFT(buffer, options)

**And** Function converts result to FFTResult with Float32Array types

**And** Function wraps native errors in NativeModuleError with context

**And** Function logs debug info if DEBUG flag enabled

**Prerequisites:** Story 2.4

**Technical Notes:**
- Default fftSize to next power of 2 >= buffer.length if not specified
- Map windowType string to integer for native: none=0, hanning=1, hamming=2, blackman=3
- Architecture reference: "TypeScript to Native Bridge" section

---

### Story 2.6: Write Unit Tests for computeFFT

As a developer,
I want comprehensive tests for computeFFT,
So that the function is reliable across platforms.

**Acceptance Criteria:**

**Given** computeFFT is implemented
**When** I write tests in __tests__/computeFFT.test.ts
**Then** the following test cases exist:

**Valid Input Tests:**
- Computes FFT for buffer of size 1024 successfully
- Returns magnitude array of correct length (fftSize / 2)
- Returns frequencies array with correct values
- Accepts Float32Array input
- Accepts number[] input
- Respects custom fftSize option
- Respects windowType option (hanning, hamming, blackman, none)

**Validation Tests:**
- Throws ValidationError for empty buffer
- Throws ValidationError for buffer > 16384 samples
- Throws ValidationError for buffer with NaN values
- Throws ValidationError for buffer with Infinity values
- Throws ValidationError for non-power-of-2 fftSize
- Throws ValidationError for fftSize < 256 or > 8192

**Cross-Platform Tests:**
- iOS XCTest: FFTTests.swift with native FFT validation
- Android JUnit: FFTTests.kt with native FFT validation

**And** All tests pass on TypeScript, iOS, and Android

**Prerequisites:** Story 2.5

**Technical Notes:**
- Use mock audio data (sine wave) for predictable FFT results
- Validate FFT output has expected peak at known frequency
- Native tests ensure FFI/JNI bindings work correctly

---

### Story 2.7: Add computeFFT to Public API and Documentation

As a developer,
I want computeFFT exported and documented,
So that users can discover and use the function.

**Acceptance Criteria:**

**Given** computeFFT is fully implemented and tested
**When** I update public API
**Then** src/index.ts exports:
- `computeFFT` function
- `FFTOptions` type
- `FFTResult` type

**And** All exports have JSDoc comments with:
- Function description
- Parameter descriptions with types
- Return type description
- Usage example
- @throws tags for error types

**And** TypeScript compilation produces correct .d.ts type definitions

**And** README.md includes basic computeFFT usage example

**Prerequisites:** Story 2.6

**Technical Notes:**
- JSDoc example should show common use case (analyzing audio buffer)
- Include note about sampleRate needed for frequency array accuracy
- Mention performance target (<5ms for 2048 samples)

---

**Epic 2 Complete:** Developers can now use computeFFT() to perform frequency analysis on audio buffers with full TypeScript types, validation, and cross-platform support.

## Epic 3: Pitch & Formant Analysis

**Goal:** Add YIN pitch detection and LPC formant extraction capabilities, enabling voice analysis use cases.

**Value Delivered:** Developers can detect pitch and extract formants from audio - essential for voice training, music tuners, and speech analysis applications.

**FRs Covered:** FR5-FR12 (Pitch detection & formant extraction), FR40-FR43 (Configuration options)

---

### Story 3.1: Implement Pitch Detection Rust Function Bindings

As a developer,
I want the loqa-voice-dsp YIN pitch detection exposed via FFI/JNI,
So that iOS and Android can detect pitch from audio buffers.

**Acceptance Criteria:**

**Given** the Rust loqa-voice-dsp crate is compiled
**When** I expose YIN pitch detection functions for FFI/JNI
**Then** Rust exports C-compatible functions:
- `detect_pitch_rust(buffer: *const f32, length: i32, sample_rate: i32, min_freq: f32, max_freq: f32) -> PitchResult`
- PitchResult struct with: frequency (f32), confidence (f32), is_voiced (bool)

**And** Function uses YIN algorithm from loqa-voice-dsp crate

**And** Function validates sample rate is between 8000 and 48000 Hz

**And** Function returns null frequency (0.0) if no pitch detected

**And** Confidence score is between 0.0 and 1.0

**Prerequisites:** Story 2.7 (computeFFT complete)

**Technical Notes:**
- YIN algorithm is optimized for voice/monophonic instruments
- Default min_freq: 80 Hz, max_freq: 400 Hz (human voice range)
- Architecture reference: Rust DSP core integration

---

### Story 3.2: Implement Formant Extraction Rust Function Bindings

As a developer,
I want the loqa-voice-dsp LPC formant extraction exposed via FFI/JNI,
So that iOS and Android can extract formants from audio buffers.

**Acceptance Criteria:**

**Given** the Rust loqa-voice-dsp crate is compiled
**When** I expose LPC formant extraction functions for FFI/JNI
**Then** Rust exports C-compatible functions:
- `extract_formants_rust(buffer: *const f32, length: i32, sample_rate: i32, lpc_order: i32) -> FormantsResult`
- FormantsResult struct with: f1, f2, f3 (Hz), bandwidths (f1_bw, f2_bw, f3_bw)

**And** Function uses LPC analysis from loqa-voice-dsp crate

**And** Function validates audio is appropriate for formant analysis (sufficient length, voiced)

**And** Default LPC order is (sample_rate / 1000) + 2

**And** Function returns formant frequencies in Hz

**Prerequisites:** Story 3.1

**Technical Notes:**
- LPC (Linear Predictive Coding) finds resonant frequencies of vocal tract
- Requires voiced audio for accurate results
- F1, F2, F3 are first three formants (most important for vowel identification)

---

### Story 3.3: Implement iOS and Android Native Functions for Pitch and Formants

As a developer,
I want detectPitch and extractFormants working on both platforms,
So that voice analysis capabilities work cross-platform.

**Acceptance Criteria:**

**Given** Rust pitch and formant bindings exist
**When** I implement native functions
**Then** iOS LoqaAudioDspModule.swift exposes:
- `AsyncFunction("detectPitch")` that calls Rust, returns PitchResult dictionary
- `AsyncFunction("extractFormants")` that calls Rust, returns FormantsResult dictionary

**And** Android LoqaAudioDspModule.kt exposes:
- `AsyncFunction("detectPitch")` that calls Rust via JNI, returns PitchResult map
- `AsyncFunction("extractFormants")` that calls Rust via JNI, returns FormantsResult map

**And** Both platforms validate inputs (buffer, sample rate, optional params)

**And** Both platforms handle errors consistently with descriptive messages

**And** Memory management follows established patterns (defer on iOS, automatic on Android)

**Prerequisites:** Story 3.2

**Technical Notes:**
- Reuse validation and error handling patterns from Epic 2
- Follow memory safety patterns established in Story 1.3 and 1.4

---

### Story 3.4: Implement TypeScript detectPitch and extractFormants APIs

As a developer,
I want clean TypeScript APIs for pitch detection and formant extraction,
So that users have typed, validated interfaces to voice analysis.

**Acceptance Criteria:**

**Given** native functions work
**When** I implement TypeScript APIs
**Then** src/detectPitch.ts exports:

```typescript
export async function detectPitch(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<PitchDetectionOptions>
): Promise<PitchResult>
```

**And** src/extractFormants.ts exports:

```typescript
export async function extractFormants(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<FormantExtractionOptions>
): Promise<FormantsResult>
```

**And** Both functions validate inputs using validation.ts functions

**And** Both functions provide sensible defaults for optional parameters

**And** Both functions convert results to proper TypeScript types

**And** Both functions wrap native errors in NativeModuleError

**Prerequisites:** Story 3.3

**Technical Notes:**
- detectPitch defaults: minFrequency=80Hz, maxFrequency=400Hz
- extractFormants defaults: lpcOrder = (sampleRate / 1000) + 2
- validateSampleRate already exists from Epic 2

---

### Story 3.5: Write Unit Tests for Pitch and Formant Functions

As a developer,
I want comprehensive tests for voice analysis functions,
So that detectPitch and extractFormants are reliable.

**Acceptance Criteria:**

**Given** detectPitch and extractFormants are implemented
**When** I write tests
**Then** __tests__/detectPitch.test.ts includes:
- Detects pitch from sine wave at known frequency
- Returns correct confidence score for clean audio
- Identifies unvoiced segments correctly
- Validates sample rate range
- Respects min/max frequency options

**And** __tests__/extractFormants.test.ts includes:
- Extracts formants from synthetic vowel audio
- Returns F1, F2, F3 in expected ranges
- Validates input is appropriate for formant analysis
- Respects custom LPC order option

**And** Native tests (iOS XCTest, Android JUnit) validate FFI/JNI bindings

**And** All tests pass on TypeScript, iOS, and Android

**Prerequisites:** Story 3.4

**Technical Notes:**
- Use synthetic audio with known pitch for predictable test results
- Validate formant values are in typical human voice ranges (F1: 200-1000Hz, F2: 800-2500Hz, F3: 2000-4000Hz)

---

### Story 3.6: Add Pitch and Formant Functions to Public API

As a developer,
I want detectPitch and extractFormants exported and documented,
So that users can discover and use voice analysis features.

**Acceptance Criteria:**

**Given** functions are fully implemented and tested
**When** I update public API
**Then** src/index.ts exports:
- `detectPitch` function
- `extractFormants` function
- `PitchDetectionOptions`, `PitchResult` types
- `FormantExtractionOptions`, `FormantsResult` types

**And** All exports have comprehensive JSDoc comments with usage examples

**And** README.md includes examples of voice analysis use cases

**Prerequisites:** Story 3.5

**Technical Notes:**
- Emphasize use cases: tuners, voice training, pronunciation analysis
- Note performance characteristics (<5ms target maintained)

---

**Epic 3 Complete:** Developers can now detect pitch and extract formants for voice analysis applications with full cross-platform support.

## Epic 4: Spectral Analysis & API Completion

**Goal:** Complete the fourth and final DSP function (analyzeSpectrum) to deliver all core MVP capabilities.

**Value Delivered:** Developers have complete DSP analysis toolkit - FFT, pitch, formants, and spectral features for comprehensive audio analysis.

**FRs Covered:** FR13-FR16 (Spectral analysis)

---

### Story 4.1: Implement Spectral Analysis Rust Function Bindings

As a developer,
I want loqa-voice-dsp spectral analysis exposed via FFI/JNI,
So that iOS and Android can compute spectral features.

**Acceptance Criteria:**

**Given** the Rust loqa-voice-dsp crate is compiled
**When** I expose spectral analysis functions for FFI/JNI
**Then** Rust exports C-compatible functions:
- `analyze_spectrum_rust(buffer: *const f32, length: i32, sample_rate: i32) -> SpectrumResult`
- SpectrumResult struct with: centroid (f32), rolloff (f32), tilt (f32)

**And** Function computes spectral centroid (brightness measure in Hz)

**And** Function computes spectral rolloff (95% energy threshold frequency)

**And** Function computes spectral tilt (slope of spectrum)

**And** All spectral features computed in single function call for efficiency

**Prerequisites:** Story 3.6

**Technical Notes:**
- Spectral centroid: weighted mean of frequencies (indicates brightness)
- Spectral rolloff: frequency below which 95% of energy is concentrated
- Spectral tilt: overall slope of spectrum (indicates timbre)
- These features are useful for audio classification and timbre analysis

---

### Story 4.2: Implement iOS and Android analyzeSpectrum Native Functions

As a developer,
I want analyzeSpectrum working on both platforms,
So that spectral analysis capabilities work cross-platform.

**Acceptance Criteria:**

**Given** Rust spectral analysis bindings exist
**When** I implement native functions
**Then** iOS LoqaAudioDspModule.swift exposes:
- `AsyncFunction("analyzeSpectrum")` that calls Rust, returns SpectrumResult dictionary

**And** Android LoqaAudioDspModule.kt exposes:
- `AsyncFunction("analyzeSpectrum")` that calls Rust via JNI, returns SpectrumResult map

**And** Both platforms validate inputs (buffer, sample rate)

**And** Both platforms handle errors consistently

**And** Memory management follows established patterns

**Prerequisites:** Story 4.1

**Technical Notes:**
- Reuse patterns from previous DSP function implementations
- Consistent API design with computeFFT, detectPitch, extractFormants

---

### Story 4.3: Implement TypeScript analyzeSpectrum API

As a developer,
I want a clean TypeScript API for spectral analysis,
So that users have a typed, validated interface to spectral features.

**Acceptance Criteria:**

**Given** native analyzeSpectrum functions work
**When** I implement TypeScript API
**Then** src/analyzeSpectrum.ts exports:

```typescript
export async function analyzeSpectrum(
  audioBuffer: Float32Array | number[],
  sampleRate: number,
  options?: Partial<SpectrumAnalysisOptions>
): Promise<SpectrumResult>
```

**And** Function validates audioBuffer and sampleRate

**And** Function calls LoqaAudioDspModule.analyzeSpectrum

**And** Function converts result to SpectrumResult type

**And** Function wraps native errors in NativeModuleError

**Prerequisites:** Story 4.2

**Technical Notes:**
- SpectrumAnalysisOptions currently minimal (just sampleRate required)
- Room for future expansion (custom rolloff percentage, etc.)

---

### Story 4.4: Write Unit Tests for analyzeSpectrum

As a developer,
I want comprehensive tests for spectral analysis,
So that analyzeSpectrum is reliable.

**Acceptance Criteria:**

**Given** analyzeSpectrum is implemented
**When** I write tests in **tests**/analyzeSpectrum.test.ts
**Then** test cases include:
- Computes spectral features for audio buffer successfully
- Returns centroid, rolloff, tilt values in expected ranges
- Validates sample rate
- Handles various buffer sizes

**And** Native tests (iOS XCTest, Android JUnit) validate bindings

**And** All tests pass on TypeScript, iOS, and Android

**Prerequisites:** Story 4.3

**Technical Notes:**
- Use synthetic audio with known spectral characteristics
- Validate results are physically reasonable (centroid < Nyquist frequency, etc.)

---

### Story 4.5: Add analyzeSpectrum to Public API and Complete Core DSP

As a developer,
I want all four DSP functions fully exported and documented,
So that the complete MVP DSP capability is available.

**Acceptance Criteria:**

**Given** analyzeSpectrum is fully implemented and tested
**When** I update public API
**Then** src/index.ts exports:
- `analyzeSpectrum` function
- `SpectrumAnalysisOptions`, `SpectrumResult` types

**And** README.md updated with analyzeSpectrum usage example

**And** All four DSP functions (computeFFT, detectPitch, extractFormants, analyzeSpectrum) are exported

**And** TypeScript compilation produces complete .d.ts definitions

**And** All JSDoc comments are comprehensive

**Prerequisites:** Story 4.4

**Technical Notes:**
- This completes the core DSP API (FR1-FR16 all covered)
- Package now provides complete audio analysis toolkit

---

**Epic 4 Complete:** All four core DSP functions are implemented - the package now provides complete audio analysis capabilities.

---

## Epic 5: Distribution & Developer Experience

**Goal:** Package the module for distribution, create comprehensive documentation, and build an example app that demonstrates all features.

**Value Delivered:** Developers can install, use, and learn from a production-ready npm package with excellent documentation and working examples.

**FRs Covered:** FR48-FR54 (Installation & versioning), FR55-FR62 (Example app), FR63-FR70 (Documentation)

---

### Story 5.1: Create Comprehensive README.md

As a developer,
I want a complete README with quick start guide,
So that new users can quickly understand and use the package.

**Acceptance Criteria:**

**Given** all four DSP functions are implemented
**When** I write README.md
**Then** it includes the following sections:

**1. Header & Badges:**
- Package name and description
- npm version badge
- License badge
- CI status badge

**2. Features:**
- List of four DSP functions with brief descriptions
- Performance characteristics (<5ms latency)
- Cross-platform support (iOS 15.1+, Android 7.0+)
- Battle-tested Rust DSP core

**3. Installation:**
```bash
npx expo install @loqalabs/loqa-audio-dsp
```

**4. Quick Start:**
- Code example showing basic computeFFT usage
- Code example showing integration with audio buffer

**5. Core DSP Functions:**
- Brief overview of each function (computeFFT, detectPitch, extractFormants, analyzeSpectrum)
- Link to API.md for detailed docs

**6. Performance:**
- Latency targets and benchmarks
- Memory usage characteristics

**7. Requirements:**
- Expo SDK 54+
- React Native 0.76+
- iOS 15.1+ / Android API 24+

**8. Links:**
- API Documentation (API.md)
- Integration Guide (INTEGRATION_GUIDE.md)
- Example App
- GitHub repository
- Issues/Bug reports

**Prerequisites:** Story 4.5

**Technical Notes:**
- Keep README focused on getting started quickly
- Link to detailed docs rather than including everything
- Include real code examples that work

---

### Story 5.2: Create API.md Reference Documentation

As a developer,
I want complete API reference documentation,
So that users can understand all functions, parameters, and types.

**Acceptance Criteria:**

**Given** all functions are implemented
**When** I write API.md
**Then** it documents for each function:
- Function signature with TypeScript types
- Description of what the function does
- All parameters with types and descriptions
- Return type with detailed field descriptions
- Error types that can be thrown
- Usage examples (basic and advanced)
- Performance notes

**And** Documents all exported types (FFTOptions, PitchResult, etc.)

**And** Documents error handling patterns

**And** Documents validation rules and ranges

**And** Includes code examples for each function

**Prerequisites:** Story 5.1

**Technical Notes:**
- Consider using TypeDoc to auto-generate from JSDoc comments
- Supplement with hand-written examples and explanations
- Architecture reference: "API Contracts" section

---

### Story 5.3: Create INTEGRATION_GUIDE.md with Common Patterns

As a developer,
I want practical integration guidance,
So that users can implement common use cases effectively.

**Acceptance Criteria:**

**Given** API documentation exists
**When** I write INTEGRATION_GUIDE.md
**Then** it includes these sections:

**1. Integration with @loqalabs/loqa-audio-bridge:**
- Complete example of real-time audio streaming + DSP analysis
- How to process audio buffers from streaming source

**2. Common Patterns:**
- Real-time pitch tracking (for tuner apps)
- Voice analysis workflow (pitch + formants)
- Audio visualization with FFT
- Batch processing of audio files

**3. Performance Optimization:**
- Buffer size recommendations
- Sample rate considerations
- Memory management tips
- Concurrent processing patterns

**4. Error Handling:**
- How to catch and handle ValidationError
- How to handle NativeModuleError
- Recovery strategies for common errors

**5. Platform-Specific Notes:**
- iOS-specific considerations
- Android-specific considerations
- Handling platform differences

**Prerequisites:** Story 5.2

**Technical Notes:**
- Include complete, working code examples
- Link to example app for full implementations
- Cover common pitfalls and solutions

---

### Story 5.4: Build Example App with All Four DSP Functions

As a developer,
I want a comprehensive example app,
So that users can see all features working and learn implementation patterns.

**Acceptance Criteria:**

**Given** the package is fully functional
**When** I build the example app in example/
**Then** it includes these screens:

**1. FFT Demo Screen:**
- Real-time FFT visualization
- Adjustable FFT size and window type
- Frequency spectrum display
- Performance metrics

**2. Pitch Detection Demo Screen:**
- Real-time pitch detection
- Visual pitch display (Hz and musical note)
- Confidence meter
- Tuner-style interface

**3. Formant Analysis Demo Screen:**
- Formant extraction from voice audio
- F1, F2, F3 display with bandwidths
- Vowel chart visualization
- Real-time or from recorded audio

**4. Spectral Analysis Demo Screen:**
- Spectral centroid, rolloff, tilt display
- Visual representation of spectral features
- Comparison across different audio types

**5. Benchmark Screen:**
- Performance benchmarking for each DSP function
- Tests with various buffer sizes (512, 1024, 2048, 4096)
- Min/Avg/Max/P95 latency metrics
- Results displayed in table format

**6. Integration Demo:**
- Shows integration with @loqalabs/loqa-audio-bridge
- Real-time audio input → DSP processing → visualization

**And** Example app runs successfully on both iOS and Android

**And** All four DSP functions work correctly in example app

**And** UI is clean and demonstrates capabilities clearly

**Prerequisites:** Story 5.3

**Technical Notes:**
- Use React Native components for visualizations
- Keep UI simple but functional
- Include comments explaining key integration points
- Architecture reference: "Example Application" section (FR55-FR62)

---

### Story 5.5: Add Performance Benchmarking to Example App

As a developer,
I want built-in performance benchmarking,
So that users can validate performance on their target devices.

**Acceptance Criteria:**

**Given** example app is built
**When** user navigates to Benchmark screen
**Then** benchmark tool:
- Tests each DSP function (computeFFT, detectPitch, extractFormants, analyzeSpectrum)
- Tests with buffer sizes: 512, 1024, 2048, 4096 samples
- Runs 100 iterations per configuration
- Computes min, max, average, p95 latency
- Displays results in readable table
- Shows device info (model, OS version)
- Allows export/sharing of benchmark results

**And** Benchmarks validate <5ms target for 2048-sample buffers on modern devices

**Prerequisites:** Story 5.4

**Technical Notes:**
- Use high-resolution timers (performance.now())
- Warm up before benchmarking (discard first few runs)
- Architecture reference: NFR1-NFR4 (performance requirements)

---

### Story 5.6: Finalize package.json and Publishing Configuration

As a developer,
I want proper npm package configuration,
So that the package can be published and installed correctly.

**Acceptance Criteria:**

**Given** all features are complete
**When** I finalize package.json
**Then** it includes:
- Accurate version (0.1.0 for MVP)
- Complete description
- Keywords for npm discoverability: audio, dsp, fft, pitch, formants, spectrum, react-native, expo
- Author: Loqa Labs
- License: MIT
- Repository URL: github.com/loqalabs/loqa-audio-dsp
- Homepage URL
- Bugs URL
- Correct peerDependencies
- Build scripts that work
- Publishing scripts

**And** .npmignore excludes development files (tests, example, .git, etc.)

**And** Package builds successfully with `npm run build`

**And** Built artifacts are in lib/ directory

**Prerequisites:** Story 5.5

**Technical Notes:**
- Follow package structure from Architecture document
- Validate with `npm pack` before publishing
- Architecture reference: "npm Package Structure" section

---

### Story 5.7: Create CHANGELOG.md and RELEASING.md

As a developer,
I want documented release process and version history,
So that users understand changes and maintainers can release consistently.

**Acceptance Criteria:**

**Given** the package is ready for release
**When** I create release documentation
**Then** CHANGELOG.md includes:
- v0.1.0 (MVP) entry with date
- Added: All four DSP functions
- Added: Cross-platform iOS/Android support
- Added: TypeScript types and validation
- Added: Example app with demos
- Added: Complete documentation

**And** RELEASING.md documents:
- Version bumping process (npm version)
- Pre-release checklist (tests pass, docs updated, CHANGELOG updated)
- Git tagging process
- npm publishing process (automatic via GitHub Actions)
- Post-release steps (GitHub release, announcement)

**And** Both files follow semantic versioning conventions

**Prerequisites:** Story 5.6

**Technical Notes:**
- Use Conventional Commits format for CHANGELOG
- Document both manual and automated release processes
- Architecture reference: FR52-FR54, FR79-FR82

---

### Story 5.8: Publish v0.1.0 to npm Registry

As a developer,
I want to publish the package to npm,
So that developers can install and use it.

**Acceptance Criteria:**

**Given** all implementation is complete and tested
**When** I publish the package
**Then**:
- All tests pass (TypeScript, iOS native, Android native)
- CI pipeline passes
- Package version is set to 0.1.0
- Git tag v0.1.0 is created
- CHANGELOG.md is updated
- Package is published to npm as @loqalabs/loqa-audio-dsp
- GitHub Actions publish workflow succeeds
- Package is installable via `npx expo install @loqalabs/loqa-audio-dsp`
- README renders correctly on npmjs.com

**And** GitHub release is created with:
- Release notes from CHANGELOG
- Link to documentation
- Installation instructions

**Prerequisites:** Story 5.7

**Technical Notes:**
- Use GitHub Actions automated publishing workflow
- Requires NPM_TOKEN secret configured in GitHub
- Test installation in clean Expo project before announcing
- Architecture reference: "Release Process" section

---

**Epic 5 Complete:** Package is published to npm with complete documentation, example app, and excellent developer experience. The loqa-audio-dsp v0.1.0 MVP is production-ready!

---

## FR Coverage Matrix

This matrix validates that EVERY functional requirement from the PRD is covered by at least one story in the epic breakdown.

### Core DSP Analysis Capabilities (FR1-FR16)

- **FR1:** FFT computation on audio buffer → **Epic 2, Story 2.1-2.7**
- **FR2:** Specify FFT size → **Epic 2, Story 2.5** (TypeScript API with options)
- **FR3:** Returns magnitude and phase → **Epic 2, Story 2.2, 2.3** (native functions)
- **FR4:** Windowing functions support → **Epic 2, Story 2.1, 2.5** (Rust + TS API)
- **FR5:** YIN pitch detection → **Epic 3, Story 3.1-3.6**
- **FR6:** Sample rate support 8kHz-48kHz → **Epic 3, Story 3.4** (validation)
- **FR7:** Returns pitch with confidence → **Epic 3, Story 3.1, 3.2** (Rust + native)
- **FR8:** Handles voiced/unvoiced audio → **Epic 3, Story 3.1** (YIN algorithm)
- **FR9:** LPC formant extraction → **Epic 3, Story 3.2-3.6**
- **FR10:** Specify LPC order → **Epic 3, Story 3.4** (TypeScript API options)
- **FR11:** Returns F1, F2, F3 with bandwidths → **Epic 3, Story 3.2, 3.3** (Rust + native)
- **FR12:** Validates formant analysis input → **Epic 3, Story 3.2** (Rust validation)
- **FR13:** Spectral centroid → **Epic 4, Story 4.1-4.5**
- **FR14:** Spectral rolloff → **Epic 4, Story 4.1-4.5**
- **FR15:** Spectral tilt → **Epic 4, Story 4.1-4.5**
- **FR16:** All spectral features in single call → **Epic 4, Story 4.1** (Rust implementation)

### Native Platform Integration (FR17-FR27)

- **FR17:** iOS 15.1+ support → **Epic 1, Story 1.1, 1.3; Epic 2, Story 2.2**
- **FR18:** Swift FFI bindings → **Epic 1, Story 1.3; Epic 2-4, all iOS stories**
- **FR19:** Memory leak prevention (FFI) → **Epic 1, Story 1.3** (defer blocks)
- **FR20:** Expo Modules API integration (iOS) → **Epic 1, Story 1.3**
- **FR21:** Android API 24+ support → **Epic 1, Story 1.1, 1.4; Epic 2, Story 2.3**
- **FR22:** Kotlin JNI bindings → **Epic 1, Story 1.4; Epic 2-4, all Android stories**
- **FR23:** Memory leak prevention (JNI) → **Epic 1, Story 1.4** (automatic JNI)
- **FR24:** Expo Modules API integration (Android) → **Epic 1, Story 1.4**
- **FR25:** Identical API signatures → **Epic 2-4, all native implementation stories**
- **FR26:** Identical numerical results → **Epic 2-4, cross-platform testing in .6 stories**
- **FR27:** Identical error handling → **Epic 2, Story 2.4** (validation); all native stories

### TypeScript API Layer (FR28-FR43)

- **FR28:** Four primary function exports → **Epic 2-4, Story X.5** (TS API for each)
- **FR29:** Accept Float32Array or number[] → **Epic 2, Story 2.5** (pattern for all)
- **FR30:** Promise-based results → **Epic 2-4, all TypeScript API stories**
- **FR31:** Full TypeScript type definitions → **Epic 1, Story 1.5**
- **FR32:** Validates buffer not empty → **Epic 2, Story 2.4** (validateAudioBuffer)
- **FR33:** Validates sample rate range → **Epic 2, Story 2.4** (validateSampleRate)
- **FR34:** Validates FFT size power of 2 → **Epic 2, Story 2.4** (validateFFTSize)
- **FR35:** Clear error messages → **Epic 2, Story 2.4** (ValidationError with details)
- **FR36:** Typed errors → **Epic 1, Story 1.5; Epic 2, Story 2.4** (error classes)
- **FR37:** Handles init failures → **Epic 2, Story 2.5** (NativeModuleError)
- **FR38:** Actionable error messages → **Epic 2, Story 2.4** (include ranges/values)
- **FR39:** Warnings for sub-optimal configs → **Epic 1, Story 1.5** (logWarning utility)
- **FR40:** Configure FFT window type → **Epic 2, Story 2.5** (FFTOptions)
- **FR41:** Configure LPC order → **Epic 3, Story 3.4** (FormantExtractionOptions)
- **FR42:** Configure pitch detection params → **Epic 3, Story 3.4** (PitchDetectionOptions)
- **FR43:** Sensible defaults → **Epic 2-4, all TypeScript API stories**

### Package Distribution (FR44-FR54)

- **FR44:** Published to npm → **Epic 5, Story 5.8**
- **FR45:** TypeScript .d.ts files → **Epic 1, Story 1.5, 1.8** (TypeScript compilation)
- **FR46:** Source maps → **Epic 1, Story 1.8** (package.json config)
- **FR47:** Correct peer dependencies → **Epic 1, Story 1.8; Epic 5, Story 5.6**
- **FR48:** Install via Expo CLI → **Epic 5, Story 5.6, 5.8** (validation)
- **FR49:** Expo managed workflow support → **Epic 1, Story 1.1** (create-expo-module)
- **FR50:** Bare React Native support → **Epic 1, Story 1.1** (Expo prebuild compatible)
- **FR51:** Auto-configured native deps → **Epic 1, Story 1.1** (Expo modules auto-linking)
- **FR52:** Semantic versioning → **Epic 5, Story 5.7** (RELEASING.md)
- **FR53:** CHANGELOG.md → **Epic 1, Story 1.8; Epic 5, Story 5.7**
- **FR54:** Breaking changes documented → **Epic 5, Story 5.7** (RELEASING.md process)

### Example Application (FR55-FR62)

- **FR55:** Demonstrates all four functions → **Epic 5, Story 5.4** (4 demo screens)
- **FR56:** Real-time visualization → **Epic 5, Story 5.4** (FFT, pitch displays)
- **FR57:** Integration with loqa-audio-bridge → **Epic 5, Story 5.4** (Integration Demo)
- **FR58:** Runs on iOS and Android → **Epic 5, Story 5.4** (testing requirement)
- **FR59:** Performance benchmarking tools → **Epic 5, Story 5.5** (Benchmark screen)
- **FR60:** Measures processing latency → **Epic 5, Story 5.5** (timing for each function)
- **FR61:** Tests various buffer sizes → **Epic 5, Story 5.5** (512-4096 samples)
- **FR62:** Display benchmark results → **Epic 5, Story 5.5** (UI table)

### Documentation (FR63-FR70)

- **FR63:** README with quick start → **Epic 5, Story 5.1**
- **FR64:** API.md reference → **Epic 5, Story 5.2**
- **FR65:** INTEGRATION_GUIDE.md → **Epic 5, Story 5.3**
- **FR66:** Code examples → **Epic 5, Story 5.1, 5.2, 5.3** (all docs)
- **FR67:** JSDoc comments on functions → **Epic 2-4, Story X.7** (public API updates)
- **FR68:** Type descriptions → **Epic 1, Story 1.5** (types.ts with JSDoc)
- **FR69:** Algorithm explanatory comments → **Epic 2-4, Rust and native implementations**
- **FR70:** Error messages reference docs → **Epic 2, Story 2.4** (validation error messages)

### Build & CI/CD (FR71-FR82)

- **FR71:** Builds for iOS and Android → **Epic 1, Story 1.2** (Rust build scripts)
- **FR72:** TypeScript strict mode compiles → **Epic 1, Story 1.1, 1.5**
- **FR73:** Native modules compile clean → **Epic 1, Story 1.3, 1.4**
- **FR74:** Automated build scripts → **Epic 1, Story 1.8** (package.json)
- **FR75:** GitHub Actions on PRs → **Epic 1, Story 1.7**
- **FR76:** CI runs type checking → **Epic 1, Story 1.7** (ci.yml)
- **FR77:** CI runs unit tests → **Epic 1, Story 1.6, 1.7** (Jest + native tests)
- **FR78:** CI verifies build/publish → **Epic 1, Story 1.7** (ci.yml)
- **FR79:** Auto-publish on tag → **Epic 1, Story 1.7** (publish.yml)
- **FR80:** Version bump and changelog → **Epic 5, Story 5.7** (RELEASING.md)
- **FR81:** Tests pass before release → **Epic 1, Story 1.7; Epic 5, Story 5.8**
- **FR82:** RELEASING.md → **Epic 5, Story 5.7**

### Coverage Validation: ✅ ALL 82 FRs COVERED

Every functional requirement from FR1 through FR82 is mapped to specific stories in the epic breakdown. No requirements are missing.

---

## Summary

**Epic Breakdown Complete for loqa-audio-dsp v0.1.0**

**5 Epics | 38 Stories | 82 FRs Covered**

**Epic Summary:**
1. **Epic 1 (8 stories):** Foundation & Project Setup - Expo module infrastructure, Rust integration, CI/CD
2. **Epic 2 (7 stories):** FFT Analysis Capability - First working DSP function with full platform support
3. **Epic 3 (6 stories):** Pitch & Formant Analysis - Voice analysis capabilities
4. **Epic 4 (5 stories):** Spectral Analysis & API Completion - Complete all four DSP functions
5. **Epic 5 (8 stories):** Distribution & Developer Experience - Documentation, example app, npm publishing

**Context Incorporated:**
- ✅ PRD requirements (all 82 FRs)
- ✅ Architecture technical decisions and patterns
- ✅ Product Brief vision and goals

**Ready for Phase 4 Implementation:**
- Each story is sized for single dev agent session
- Stories have detailed BDD acceptance criteria
- Technical notes reference Architecture document
- Stories are sequenced logically (no forward dependencies)
- All FRs validated as covered

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will be updated after UX Design and Architecture workflows to incorporate interaction details and technical decisions._
