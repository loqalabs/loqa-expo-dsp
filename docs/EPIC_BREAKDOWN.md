# @loqalabs/loqa-audio-dsp - Epic Breakdown

**Project:** Production-Grade DSP Analysis Expo Module
**Timeline:** 6-8 weeks (Target: v0.1.0 by mid-December 2025)
**Architecture Pattern:** Same as loqa-audio-bridge (proven BMM workflow)

---

## Project Context

This package provides DSP (Digital Signal Processing) analysis functions as a companion to [@loqalabs/loqa-audio-bridge](https://github.com/loqalabs/loqa-audio-bridge). It wraps the high-performance [loqa-voice-dsp](https://github.com/loqalabs/loqa) Rust crate with native iOS (Swift FFI) and Android (Kotlin JNI) bindings.

**Why Separate Package:**
- Focused, composable architecture
- Smaller bundle sizes (use only what you need)
- Independent versioning and release cycles

---

## Epic Overview

### Epic 1: Foundation & Scaffolding ✅
**Status:** COMPLETE  
**Duration:** 1 day  
**Goal:** Project structure, repository, initial documentation

**Stories:**
- ✅ 1.1: Create repository and initial package.json
- ✅ 1.2: Add README, LICENSE, .gitignore
- ✅ 1.3: Push to GitHub

### Epic 2: Native Module Implementation
**Status:** TODO  
**Duration:** 2-3 weeks  
**Goal:** Implement FFI/JNI bindings to loqa-voice-dsp Rust crate

**Stories:**
- 2.1: Set up Expo module scaffolding with create-expo-module
- 2.2: iOS Swift FFI bindings
  - 2.2.1: Implement computeFFT Swift → Rust FFI
  - 2.2.2: Implement detectPitch Swift → Rust FFI
  - 2.2.3: Implement extractFormants Swift → Rust FFI
  - 2.2.4: Implement analyzeSpectrum Swift → Rust FFI
- 2.3: Android Kotlin JNI bindings
  - 2.3.1: Implement computeFFT Kotlin → Rust JNI
  - 2.3.2: Implement detectPitch Kotlin → Rust JNI
  - 2.3.3: Implement extractFormants Kotlin → Rust JNI
  - 2.3.4: Implement analyzeSpectrum Kotlin → Rust JNI
- 2.4: TypeScript API layer
  - 2.4.1: Export functions with proper types
  - 2.4.2: Error handling and validation
  - 2.4.3: Performance optimizations
- 2.5: Migrate and run tests
  - 2.5.1: TypeScript unit tests
  - 2.5.2: iOS native tests
  - 2.5.3: Android native tests

### Epic 3: Example App & Integration Testing
**Status:** TODO  
**Duration:** 1 week  
**Goal:** Demonstrate all DSP functions with real-time audio

**Stories:**
- 3.1: Create example app structure
- 3.2: Implement FFT spectrum visualizer
- 3.3: Implement pitch detection demo
- 3.4: Implement formant analysis display
- 3.5: Implement spectral features visualization
- 3.6: Integration with loqa-audio-bridge streaming
- 3.7: Performance benchmarking

### Epic 4: Documentation
**Status:** TODO  
**Duration:** 3-5 days  
**Goal:** Comprehensive docs for developers

**Stories:**
- 4.1: Write README.md with quick start
- 4.2: Create API.md reference documentation
- 4.3: Write INTEGRATION_GUIDE.md
- 4.4: Add code examples and snippets
- 4.5: Document performance characteristics

### Epic 5: Distribution & CI/CD
**Status:** TODO  
**Duration:** 3-5 days  
**Goal:** Automated testing, publishing, release process

**Stories:**
- 5.1: Configure npm package for publishing
- 5.2: Create GitHub Actions CI pipeline
- 5.3: Create automated npm publishing workflow
- 5.4: Create CHANGELOG.md and RELEASING.md
- 5.5: Test installation and integration

---

## Success Criteria

**v0.1.0 Release Goals:**

1. ✅ All 4 DSP functions implemented (FFT, pitch, formants, spectrum)
2. ✅ Cross-platform parity (iOS + Android identical API)
3. ✅ Performance: <5ms latency for 2048-sample buffer on modern devices
4. ✅ Zero-copy optimizations where possible
5. ✅ Comprehensive documentation
6. ✅ Example app demonstrating all functions
7. ✅ Published to npm registry
8. ✅ CI/CD pipeline with automated releases

**User Experience Goals:**

- Installation: `npx expo install @loqalabs/loqa-audio-dsp`
- Integration time: <15 minutes from install to working DSP
- Works seamlessly with loqa-audio-bridge for real-time analysis

---

## Technical Architecture

```
┌─────────────────────────────────────────┐
│  React Native / Expo Application        │
│  ┌───────────────────────────────────┐  │
│  │  @loqalabs/loqa-audio-dsp (TS)   │  │
│  │  - computeFFT()                   │  │
│  │  - detectPitch()                  │  │
│  │  - extractFormants()              │  │
│  │  - analyzeSpectrum()              │  │
│  └────────────┬──────────────────────┘  │
└───────────────┼──────────────────────────┘
                │ Expo Modules Core
       ┌────────┴────────┐
       │                 │
┌──────▼──────┐   ┌──────▼──────┐
│iOS (Swift)  │   │Android (Kt) │
│FFI bindings │   │JNI bindings │
└──────┬──────┘   └──────┬──────┘
       │                 │
       └────────┬────────┘
                │
        ┌───────▼────────┐
        │ loqa-voice-dsp │
        │  (Rust crate)  │
        │  - YIN pitch   │
        │  - LPC formants│
        │  - FFT/DFT     │
        │  - Spectral    │
        └────────────────┘
```

---

## Dependencies

**External:**
- loqa-voice-dsp (Rust crate) - DSP algorithms
- Expo Modules Core - Native module framework
- React Native 0.72+
- Expo SDK 52+

**Internal:**
- @loqalabs/loqa-audio-bridge (optional but recommended for streaming)

---

## Risk Assessment

**High Risk:**
- FFI/JNI complexity (mitigated: we have v0.2.0 implementation to reference)
- Cross-platform consistency (mitigated: comprehensive test suite)

**Medium Risk:**
- Performance on older devices (mitigated: benchmark tests + optimization)
- Memory management in FFI/JNI (mitigated: careful pointer handling)

**Low Risk:**
- npm publishing (mitigated: reuse loqa-audio-bridge workflow)
- Documentation (mitigated: reuse loqa-audio-bridge patterns)

---

## Next Steps

1. **Kick off Epic 2:** Run `npx create-expo-module` to scaffold module
2. **Reference v0.2.0:** Review VoicelineDSP implementation for FFI/JNI patterns
3. **Iterative development:** Implement one DSP function at a time, test thoroughly
4. **Early feedback:** Share alpha builds with Voiceline team for testing

---

**Owner:** Loqa Labs Engineering  
**Created:** 2025-11-20  
**Status:** 🚧 In Planning
