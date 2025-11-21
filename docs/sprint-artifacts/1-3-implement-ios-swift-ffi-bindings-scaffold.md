# Story 1.3: Implement iOS Swift FFI Bindings Scaffold

Status: ready-for-dev

## Story

As a developer,
I want Swift FFI bindings to Rust DSP functions,
so that iOS can call Rust loqa-voice-dsp functions safely.

## Acceptance Criteria

1. **Given** Rust libraries are compiled for iOS
   **When** I create Swift FFI bridge code
   **Then** ios/RustFFI/RustBridge.swift is created with:
   - FFI function declarations using @_silgen_name for Rust functions
   - Swift wrapper functions that handle memory marshalling
   - Proper use of UnsafePointer for array passing
   - defer blocks to guarantee Rust memory deallocation
   - Error handling for FFI failures

2. **Given** Swift FFI bridge exists
   **When** I update LoqaAudioDspModule.swift
   **Then** it implements Expo Module Definition protocol

3. **Given** the module is configured
   **When** I check the module exports
   **Then** it exposes placeholder async functions for future DSP operations

4. **Given** FFI bindings are implemented
   **When** I review memory management
   **Then** memory safety patterns prevent leaks at FFI boundary (as per Architecture)

## Tasks / Subtasks

- [ ] Create RustBridge.swift (AC: #1)
  - [ ] Create ios/RustFFI/RustBridge.swift file
  - [ ] Add FFI function declarations using @_silgen_name
  - [ ] Implement placeholder Swift wrapper for FFT (will be completed in Epic 2)
  - [ ] Use UnsafePointer<Float> for buffer passing
  - [ ] Implement defer blocks for memory cleanup
  - [ ] Add error handling for FFI call failures
  - [ ] Document memory management patterns

- [ ] Update LoqaAudioDspModule.swift (AC: #2, #3)
  - [ ] Import RustBridge
  - [ ] Implement Expo Module Definition protocol
  - [ ] Add placeholder async function stubs for:
    - computeFFT
    - detectPitch
    - extractFormants
    - analyzeSpectrum
  - [ ] Use proper async/Promise patterns
  - [ ] Add basic error handling structure

- [ ] Implement memory safety patterns (AC: #4)
  - [ ] Use defer blocks to guarantee Rust memory is freed
  - [ ] Use UnsafeBufferPointer for zero-copy where possible
  - [ ] Ensure all FFI calls have corresponding free functions
  - [ ] Document: Copy data from Rust → Swift, then immediately free Rust memory
  - [ ] Follow patterns from Architecture document

- [ ] Verify iOS build integration
  - [ ] Ensure RustBridge.swift compiles without errors
  - [ ] Verify Podspec includes RustBridge.swift
  - [ ] Test that module initializes successfully
  - [ ] Confirm no memory leaks with placeholder functions

## Dev Notes

### Learnings from Previous Story

**From Story 1-2-set-up-rust-build-infrastructure (Status: drafted)**

- **Rust Libraries Available**: libloqua_voice_dsp.a compiled and located at ios/RustFFI/
- **Build Infrastructure Ready**: Scripts configured for release mode with LTO
- **Next Step**: Create Swift FFI layer to call these Rust functions

[Source: stories/1-2-set-up-rust-build-infrastructure.md]

### Architecture Patterns and Constraints

**Memory Management at FFI Boundary:**

Critical pattern from [Architecture - Memory Management](../architecture.md#memory-management-at-ffijni-boundary):

```swift
public func computeFFT(buffer: [Float], fftSize: Int) throws -> [Float] {
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
        }
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

**FFI Safety Rules:**
- Use `defer` blocks to guarantee Rust memory is freed
- Use UnsafeBufferPointer for zero-copy where possible
- Never hold references to Rust-allocated memory beyond function scope
- Always copy data from Rust → Swift before freeing
- Follow pattern: Call Rust → Copy result → Free Rust memory

**Expo Modules API Integration:**

From [Architecture - Native Module Interface](../architecture.md#native-module-interface):

```swift
@objc(LoqaAudioDspModule)
public class LoqaAudioDspModule: Module {
    public func definition() -> ModuleDefinition {
        Name("LoqaAudioDsp")

        AsyncFunction("computeFFT") { (buffer: [Float], options: [String: Any]) -> [String: Any] in
            // Implementation
        }
        // ... other functions
    }
}
```

### Project Structure Notes

Files created by this story:

```
ios/
├── RustFFI/
│   ├── RustBridge.swift        # NEW: FFI declarations and wrappers
│   └── libloqua_voice_dsp.a    # Exists from Story 1.2
└── LoqaAudioDspModule.swift    # MODIFIED: Add Expo module implementation
```

**Alignment Notes:**
- Integrates with Rust libraries from Story 1.2
- Prepares Swift layer for Epic 2 (actual DSP function implementation)
- Follows Expo Modules API conventions from Story 1.1

**Prerequisites:**
- Story 1.1: Expo module structure
- Story 1.2: Rust libraries compiled for iOS

**Testing Strategy:**
- Verify Swift compiles without errors
- Test module initialization
- Confirm placeholder functions can be called (even if they return empty results)
- Use Xcode's Memory Graph Debugger to verify no leaks

### References

- [Architecture Document - Memory Management at FFI Boundary](../architecture.md#memory-management-at-ffijni-boundary) - Critical safety patterns
- [Architecture Document - iOS Swift FFI](../architecture.md#integration-points) - FFI integration pattern
- [Architecture Document - Native Module Interface](../architecture.md#native-module-interface) - Expo Modules API implementation
- [PRD - FR18-FR19](../prd.md#native-platform-integration) - Swift FFI requirements and memory safety
- [Epics Document - Story 1.3](../epics.md#story-13-implement-ios-swift-ffi-bindings-scaffold) - Full acceptance criteria and technical notes

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/1-3-implement-ios-swift-ffi-bindings-scaffold.context.xml](./1-3-implement-ios-swift-ffi-bindings-scaffold.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
