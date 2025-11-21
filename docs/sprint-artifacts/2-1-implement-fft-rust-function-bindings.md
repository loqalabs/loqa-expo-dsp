# Story 2.1: Implement FFT Rust Function Bindings

Status: ready-for-dev

## Story

As a developer,
I want the loqa-voice-dsp FFT function exposed via FFI/JNI,
so that iOS and Android can call Rust FFT computation.

## Acceptance Criteria

1. **Given** the Rust loqa-voice-dsp crate is compiled
   **When** I expose FFT functions for FFI/JNI
   **Then** Rust exports the following C-compatible functions:
   - `compute_fft_rust(buffer: *const f32, length: i32, fft_size: i32, window_type: i32) -> *mut f32`
   - `free_fft_result_rust(ptr: *mut f32)`
   - Functions use #[no_mangle] and extern "C" for C ABI compatibility

2. **Given** FFT functions are exposed
   **When** I check the function parameters
   **Then** FFT function accepts window type parameter (0=none, 1=hanning, 2=hamming, 3=blackman)

3. **Given** FFT computation completes
   **When** I examine the result
   **Then** FFT result is heap-allocated Rust Vec converted to raw pointer for FFI

4. **Given** FFI functions are exported
   **When** I review memory management
   **Then** calling code must call free function to prevent memory leaks

5. **Given** FFT parameters are provided
   **When** I validate inputs
   **Then** FFT size is validated to be power of 2 in Rust code

## Tasks / Subtasks

