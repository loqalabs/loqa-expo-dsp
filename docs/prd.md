# loqa-audio-dsp - Product Requirements Document

**Author:** Anna
**Date:** 2025-11-20
**Version:** 1.0

---

## Executive Summary

**@loqalabs/loqa-audio-dsp** is a production-grade Expo native module that brings high-performance audio DSP analysis to React Native applications. By wrapping the battle-tested loqa-voice-dsp Rust crate with native iOS and Android bindings, it provides developers with essential DSP functions (FFT, pitch detection, formant extraction, spectral analysis) in a simple, performant package.

This is a companion package to @loqalabs/loqa-audio-bridge, following a composable, single-responsibility architecture that addresses the architectural limitations of VoicelineDSP v0.2.0's monolithic approach.

### What Makes This Special

**Composable Architecture Through Separation of Concerns**

Unlike VoicelineDSP v0.2.0 which combined streaming and analysis into one package, @loqalabs/loqa-audio-dsp implements a focused, modular design:

- **Smaller bundle sizes**: Developers install only what they need (streaming OR analysis, not both)
- **Independent evolution**: Analysis and streaming features can evolve at different paces
- **Production-grade performance**: <5ms latency targets using native Rust + FFI/JNI optimizations
- **Battle-tested algorithms**: Proven DSP implementations (YIN pitch, LPC formants, FFT) from loqa-voice-dsp crate
- **Cross-platform consistency**: Identical APIs and behavior on iOS and Android

This separation creates a cleaner dependency graph, reduces complexity for developers, and follows the Unix philosophy of doing one thing well.

---

## Project Classification

**Technical Type:** developer_tool
**Domain:** general
**Complexity:** low

This is a **developer-facing SDK/library** distributed via npm, targeting React Native/Expo developers who need native-quality audio DSP capabilities without writing platform-specific code themselves.

**Classification Rationale:**
- Primary users are developers, not end-users
- Delivered as npm package with TypeScript APIs
- Wraps native functionality (Rust DSP via Swift/Kotlin bindings)
- Requires integration into React Native applications
- Standard software development practices apply (no special regulatory requirements)

**Reference Documents:**
- Product Brief: [product-brief-loqa-audio-dsp-2025-11-20.md](product-brief-loqa-audio-dsp-2025-11-20.md)
- Related Package: [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge)
- Prior Implementation: VoicelineDSP v0.2.0

---

## Success Criteria

**Primary Success Signal - Internal Adoption:**
- Voiceline team successfully integrates and uses the package in production applications
- Internal Loqa Labs projects adopt the package for their audio DSP needs
- Migration path from VoicelineDSP v0.2.0 is validated and successful

**Technical Performance Criteria:**
- All four core DSP functions (computeFFT, detectPitch, extractFormants, analyzeSpectrum) operational on both iOS and Android
- Processing latency <5ms for 2048-sample buffers on modern devices
- Cross-platform API parity achieved - identical behavior and results on iOS/Android
- Zero critical bugs in core DSP algorithms
- Example app demonstrates all features working correctly on both platforms

**Developer Experience Success:**
- Installation from `npx expo install @loqalabs/loqa-audio-dsp` to working code in <2 minutes
- Integration from zero to first working DSP analysis in <15 minutes
- Clear, actionable error messages for common integration mistakes
- Documentation complete, accurate, and accessible
- CI/CD pipeline passing (build, test, publish to npm)

**Quality Indicators (Long-term):**
- npm download trends show growth (community adoption signal)
- Issue resolution maintained at reasonable pace
- Cross-platform consistency maintained (no platform-specific bugs)
- Performance benchmarks remain within targets across SDK updates

---

## Product Scope

### MVP - Minimum Viable Product

**v0.1.0 Release Capabilities:**

**Four Core DSP Functions:**
1. **computeFFT()** - Fast Fourier Transform for frequency spectrum analysis
2. **detectPitch()** - YIN algorithm for fundamental frequency detection
3. **extractFormants()** - LPC-based formant analysis (F1, F2, F3)
4. **analyzeSpectrum()** - Spectral features (centroid, tilt, rolloff)

