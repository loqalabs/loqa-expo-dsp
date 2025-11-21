# Product Brief: loqa-audio-dsp

**Date:** 2025-11-20
**Author:** Anna
**Context:** greenfield

---

## Executive Summary

**@loqalabs/loqa-audio-dsp** is a production-grade Expo native module that brings high-performance audio DSP analysis to React Native applications. By wrapping the battle-tested loqa-voice-dsp Rust crate with native iOS and Android bindings, it provides developers with essential DSP functions (FFT, pitch detection, formant extraction, spectral analysis) in a simple, performant package.

This is a companion package to @loqalabs/loqa-audio-bridge, focusing on analysis rather than streaming - following a composable, single-responsibility architecture that lets developers use only what they need.

---

## Core Vision

### Problem Statement

React Native/Expo developers building voice and audio applications need access to production-grade DSP analysis functions. While the previous VoicelineDSP v0.2.0 combined streaming and analysis in one package, this created unnecessarily large bundles and tight coupling for users who only needed one capability.

Additionally, developers need:
- **Performance**: Native-quality DSP without JavaScript bottlenecks
- **Simplicity**: Easy-to-use API that works out of the box
- **Cross-platform consistency**: Identical behavior on iOS and Android
- **Production reliability**: Battle-tested algorithms (YIN pitch, LPC formants, FFT)

### Proposed Solution

Create a focused, composable Expo module that provides four core DSP functions via clean TypeScript APIs backed by high-performance Rust implementations:

1. **computeFFT()** - Fast Fourier Transform for frequency spectrum analysis
2. **detectPitch()** - YIN algorithm for fundamental frequency detection
3. **extractFormants()** - LPC-based formant analysis (F1, F2, F3)
4. **analyzeSpectrum()** - Spectral features (centroid, tilt, rolloff)

The module wraps the proven loqa-voice-dsp Rust crate using Swift FFI (iOS) and Kotlin JNI (Android), delivering native performance with zero-copy optimizations where possible.

### Key Differentiators

- **Separation of Concerns**: Unlike VoicelineDSP v0.2.0, keeps streaming (@loqalabs/loqa-audio-bridge) and analysis (this package) separate
- **Smaller Bundle Sizes**: Developers only install what they need
- **Independent Versioning**: Analysis and streaming can evolve at different paces
- **Proven Architecture**: Reuses successful patterns from loqa-audio-bridge implementation
- **Production-Grade Performance**: <5ms latency targets for real-time analysis

---

## Target Users

### Primary Users

**React Native/Expo Developers Building Audio Applications**

Specifically developers working on:
- Voice analysis apps (pitch tracking, vocal coaching)
- Music applications (tuners, spectrum analyzers)
- Speech processing tools (formant analysis, pronunciation)
- Audio visualization (real-time spectrum displays)
- Research/education tools (DSP experimentation)

**Their Current Situation:**
- Either building custom native modules (complex, time-consuming)
- Using JavaScript DSP libraries (too slow for real-time)
- Looking to migrate from VoicelineDSP v0.2.0 to modular architecture
- Need production-quality algorithms without implementing from scratch

**Technical Comfort Level:**
- Intermediate to advanced React Native developers
- Understand basic DSP concepts (FFT, frequency, sample rates)
- Want native performance without writing Swift/Kotlin themselves

### Secondary Users

**Voiceline Team and Internal Loqa Labs Projects**

Teams already using or planning to use @loqalabs/loqa-audio-bridge who need complementary DSP analysis capabilities for their streaming audio.

---

## MVP Scope

### Core Features

**v0.1.0 Release Must Include:**

1. **Four DSP Functions Implemented:**
   - computeFFT() - Fast Fourier Transform
   - detectPitch() - YIN pitch detection
   - extractFormants() - LPC formant extraction
   - analyzeSpectrum() - Spectral feature analysis

2. **Native Platform Bindings:**
   - iOS Swift FFI bindings to loqa-voice-dsp
   - Android Kotlin JNI bindings to loqa-voice-dsp
   - Cross-platform API parity

