# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.9] - 2025-11-23

### Fixed

- **Critical**: Fix Swift FFI declaration for `analyze_spectrum_rust` to match Rust implementation
  - Changed FFI declaration from pointer return (`UnsafePointer<Float>?`) to struct return (`SpectrumResult`)
  - Rust implementation returns `SpectrumResult` by value (like `PitchResult` and `FormantsResult`), not a heap-allocated pointer
  - Removed incorrect `free_spectrum_result_rust` FFI declaration (function doesn't exist in Rust)
  - Updated `analyzeSpectrumWrapper` to handle struct return (no memory management needed)
  - Swift FFI declarations were outdated placeholders that didn't match the actual Rust implementation
  - Fixes linker error: "Undefined symbol: _free_spectrum_result_rust"
  - All four DSP functions now work correctly with proper memory semantics

## [0.1.8] - 2025-11-23

### Fixed

- **Critical**: Fix XCFramework Info.plist to reference correct binary name
  - Updated Info.plist to reference `libloqa_voice_dsp.a` instead of `libloqa_voice_dsp_universal_sim.a`
  - v0.1.7 physically renamed the simulator binary but didn't update the Info.plist
  - This caused CocoaPods to fail with "contains static libraries with differing binary names"
  - Regression of v0.1.2 issue - XCFramework rebuild didn't update Info.plist
  - Updated build script to automatically update Info.plist after renaming binary
  - Fixes pod install error: "differing binary names: libloqa_voice_dsp and libloqa_voice_dsp_universal_sim"
  - Pod install now succeeds, iOS build can proceed

## [0.1.7] - 2025-11-23

### Fixed

- **Critical**: Rebuild Rust XCFramework with all FFI functions exported
  - Rebuilt iOS XCFramework to include all `*_rust` FFI function symbols
  - Previous XCFramework was missing `analyze_spectrum_rust`, `detect_pitch_rust`, and `extract_formants_rust` symbols
  - XCFramework was built from outdated Rust code before FFI functions were implemented
  - Now exports all required symbols: `compute_fft_rust`, `free_fft_result_rust`, `detect_pitch_rust`, `extract_formants_rust`, `analyze_spectrum_rust`
  - Fixes linker error: "Undefined symbols for architecture arm64: _analyze_spectrum_rust"
  - iOS build now links successfully

## [0.1.6] - 2025-11-23

### Fixed

- **Critical**: Fix promise.reject() API signature in all async functions
  - Removed third parameter from all `promise.reject()` calls
  - ExpoModulesCore's Promise.reject() only accepts 2 parameters (code, message)
  - Previous code was calling with 3 parameters: `promise.reject("CODE", "message", nil)`
  - Fixes Swift compilation error: "extra argument in call"
  - All 4 async functions updated: computeFFT, detectPitch, extractFormants, analyzeSpectrum
  - iOS build now completes successfully without compiler errors

## [0.1.5] - 2025-11-23

### Fixed

- **Critical**: Fix Swift compilation errors in ExpoModulesCore async functions and FFI declarations
  - Removed `DispatchQueue.global().async` wrappers from all 4 async functions (computeFFT, detectPitch, extractFormants, analyzeSpectrum)
  - ExpoModulesCore's `AsyncFunction` already handles background execution - manual dispatch queue was causing syntax errors
  - Added `_` parameter labels to all FFI function declarations (compute_fft_rust, detect_pitch_rust, extract_formants_rust, analyze_spectrum_rust)
  - C FFI functions should use unnamed parameters to avoid argument label requirements at call sites
  - Fixes Swift compilation errors: "trailing closure passed to parameter of type 'DispatchWorkItem'" and "missing argument labels in call"
  - iOS build now succeeds without Swift compiler errors

## [0.1.4] - 2025-11-23

### Fixed

- **Critical**: Include RustBridge.swift in podspec compilation
  - Added `.swift` extension to RustFFI source_files pattern in podspec
  - Previous fix (v0.1.3) excluded test files but inadvertently excluded RustBridge.swift
  - This was causing missing symbol errors: "cannot find 'computeFFTWrapper' in scope"
  - RustBridge.swift contains critical FFI wrapper functions for Rust DSP core
  - Now correctly includes Swift bridge files from RustFFI/ directory while still excluding Tests/

## [0.1.3] - 2025-11-23

### Fixed

- **Critical**: Exclude test files from podspec source_files to prevent build errors
  - Updated podspec to exclude `Tests/` directory from compilation
  - Test files use `@testable` imports which are only valid in test targets, not production builds
  - This was causing Xcode build failures: "error: @testable import LoqaAudioDsp"
  - Now only includes production source files: `LoqaAudioDspModule.swift` and RustFFI headers

## [0.1.2] - 2025-11-23

### Fixed

- **Critical**: Fix XCFramework binary naming for CocoaPods compatibility
  - Renamed simulator binary from `libloqa_voice_dsp_sim.a` to `libloqa_voice_dsp.a`
  - Updated XCFramework Info.plist to reference consistent binary name
  - CocoaPods requires all slices in an XCFramework to have the same binary name for static libraries
  - This was preventing `pod install` from completing with error: "contains static libraries with differing binary names"
  - Now works seamlessly with `npx expo prebuild` and pod install

## [0.1.1] - 2025-11-23

### Fixed

- **Critical**: Include `expo-module.config.json` in published package for Expo autolinking support
  - The config file existed in the repository but was not listed in package.json `files` array
  - This caused Expo apps to fail with "Cannot find native module 'LoqaAudioDsp'" runtime error
  - Users had to manually edit their Podfile to add the module
  - Now works out-of-the-box with `npx expo prebuild` - no manual configuration needed
  - Matches the seamless autolinking experience of @loqalabs/loqa-audio-bridge

## [0.1.0] - 2025-11-21

### Added

- **Core DSP Functions**: Production-grade audio DSP analysis capabilities

  - `computeFFT()`: Fast Fourier Transform with configurable window functions (Hanning, Hamming, Blackman)
  - `detectPitch()`: YIN algorithm-based pitch detection with confidence scoring
  - `extractFormants()`: LPC-based formant extraction (F1, F2, F3 with bandwidths)
  - `analyzeSpectrum()`: Spectral analysis (centroid, rolloff, tilt)

- **Cross-Platform Support**: Native iOS and Android implementations

  - iOS 15.1+ with Swift FFI bindings to Rust DSP core
  - Android API 24+ with Kotlin JNI bindings to Rust DSP core
  - Identical API and behavior across platforms

- **TypeScript API**: Fully typed TypeScript interface

  - Complete type definitions (.d.ts) for all functions and types
  - Input validation with clear error messages
  - Promise-based async API for non-blocking operation

- **Performance**: Optimized for real-time audio processing

  - Sub-5ms processing latency for 2048-sample buffers
  - Battle-tested Rust loqa-voice-dsp crate for core algorithms
  - Memory-safe FFI/JNI boundaries

- **Example Application**: Comprehensive demo app showcasing all features

  - Real-time FFT visualization
  - Pitch detection tuner interface
  - Formant analysis with vowel chart
  - Spectral analysis visualization
  - Performance benchmarking tools

- **Documentation**: Complete developer resources

  - README.md with quick start guide
  - API.md with detailed function reference
  - INTEGRATION_GUIDE.md with common patterns and best practices
  - Example code for all DSP functions

- **Build & CI/CD**: Automated quality assurance
  - GitHub Actions CI pipeline (lint, typecheck, test, audit)
  - Automated npm publishing on version tags
  - TypeScript strict mode compilation
  - Jest unit tests for TypeScript layer
  - XCTest (iOS) and JUnit (Android) tests for native code

### Technical Details

- Package name: `@loqalabs/loqa-audio-dsp`
- Expo SDK: 54.0+
- React Native: 0.76+
- License: MIT
- Repository: https://github.com/loqalabs/loqa-audio-dsp

---

[0.1.9]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.9
[0.1.8]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.8
[0.1.7]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.7
[0.1.6]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.6
[0.1.5]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.5
[0.1.4]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.4
[0.1.3]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.3
[0.1.2]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.2
[0.1.1]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.1
[0.1.0]: https://github.com/loqalabs/loqa-audio-dsp/releases/tag/v0.1.0