**Native Platform Support:**
- iOS bindings via Swift FFI to loqa-voice-dsp Rust crate (iOS 15.1+)
- Android bindings via Kotlin JNI to loqa-voice-dsp Rust crate (API 24+, Android 7.0+)
- Cross-platform API parity and identical behavior

**TypeScript API Layer:**
- Clean, typed interfaces for all DSP functions
- Proper error handling and input validation
- Performance optimizations (zero-copy where possible)

**Example Application:**
- Demonstrates all four DSP functions working
- Real-time audio visualization
- Integration example with @loqalabs/loqa-audio-bridge
- Performance benchmarking capabilities

**Developer Documentation:**
- README with quick start guide
- API.md reference documentation
- INTEGRATION_GUIDE.md with common patterns
- Inline code examples and TypeScript type definitions

**Distribution Infrastructure:**
- npm package configuration and metadata
- GitHub Actions CI/CD pipeline
- Automated publishing workflow
- CHANGELOG.md and RELEASING.md documentation

### Growth Features (Post-MVP)

**Additional DSP Functions for Voice Training Applications:**
- MFCC (Mel-Frequency Cepstral Coefficients) for speech recognition features
- Jitter & Shimmer analysis for vocal health metrics
- Harmonic-to-Noise Ratio (HNR) for voice quality assessment
- Spectral tilt & brightness for vocal timbre characterization
- Energy & intensity contours for dynamic range analysis
- Zero-crossing rate for voice activity detection
- Vocal tract length estimation for speaker normalization

**Enhanced Developer Experience:**
- Pre-configured presets for common use cases (tuner, pitch tracker, voice analyzer)
- Visual debugging tools or utilities
- Performance profiling helpers
- Advanced configuration options for power users

**Platform Expansion:**
- React Native Web support (if browser Web Audio API proves viable)
- Desktop platforms via Expo (macOS, Windows)

### Vision (Future)

**Ecosystem Integration:**
- Plugin system for custom DSP algorithm extensions
- Community-contributed DSP functions
- Integration templates for popular audio frameworks

**Advanced Capabilities:**
- GPU-accelerated processing for computationally intensive operations
- Multi-channel audio support
- Streaming DSP (continuous processing pipelines)
- On-device model inference integration

**Developer Tools:**
- Visual DSP playground/sandbox for experimentation
- Browser-based documentation with live interactive examples
- Performance comparison tools across devices

---

## Developer Tool Specific Requirements

### Language & Platform Support

**Primary Target:**
- TypeScript as primary API surface (with proper type definitions)
- React Native 0.76+ / Expo SDK 54+
- Node.js compatible (for build/test tooling)

**Platform Coverage:**
- iOS 15.1+ (Swift 5.5+)
- Android API 24+ / Android 7.0+ (Kotlin 1.9+)
- No web platform support in v0.1.0

**Package Manager:**
- npm as primary distribution channel
- Compatible with yarn, pnpm
- Expo CLI integration (`npx expo install @loqalabs/loqa-audio-dsp`)

### Installation & Integration

**Installation Methods:**

```bash
# Preferred: Expo CLI (auto-configures native dependencies)
npx expo install @loqalabs/loqa-audio-dsp

# Alternative: npm/yarn (requires manual native setup)
npm install @loqalabs/loqa-audio-dsp
npx expo prebuild
```

**Integration Requirements:**
- Must work out-of-box with Expo managed workflow
- Support for bare React Native projects with manual linking
- Zero additional native configuration required for Expo users
- Compatible with Expo EAS Build and local development builds

**Developer Setup Time Target:** <2 minutes from install to working code

### API Surface Design

**API Principles:**
- **Simple by default, configurable when needed**: Common cases require minimal parameters
- **Type-safe**: Full TypeScript definitions with JSDoc comments
- **Consistent naming**: Follow React Native/Expo conventions
- **Predictable errors**: Clear error messages with actionable guidance

**API Structure:**