3. **TypeScript API Layer:**
   - Clean, typed interfaces for all functions
   - Proper error handling and validation
   - Performance optimizations

4. **Example Application:**
   - Demonstrates all four DSP functions
   - Real-time visualization
   - Integration with loqa-audio-bridge
   - Performance benchmarking

5. **Developer Documentation:**
   - README with quick start
   - API.md reference
   - INTEGRATION_GUIDE.md
   - Code examples

6. **Distribution Infrastructure:**
   - npm package configuration
   - GitHub Actions CI/CD
   - Automated publishing workflow
   - CHANGELOG and RELEASING docs

### Out of Scope for MVP

- Advanced DSP functions beyond the core four (e.g., MFCC, wavelet transforms)
- Real-time audio streaming (handled by @loqalabs/loqa-audio-bridge)
- Audio playback or recording capabilities
- Web platform support (React Native Web)
- Offline/on-device model inference

### Future Vision

**Post-MVP Exploration:**

Beyond v0.1.0, the package may expand to include additional DSP functions particularly valuable for **voice training applications**:

- **MFCC (Mel-Frequency Cepstral Coefficients)**: Speech and speaker recognition features
- **Jitter & Shimmer Analysis**: Voice quality metrics for vocal health
- **Harmonic-to-Noise Ratio (HNR)**: Voice breathiness and clarity assessment
- **Spectral Tilt & Brightness**: Vocal timbre characterization
- **Energy & Intensity Contours**: Dynamic range and loudness analysis
- **Zero-Crossing Rate**: Voice activity and voicing detection
- **Vocal Tract Length Estimation**: Speaker normalization features

**Future Platform Support:**
- React Native Web support (if browser Web Audio API proves viable)
- Desktop platforms via Expo (macOS, Windows)

**Evolution Approach:**
- Demand-driven: Add functions based on Voiceline team and community needs
- Maintain composability: New functions as optional imports to keep bundle sizes small
- Performance-first: Only add functions that can meet real-time performance targets

### MVP Success Criteria

**Technical Performance:**
- All four DSP functions operational on iOS and Android
- <5ms latency for 2048-sample buffer processing
- Cross-platform API parity (identical behavior iOS/Android)
- Zero critical bugs in core DSP functions
- Comprehensive test coverage (unit + integration)

**Developer Experience:**
- Installation time: <2 minutes from `npx expo install` to working code
- Integration time: <15 minutes to first working DSP analysis
- Clear error messages for common mistakes
- Example app runs successfully on both platforms

**Distribution Success:**
- Published to npm registry as @loqalabs/loqa-audio-dsp
- CI/CD pipeline passing (build, test, publish)
- Documentation complete and accessible

---

## Success Metrics

### MVP Launch Indicators (v0.1.0)

**Primary Success Signal:**
- Voiceline team successfully adopts package in production
- Internal Loqa Labs projects using the package

**Secondary Signals:**
- Package installs without major issues
- Example app demonstrates all features working
- Documentation feedback is positive

### Long-term Success Metrics

**Adoption:**
- npm download trends (growth indicator)
- GitHub engagement (stars, issues, PRs as community health signals)
- Developer testimonials and integration stories

**Quality Indicators:**
- Issue resolution time and volume
- Cross-platform consistency (no iOS-only or Android-only bugs)
- Performance benchmarks remain within targets
- Community contributions and ecosystem integrations

---

## Technical Preferences

### Technology Stack

**Core Platform:**
- Expo SDK 54+ (primary target)
- React Native 0.76+
- TypeScript with strict mode
- Expo Modules Core for native bindings

**Native Development:**
- iOS: Swift FFI to Rust (minimum iOS 15.1+)
- Android: Kotlin JNI to Rust (minimum API 24, Android 7.0+)
- Rust: loqa-voice-dsp crate (external dependency)

