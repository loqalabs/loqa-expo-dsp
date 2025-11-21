# Story 1.2: Set Up Rust Build Infrastructure

Status: ready-for-dev

## Story

As a developer,
I want Rust compilation integrated into the native build process,
so that the loqa-voice-dsp crate is automatically built for iOS and Android.

## Acceptance Criteria

1. **Given** the Expo module structure exists
   **When** I add Rust build configuration
   **Then** a rust/ directory is created with:
   - Cargo.toml declaring loqa-voice-dsp dependency
   - build-ios.sh script that compiles for iOS architectures (arm64, x86_64 simulator)
   - build-android.sh script that compiles for Android architectures (arm64-v8a, armeabi-v7a, x86_64)

2. **Given** Rust build scripts exist
   **When** I configure iOS Podspec
   **Then** it is configured to include compiled libloqua_voice_dsp.a

3. **Given** Rust build scripts exist
   **When** I configure Android build.gradle
   **Then** it is configured to include compiled libloqua_voice_dsp.so

4. **Given** build scripts are configured
   **When** I run the iOS build script
   **Then** Rust compiles in release mode with optimizations enabled

5. **Given** build scripts are configured
   **When** I run builds
   **Then** compiled libraries are placed in correct platform-specific directories:
   - iOS: ios/RustFFI/libloqua_voice_dsp.a
   - Android: android/src/main/jniLibs/{arch}/libloqua_voice_dsp.so

## Tasks / Subtasks

- [ ] Create Rust project structure (AC: #1)
  - [ ] Create rust/ directory in project root
  - [ ] Create Cargo.toml with loqa-voice-dsp dependency
  - [ ] Configure Cargo.toml with appropriate version of loqa-voice-dsp crate
  - [ ] Set up lib.rs or appropriate Rust source files if needed

- [ ] Create iOS build script (AC: #1, #4)
  - [ ] Create build-ios.sh in rust/ directory
  - [ ] Configure script to compile for arm64 architecture (iOS devices)
  - [ ] Configure script to compile for x86_64 architecture (iOS simulator)
  - [ ] Create universal binary combining device + simulator architectures
  - [ ] Use cargo with --release flag for optimizations
  - [ ] Enable LTO (Link-Time Optimization) for performance
  - [ ] Make script executable (chmod +x)

- [ ] Create Android build script (AC: #1, #4)
  - [ ] Create build-android.sh in rust/ directory
  - [ ] Configure script to compile for arm64-v8a architecture
  - [ ] Configure script to compile for armeabi-v7a architecture
  - [ ] Configure script to compile for x86_64 architecture
  - [ ] Use cargo with --release flag for optimizations
  - [ ] Enable LTO (Link-Time Optimization) for performance
  - [ ] Make script executable (chmod +x)

- [ ] Configure iOS Podspec (AC: #2, #5)
  - [ ] Update LoqaAudioDsp.podspec to include libloqua_voice_dsp.a
  - [ ] Create ios/RustFFI/ directory
  - [ ] Configure Podspec to link the static library
  - [ ] Verify library path: ios/RustFFI/libloqua_voice_dsp.a

- [ ] Configure Android build.gradle (AC: #3, #5)
  - [ ] Update build.gradle to include .so libraries
  - [ ] Create android/src/main/jniLibs/ directory structure
  - [ ] Create subdirectories for each architecture (arm64-v8a, armeabi-v7a, x86_64)
  - [ ] Configure gradle to package the libraries
  - [ ] Verify library paths

- [ ] Test build process
  - [ ] Run build-ios.sh and verify successful compilation
  - [ ] Run build-android.sh and verify successful compilation
  - [ ] Verify compiled libraries exist in correct locations
  - [ ] Verify libraries are properly linked in native builds

## Dev Notes

### Learnings from Previous Story

**From Story 1-1-initialize-expo-module-project-structure (Status: drafted)**

- **Project Structure Created**: Expo module scaffolding completed with ios/ and android/ directories
- **Native Module Foundation**: Swift and Kotlin modules initialized and ready for Rust integration
- **Build System Ready**: Package.json, tsconfig, ESLint, Prettier all configured
- **Next Step**: This story builds on the foundation by adding Rust compilation layer

[Source: stories/1-1-initialize-expo-module-project-structure.md]

### Architecture Patterns and Constraints

**Rust Build Configuration:**
- Reference VoicelineDSP v0.2.0 for Rust build patterns ([Architecture - Rust FFI/JNI Integration](../architecture.md#rust-ffijni-integration))
- Use cargo with --release flag for optimizations
- Enable LTO (Link-Time Optimization) for performance targets (<5ms)

**Platform-Specific Requirements:**

**iOS:**
- Requires universal binary for device + simulator
- Target architectures: arm64 (devices), x86_64 (Intel simulators)
- Output: Static library (.a file)
- Location: ios/RustFFI/libloqua_voice_dsp.a

**Android:**
- Requires separate .so for each architecture
- Target architectures: arm64-v8a, armeabi-v7a, x86_64
- Output: Shared libraries (.so files)
- Location: android/src/main/jniLibs/{arch}/libloqua_voice_dsp.so

**Build Optimization:**
- Release mode compilation mandatory for performance
- LTO enabled for additional performance gains
- Target: <5ms processing latency (from [PRD - Performance NFR1](../prd.md#performance))

### Project Structure Notes

Expected directory structure after this story:

```
@loqalabs/loqa-audio-dsp/
├── rust/                           # Rust build configuration
│   ├── Cargo.toml                  # Rust dependencies (loqa-voice-dsp)
│   ├── build-ios.sh                # iOS library build script
│   └── build-android.sh            # Android library build script
├── ios/
│   └── RustFFI/                    # Created by this story
│       └── libloqua_voice_dsp.a    # Compiled Rust library (iOS)
└── android/
    └── src/main/jniLibs/           # Created by this story
        ├── arm64-v8a/
        │   └── libloqua_voice_dsp.so
        ├── armeabi-v7a/
        │   └── libloqua_voice_dsp.so
        └── x86_64/
            └── libloqua_voice_dsp.so
```

**Alignment Notes:**
- Follows architecture defined in [Architecture - Rust Build](../architecture.md#project-structure)
- Integrates with existing ios/ and android/ directories from Story 1.1
- Prepares foundation for FFI/JNI bindings in Stories 1.3 and 1.4

**Prerequisites:**
- Story 1.1 completed (Expo module structure must exist)

**Dependencies:**
- Rust toolchain installed (rustc, cargo)
- iOS: Xcode command line tools
- Android: NDK installed

**Testing Strategy:**
- Run build scripts manually to verify compilation
- Check that libraries are created in correct locations
- Verify libraries are properly formatted (file command)
- Confirm libraries are included in iOS/Android builds

### References

- [Architecture Document - Rust FFI/JNI Integration](../architecture.md#rust-ffijni-integration) - Build patterns and requirements
- [Architecture Document - Project Structure](../architecture.md#project-structure) - rust/ directory layout
- [Architecture Document - Technology Stack](../architecture.md#technology-stack-details) - Rust version and build tools
- [PRD - Performance NFR1-NFR4](../prd.md#performance) - Performance targets requiring optimized builds
- [Epics Document - Story 1.2](../epics.md#story-12-set-up-rust-build-infrastructure) - Full acceptance criteria and technical notes

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/1-2-set-up-rust-build-infrastructure.context.xml](./1-2-set-up-rust-build-infrastructure.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