```typescript
// Clean, typed function exports
import { computeFFT, detectPitch, extractFormants, analyzeSpectrum } from '@loqalabs/loqa-audio-dsp';

// Simple invocation with sensible defaults
const fftResult = await computeFFT(audioBuffer);
const pitch = await detectPitch(audioBuffer, sampleRate);
const formants = await extractFormants(audioBuffer, sampleRate);
const spectrum = await analyzeSpectrum(audioBuffer, sampleRate);
```

**API Design Requirements:**
- All functions are async (return Promises)
- Accept Float32Array or number[] for audio data
- Return strongly-typed result objects
- Throw typed errors for invalid inputs
- Support optional configuration objects for advanced use cases

### Code Examples & Documentation

**Required Example Scenarios:**
1. Basic FFT analysis of audio buffer
2. Real-time pitch detection with @loqalabs/loqa-audio-bridge
3. Formant extraction for voice analysis
4. Spectral analysis for audio visualization
5. Performance benchmarking setup

**Documentation Structure:**
- **README.md**: Quick start, installation, basic usage
- **API.md**: Complete API reference with all functions and types
- **INTEGRATION_GUIDE.md**: Common integration patterns and best practices
- **EXAMPLES.md**: Detailed code examples with explanations
- Inline TypeScript comments (JSDoc) for IDE autocomplete

### Testing & Validation

**Test Coverage Requirements:**
- Unit tests for all TypeScript API functions
- Native tests for Swift FFI bindings (XCTest)
- Native tests for Kotlin JNI bindings (JUnit)
- Integration tests in example app
- Performance benchmarks

**Testing Tools:**
- Jest for TypeScript unit tests
- XCTest for iOS native tests
- JUnit for Android native tests
- Detox or Maestro for E2E testing (optional)

---

## Functional Requirements

### Core DSP Analysis Capabilities

**FFT (Fast Fourier Transform):**
- FR1: System can compute FFT on audio buffer input and return frequency spectrum data
- FR2: Users can specify FFT size (default: match buffer size, power-of-2 required)
- FR3: System returns magnitude spectrum and optionally phase information
- FR4: System supports windowing functions (Hanning, Hamming, Blackman)

**Pitch Detection:**
- FR5: System can detect fundamental frequency (F0) using YIN algorithm
- FR6: Users can analyze audio buffers at specified sample rates (8kHz - 48kHz)
- FR7: System returns pitch in Hz with confidence score
- FR8: System handles both voiced and unvoiced audio segments appropriately

**Formant Extraction:**
- FR9: System can extract formant frequencies (F1, F2, F3) using LPC analysis
- FR10: Users can specify LPC order (default: appropriate for sample rate)
- FR11: System returns formant frequencies in Hz with bandwidth information
- FR12: System validates input is appropriate for formant analysis

**Spectral Analysis:**
- FR13: System can compute spectral centroid (brightness measure)
- FR14: System can compute spectral rolloff (frequency below which X% energy concentrated)
- FR15: System can compute spectral tilt (slope of spectrum)
- FR16: System returns all spectral features in single analysis call

### Native Platform Integration

**iOS Platform:**
- FR17: All four DSP functions work on iOS 15.1+ devices
- FR18: Swift FFI bindings correctly marshal data to/from Rust loqa-voice-dsp crate
- FR19: Memory management prevents leaks in FFI boundary
- FR20: iOS native module integrates with Expo Modules API

**Android Platform:**
- FR21: All four DSP functions work on Android API 24+ devices
- FR22: Kotlin JNI bindings correctly marshal data to/from Rust loqa-voice-dsp crate
- FR23: Memory management prevents leaks in JNI boundary
- FR24: Android native module integrates with Expo Modules API

**Cross-Platform Parity:**
- FR25: Identical API signatures on iOS and Android
- FR26: Identical numerical results (within floating-point tolerance) on both platforms
- FR27: Identical error handling and validation on both platforms

### TypeScript API Layer

**API Surface:**
- FR28: Package exports four primary functions: computeFFT, detectPitch, extractFormants, analyzeSpectrum
- FR29: All functions accept audio data as Float32Array or number[]
- FR30: All functions return Promise-based results
- FR31: All functions have full TypeScript type definitions