**Build & Distribution:**
- npm for package distribution
- GitHub Actions for CI/CD
- Standard Expo module tooling (`create-expo-module`)

**Testing:**
- TypeScript: Jest for unit tests
- iOS: XCTest for native Swift tests
- Android: JUnit for native Kotlin tests
- Integration: Example app for end-to-end validation

**Development Approach:**
- Reuse proven patterns from @loqalabs/loqa-audio-bridge
- Follow Expo module best practices
- Maintain backward compatibility within major versions

---

## Organizational Context

**Strategic Positioning:**

This is primarily **infrastructure for Voiceline and internal Loqa Labs products**, with secondary benefit as an open-source community tool.

**Priority Focus:**
1. **Internal Product Needs:** Serve Voiceline team and Loqa Labs projects first
2. **Production Quality:** Reliable, performant, well-documented for real products
3. **Open Source Community:** Share publicly, accept contributions, but internal needs drive roadmap

**Ownership & Maintenance:**
- Loqa Labs Engineering owns the package
- Active maintenance and support for internal users
- Community contributions welcome but evaluated against internal priorities

---

## Risks and Assumptions

### High Priority Risks

**FFI/JNI Complexity (Mitigated)**
- **Risk:** Native bindings to Rust can be error-prone, especially memory management
- **Mitigation:** Reference implementation exists in VoicelineDSP v0.2.0; proven patterns from loqa-audio-bridge
- **Fallback:** Comprehensive testing and gradual rollout

**Cross-Platform Consistency (Mitigated)**
- **Risk:** Subtle differences between iOS and Android implementations
- **Mitigation:** Comprehensive test suite covering both platforms; performance benchmarking
- **Validation:** Example app demonstrates identical behavior

### Medium Priority Risks

**Dependency on loqa-voice-dsp Rust Crate**
- **Risk:** Breaking changes or issues in upstream Rust crate could block progress
- **Assumption:** Loqa Labs controls loqa-voice-dsp, can coordinate changes
- **Mitigation:** Pin specific Rust crate versions; thorough testing before upgrades

**Expo SDK Evolution**
- **Risk:** Expo SDK updates (54 → 55+) might introduce breaking changes
- **Mitigation:** Follow Expo module best practices; test against new SDK versions early
- **Strategy:** Support current + next SDK version (54, 55)

**Performance on Older Devices**
- **Risk:** Real-world devices may not meet <5ms latency targets
- **Mitigation:** Benchmark testing on range of devices; optimization iteration
- **Acceptance:** Document minimum device requirements if needed

### Low Priority Risks

**npm Publishing & CI/CD**
- **Risk:** Distribution pipeline issues
- **Mitigation:** Reuse loqa-audio-bridge workflows; well-established patterns

**Documentation Gaps**
- **Risk:** Incomplete or unclear documentation slows adoption
- **Mitigation:** Follow loqa-audio-bridge documentation structure; gather early feedback

### Critical Assumptions

1. **Rust Crate Stability:** loqa-voice-dsp provides stable, well-tested DSP algorithms
2. **VoicelineDSP v0.2.0 as Reference:** Existing implementation provides valid architectural patterns
3. **Voiceline Team Adoption:** Internal team will migrate to new package architecture
4. **Expo Module Maturity:** Expo Modules Core is stable enough for production native modules
5. **Resource Availability:** Sufficient engineering time to complete all 5 epics

---

## Supporting Materials

**Reference Documentation:**
- [EPIC_BREAKDOWN.md](EPIC_BREAKDOWN.md) - Detailed epic and story breakdown for implementation
- [loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge) - Sister package for audio streaming
- VoicelineDSP v0.2.0 - Prior implementation with combined streaming + DSP

**License:**
- MIT License - Open source, permissive licensing

---

_This Product Brief captures the vision and requirements for loqa-audio-dsp._

_It was created through collaborative discovery and reflects the unique needs of this greenfield project._

_Next: Use the PRD workflow to create detailed product requirements from this brief._
