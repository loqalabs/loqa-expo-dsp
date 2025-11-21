# Story 1.4: Implement Android Kotlin JNI Bindings Scaffold

Status: ready-for-dev

## Story

As a developer,
I want Kotlin JNI bindings to Rust DSP functions,
so that Android can call Rust loqa-voice-dsp functions safely.

## Acceptance Criteria

1. **Given** Rust libraries are compiled for Android
   **When** I create Kotlin JNI bridge code
   **Then** android/src/main/java/com/loqalabs/loquaaudiodsp/RustJNI/RustBridge.kt is created with:
   - JNI external function declarations for Rust functions
   - System.loadLibrary("loqua_voice_dsp") initialization
   - Kotlin wrapper functions that handle array marshalling
   - Error handling for JNI failures

2. **Given** Kotlin JNI bridge exists
   **When** I update LoqaAudioDspModule.kt
   **Then** it implements Expo Module Definition protocol

3. **Given** the module is configured
   **When** I check the module exports
   **Then** it exposes placeholder async functions for future DSP operations

4. **Given** JNI bindings are implemented
   **When** I review memory management
   **Then** JNI handles primitive array marshalling automatically (FloatArray)

## Tasks / Subtasks

- [ ] Create RustBridge.kt (AC: #1)
  - [ ] Create android/src/main/java/com/loqalabs/loquaaudiodsp/RustJNI/ directory
  - [ ] Create RustBridge.kt file
  - [ ] Add System.loadLibrary("loqua_voice_dsp") in init block
  - [ ] Declare external JNI function signatures for Rust functions
  - [ ] Implement placeholder Kotlin wrappers (will be completed in Epic 2)
  - [ ] Add error handling for JNI call failures
  - [ ] Document that JNI handles FloatArray marshalling automatically

- [ ] Update LoqaAudioDspModule.kt (AC: #2, #3)
  - [ ] Import RustBridge
  - [ ] Implement Expo Module Definition protocol
  - [ ] Add placeholder async function stubs for:
    - computeFFT
    - detectPitch
    - extractFormants
    - analyzeSpectrum
  - [ ] Use GlobalScope.launch(Dispatchers.Default) for async processing
  - [ ] Add try-catch with Promise rejection

- [ ] Configure JNI integration (AC: #4)
  - [ ] Verify build.gradle includes JNI configuration
  - [ ] Ensure .so libraries are packaged correctly
  - [ ] Test System.loadLibrary succeeds
  - [ ] Document automatic primitive array marshalling

- [ ] Verify Android build integration
  - [ ] Ensure RustBridge.kt compiles without errors
  - [ ] Verify build.gradle includes RustJNI package
  - [ ] Test that module initializes successfully
  - [ ] Confirm library loading works

## Dev Notes

### Learnings from Previous Story

**From Story 1-3-implement-ios-swift-ffi-bindings-scaffold (Status: drafted)**

- **iOS FFI Patterns Established**: Memory management with defer blocks, UnsafePointer usage
- **Module Structure Pattern**: Expo Module Definition protocol implementation
- **Placeholder Functions**: Pattern for stubbing DSP functions until Epic 2
- **Cross-Platform Consistency**: Android implementation should mirror iOS patterns where applicable

[Source: stories/1-3-implement-ios-swift-ffi-bindings-scaffold.md]

### Architecture Patterns and Constraints

**JNI Integration Pattern:**

From [Architecture - Android Kotlin JNI](../architecture.md#integration-points):

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
    GlobalScope.launch(Dispatchers.Default) {
        try {
            val result = RustBridge.computeFFT(buffer, fftSize)
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("FFT_ERROR", e.message, e)
        }
    }
}
```

**JNI Memory Management:**
- JNI automatically manages primitive arrays - simpler than iOS FFI
- Use GlobalScope.launch(Dispatchers.Default) for async processing
- All native calls wrapped in try-catch with Promise rejection
- No manual memory management needed for FloatArray

**Expo Modules API:**
- Use @ExpoMethod annotation for exported functions
- Implement ModuleDefinition for Expo integration
- Promise-based API for async operations

### Project Structure Notes

Files created by this story:

```
android/src/main/java/com/loqalabs/loquaaudiodsp/
├── RustJNI/                          # NEW directory
│   └── RustBridge.kt                 # NEW: JNI declarations
└── LoqaAudioDspModule.kt             # MODIFIED: Add Expo module implementation
```

**Alignment Notes:**
- Integrates with Rust libraries from Story 1.2
- Mirrors iOS implementation from Story 1.3 for cross-platform consistency
- Follows Expo Modules API conventions

**Prerequisites:**
- Story 1.1: Expo module structure
- Story 1.2: Rust libraries compiled for Android
- Story 1.3: iOS implementation provides pattern reference

**Testing Strategy:**
- Verify Kotlin compiles without errors
- Test System.loadLibrary succeeds (library found)
- Confirm placeholder functions can be called
- Verify Promise-based async pattern works

### References

- [Architecture Document - Android Kotlin JNI](../architecture.md#integration-points) - JNI integration pattern
- [Architecture Document - Native Module Interface](../architecture.md#native-module-interface) - Expo Modules API for Android
- [Architecture Document - Memory Management](../architecture.md#memory-management-at-ffijni-boundary) - JNI automatic memory handling
- [PRD - FR22-FR23](../prd.md#native-platform-integration) - Kotlin JNI requirements and memory safety
- [Epics Document - Story 1.4](../epics.md#story-14-implement-android-kotlin-jni-bindings-scaffold) - Full acceptance criteria and technical notes

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/1-4-implement-android-kotlin-jni-bindings-scaffold.context.xml](./1-4-implement-android-kotlin-jni-bindings-scaffold.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