**Input Validation:**
- FR32: System validates audio buffer is not empty
- FR33: System validates sample rate is within supported range (8000-48000 Hz)
- FR34: System validates FFT size is power of 2
- FR35: System provides clear error messages for invalid inputs

**Error Handling:**
- FR36: System throws typed errors for invalid inputs
- FR37: System handles native module initialization failures gracefully
- FR38: System provides actionable error messages with suggested fixes
- FR39: System logs warnings for sub-optimal configurations

**Configuration:**
- FR40: Users can optionally configure FFT window type
- FR41: Users can optionally configure LPC order for formant extraction
- FR42: Users can optionally configure pitch detection parameters (min/max frequency)
- FR43: System provides sensible defaults for all optional parameters

### Package Distribution

**npm Package:**
- FR44: Package is published to npm registry as @loqalabs/loqa-audio-dsp
- FR45: Package includes TypeScript type definitions (.d.ts files)
- FR46: Package includes source maps for debugging
- FR47: Package metadata includes correct peer dependencies

**Installation:**
- FR48: Package installs via `npx expo install @loqalabs/loqa-audio-dsp`
- FR49: Package works with Expo managed workflow without ejecting
- FR50: Package works with bare React Native after prebuild
- FR51: Native dependencies are automatically configured for Expo users

**Versioning:**
- FR52: Package follows semantic versioning (semver)
- FR53: CHANGELOG.md documents all changes between versions
- FR54: Breaking changes are clearly marked and documented

### Example Application

**Demonstration:**
- FR55: Example app demonstrates all four DSP functions working
- FR56: Example app includes real-time audio visualization
- FR57: Example app shows integration with @loqalabs/loqa-audio-bridge
- FR58: Example app runs successfully on both iOS and Android

**Performance Benchmarking:**
- FR59: Example app includes performance benchmarking tools
- FR60: Benchmarks measure processing latency for each DSP function
- FR61: Benchmarks test with various buffer sizes (512, 1024, 2048, 4096 samples)
- FR62: Benchmark results are displayed in the app UI

### Documentation

**Developer Documentation:**
- FR63: README.md includes quick start guide with installation instructions
- FR64: API.md documents all functions, parameters, and return types
- FR65: INTEGRATION_GUIDE.md provides common integration patterns
- FR66: Code examples demonstrate typical use cases

**Inline Documentation:**
- FR67: All exported functions have JSDoc comments
- FR68: All TypeScript types have descriptive comments
- FR69: Complex algorithms have explanatory comments
- FR70: Error messages reference documentation when applicable

### Build & CI/CD

**Build System:**
- FR71: Package builds successfully for iOS and Android
- FR72: TypeScript compiles without errors with strict mode enabled
- FR73: Native modules compile without warnings
- FR74: Build process is automated via package.json scripts

**Continuous Integration:**
- FR75: GitHub Actions workflow runs on all pull requests
- FR76: CI runs TypeScript type checking
- FR77: CI runs unit tests for TypeScript and native code
- FR78: CI verifies package can be built and published

**Publishing:**
- FR79: Automated publishing workflow publishes to npm on version tag
- FR80: Publishing includes version bumping and changelog generation
- FR81: Publishing validates all tests pass before release
- FR82: RELEASING.md documents the release process

---

## Non-Functional Requirements

### Performance

**Processing Latency:**
- NFR1: Each DSP function processes 2048-sample buffer in <5ms on modern devices (iPhone 12+, Pixel 5+)
- NFR2: Processing latency scales linearly with buffer size
- NFR3: Memory allocations are minimized during processing (pre-allocated buffers where possible)
- NFR4: No UI blocking - all DSP operations are non-blocking (async)

**Memory Efficiency:**
- NFR5: Peak memory usage stays below 50MB for typical analysis operations
- NFR6: No memory leaks in FFI/JNI boundary after sustained use
- NFR7: Audio buffers are released promptly after processing
- NFR8: Native module initialization overhead <100ms

**Startup Performance:**
- NFR9: Package import/initialization completes in <200ms
- NFR10: First DSP function call has <10ms additional overhead (lazy initialization acceptable)
- NFR11: No blocking operations during package initialization