- [ ] Create Rust FFI wrapper module (AC: #1)
  - [ ] Create rust/src/lib.rs or ffi.rs for FFI exports
  - [ ] Import FFT function from loqa-voice-dsp crate
  - [ ] Add #[no_mangle] attribute to prevent name mangling
  - [ ] Add extern "C" for C ABI compatibility
  - [ ] Define compute_fft_rust function signature
  - [ ] Define free_fft_result_rust function signature

- [ ] Implement compute_fft_rust (AC: #1, #2, #3, #5)
  - [ ] Accept buffer as *const f32 pointer
  - [ ] Accept length as i32
  - [ ] Accept fft_size as i32
  - [ ] Accept window_type as i32 (0=none, 1=hanning, 2=hamming, 3=blackman)
  - [ ] Convert raw pointer to Rust slice
  - [ ] Validate fft_size is power of 2
  - [ ] Call loqa-voice-dsp FFT function with appropriate window
  - [ ] Return magnitude spectrum (length = fft_size / 2)
  - [ ] Convert Result Vec<f32> to raw pointer: Box::into_raw(vec.into_boxed_slice())
  - [ ] Return pointer for FFI

- [ ] Implement free_fft_result_rust (AC: #4)
  - [ ] Accept *mut f32 pointer
  - [ ] Convert back to Box<[f32]>
  - [ ] Drop/deallocate the box
  - [ ] Ensure no double-free issues

- [ ] Add input validation (AC: #5)
  - [ ] Validate buffer pointer is not null
  - [ ] Validate length > 0
  - [ ] Validate fft_size is power of 2: (n & (n - 1)) == 0
  - [ ] Validate fft_size >= 256 and <= 8192
  - [ ] Validate window_type is in valid range (0-3)
  - [ ] Return null pointer on validation failure

- [ ] Test Rust FFI bindings
  - [ ] Write Rust unit tests for compute_fft_rust
  - [ ] Test with various buffer sizes
  - [ ] Test power-of-2 validation
  - [ ] Test window type parameter
  - [ ] Verify memory is properly allocated/freed
  - [ ] Run cargo test successfully

- [ ] Build and verify libraries
  - [ ] Run build-ios.sh to compile for iOS
  - [ ] Run build-android.sh to compile for Android
  - [ ] Verify libraries are created in correct locations
  - [ ] Verify FFI symbols are exported (nm command)

## Dev Notes

### Learnings from Previous Story

**From Story 1-8-create-package-configuration-for-npm (Status: drafted)**

- **Epic 1 Complete**: All foundation infrastructure in place
- **Rust Build Scripts Ready**: build-ios.sh and build-android.sh configured for release builds with LTO
- **Native Modules Scaffolded**: iOS Swift and Android Kotlin modules have placeholder FFI/JNI bindings
- **Next Step**: Implement actual Rust DSP functions starting with FFT

[Source: stories/1-8-create-package-configuration-for-npm.md]

### Architecture Patterns and Constraints

**FFI/JNI Memory Management Pattern:**

From [Architecture - Memory Management at FFI/JNI Boundary](../architecture.md#memory-management-at-ffijni-boundary):

**Critical**: Rust allocates → Returns raw pointer → Swift/Kotlin copies → Swift/Kotlin frees Rust memory immediately

**Rust FFI Pattern:**

```rust
use std::slice;
use std::boxed::Box;

#[no_mangle]
pub extern "C" fn compute_fft_rust(
    buffer: *const f32,
    length: i32,
    fft_size: i32,
    window_type: i32
) -> *mut f32 {
    // Validate inputs
    if buffer.is_null() || length <= 0 {
        return std::ptr::null_mut();
    }

    let fft_size = fft_size as usize;
    if (fft_size & (fft_size - 1)) != 0 {
        return std::ptr::null_mut(); // Not power of 2
    }

    // Convert raw pointer to slice (unsafe)
    let input = unsafe {
        slice::from_raw_parts(buffer, length as usize)
    };

    // Call loqa-voice-dsp FFT
    let result = match window_type {
        1 => loqa_voice_dsp::compute_fft(input, fft_size, WindowType::Hanning),
        2 => loqa_voice_dsp::compute_fft(input, fft_size, WindowType::Hamming),
        3 => loqa_voice_dsp::compute_fft(input, fft_size, WindowType::Blackman),
        _ => loqa_voice_dsp::compute_fft(input, fft_size, WindowType::None),
    };

    // Convert to raw pointer
    Box::into_raw(result.into_boxed_slice()) as *mut f32
}

#[no_mangle]
pub extern "C" fn free_fft_result_rust(ptr: *mut f32) {
    if !ptr.is_null() {
        unsafe {
            drop(Box::from_raw(ptr));
        }
    }
}
```

**Performance Requirements:**
- From [PRD - NFR1](../prd.md#performance): <5ms processing for 2048-sample buffer
- Requires release mode compilation with LTO (already configured in build scripts)
- Use loqa-voice-dsp optimized FFT implementation

**Window Types:**
- 0 = None (rectangular window)
- 1 = Hanning
- 2 = Hamming
- 3 = Blackman

**FFT Output:**
- Magnitude spectrum only (phase optional in future)
- Length = fft_size / 2
- Frequency bins from 0 to Nyquist frequency

### Project Structure Notes

Files created/modified by this story:

```
rust/
├── Cargo.toml              # MODIFIED: Ensure loqa-voice-dsp dependency
├── src/
│   └── lib.rs              # NEW or MODIFIED: FFI function exports
└── (build scripts unchanged from Story 1.2)
```

**Alignment Notes:**
- Uses loqa-voice-dsp crate as specified in Architecture
- Follows FFI memory management patterns established in Epic 1
- Prepares for iOS (Story 2.2) and Android (Story 2.3) native integration

**Prerequisites:**
- Story 1.2: Rust build infrastructure must be in place
- loqa-voice-dsp crate available and compatible

**Testing Strategy:**
- Rust unit tests for FFI functions
- Test power-of-2 validation
- Test window type parameter handling
- Verify no memory leaks with valgrind (optional)
- Integration testing happens in Stories 2.2 and 2.3

### References

- [Architecture Document - Rust FFI/JNI Integration](../architecture.md#rust-ffijni-integration) - FFI patterns
- [Architecture Document - Memory Management](../architecture.md#memory-management-at-ffijni-boundary) - Memory safety
- [PRD - FR1-FR4](../prd.md#core-dsp-analysis-capabilities) - FFT functional requirements
- [PRD - NFR1](../prd.md#performance) - Performance requirements
- [Epics Document - Story 2.1](../epics.md#story-21-implement-fft-rust-function-bindings) - Full acceptance criteria

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/2-1-implement-fft-rust-function-bindings.context.xml](./2-1-implement-fft-rust-function-bindings.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