**Benchmarking:**
- NFR12: Performance benchmarks are reproducible across runs
- NFR13: Benchmark results include min/max/avg/p95 latency metrics
- NFR14: Performance regression tests alert if latency increases >20%

### Security

**Input Validation:**
- NFR15: All user inputs are validated before native code processing
- NFR16: Invalid inputs cannot cause native crashes
- NFR17: Buffer overflow protections in place for all array operations
- NFR18: No arbitrary code execution vectors through audio data

**Dependency Security:**
- NFR19: All npm dependencies are from trusted sources
- NFR20: Dependencies are kept up-to-date with security patches
- NFR21: No known critical or high-severity CVEs in dependency tree
- NFR22: Dependency audit runs in CI pipeline

**Data Privacy:**
- NFR23: No audio data is transmitted or stored without user action
- NFR24: No telemetry or analytics data collection
- NFR25: No third-party services contacted during operation
- NFR26: All processing happens on-device

### Scalability

**Buffer Size Range:**
- NFR27: Supports buffer sizes from 256 to 8192 samples
- NFR28: Performance degrades gracefully with larger buffers
- NFR29: Memory scaling is predictable and documented

**Concurrent Usage:**
- NFR30: Multiple DSP function calls can be queued without crashing
- NFR31: Concurrent calls from different threads are handled safely
- NFR32: Resource contention is managed appropriately

**Platform Compatibility:**
- NFR33: Works on minimum spec devices (iPhone 8, Android API 24 devices)
- NFR34: Degrades gracefully on older hardware (may not meet <5ms target)
- NFR35: Compatible with Expo SDK 54, 55, and future versions (within major version)

### Integration

**API Compatibility:**
- NFR36: Breaking API changes only in major versions (semver)
- NFR37: Deprecation warnings provided at least one minor version before removal
- NFR38: TypeScript types remain backward compatible within major versions

**Interoperability:**
- NFR39: Works seamlessly with @loqalabs/loqa-audio-bridge
- NFR40: Compatible with standard React Native audio libraries
- NFR41: Does not conflict with other native modules
- NFR42: Audio buffer formats align with Web Audio API standards where applicable

**Build System Integration:**
- NFR43: Integrates with Expo EAS Build without configuration
- NFR44: Works with React Native autolinking
- NFR45: CocoaPods integration for iOS is automatic
- NFR46: Gradle integration for Android is automatic

**Developer Experience:**
- NFR47: TypeScript autocomplete works in all major IDEs (VS Code, WebStorm)
- NFR48: Error stack traces are readable and include source maps
- NFR49: Hot reload works during development
- NFR50: No platform-specific code required in user applications

---

## Summary

This PRD defines **@loqalabs/loqa-audio-dsp v0.1.0** - a focused, production-grade audio DSP analysis package for React Native/Expo developers.

**Key Capabilities:**
- Four core DSP functions (FFT, pitch detection, formant extraction, spectral analysis)
- Native performance (<5ms latency) via Rust FFI/JNI bindings
- Cross-platform consistency (identical API and behavior on iOS/Android)
- Developer-friendly TypeScript API with comprehensive documentation
- Complete distribution infrastructure (npm, CI/CD, versioning)

**What Makes It Special:**
The composable architecture separates streaming from analysis, creating smaller bundles and cleaner dependencies compared to the monolithic VoicelineDSP v0.2.0 approach. This follows the Unix philosophy: do one thing, and do it well.

**Success Criteria:**
Internal adoption by Voiceline team, technical performance targets met (<5ms latency, cross-platform parity), and excellent developer experience (<2 min installation, <15 min integration).

**Functional Requirements:** 82 FRs covering DSP capabilities, platform integration, API design, distribution, examples, documentation, and build infrastructure.

**Non-Functional Requirements:** 50 NFRs covering performance, security, scalability, and integration requirements.

---

_This PRD captures the complete product vision for loqa-audio-dsp - a composable, production-grade DSP analysis package that brings native performance to React Native audio applications._

_Created through collaborative discovery between Anna and AI facilitator._
