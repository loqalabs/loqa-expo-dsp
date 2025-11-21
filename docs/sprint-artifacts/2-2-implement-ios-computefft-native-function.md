# Story 2.2: Implement iOS computeFFT Native Function

Status: ready-for-dev

## Story

As a developer,
I want computeFFT working on iOS,
so that iOS apps can perform frequency analysis.

## Acceptance Criteria

1. **Given** Rust FFT bindings exist
   **When** I implement Swift computeFFT
   **Then** LoqaAudioDspModule.swift exposes async function:
   ```swift
   AsyncFunction("computeFFT") { (buffer: [Float], options: [String: Any]) -> [String: Any]
   ```

2. **Given** the function is implemented
   **When** I validate inputs
   **Then** function validates inputs before calling Rust:
   - Buffer is not empty
   - FFT size (from options or buffer.length) is power of 2
   - FFT size is between 256 and 8192

3. **Given** inputs are valid
   **When** I call Rust FFT
   **Then** function marshals Swift Float array to UnsafePointer for Rust

4. **Given** Rust returns results
   **When** I process the return value
   **Then** function copies Rust result to Swift array before freeing Rust memory (using defer)

5. **Given** computation completes
   **When** I return results
   **Then** function returns dictionary with:
   - "magnitude": Float array (length = fftSize / 2)
   - "frequencies": Float array of frequency bin centers

6. **Given** errors occur
   **When** I handle errors
   **Then** function throws descriptive NSError

## Tasks / Subtasks

- [ ] Update LoqaAudioDspModule.swift with computeFFT (AC: #1)
  - [ ] Replace placeholder with actual implementation
  - [ ] Define AsyncFunction("computeFFT")
  - [ ] Accept buffer: [Float] parameter
  - [ ] Accept options: [String: Any] parameter
  - [ ] Return [String: Any] dictionary

- [ ] Implement input validation (AC: #2)
  - [ ] Check buffer.isEmpty() → throw error
  - [ ] Extract fftSize from options or default to buffer.count
  - [ ] Validate fftSize is power of 2: (fftSize & (fftSize - 1)) == 0
  - [ ] Validate fftSize >= 256 && fftSize <= 8192
  - [ ] Extract windowType from options or default to "hanning"
  - [ ] Map windowType string to integer (none=0, hanning=1, hamming=2, blackman=3)

- [ ] Call Rust FFT function (AC: #3, #4)
  - [ ] Import RustBridge functions
  - [ ] Declare variables for Rust pointers
  - [ ] Use defer block to guarantee memory cleanup
  - [ ] Call buffer.withUnsafeBufferPointer for zero-copy
  - [ ] Call compute_fft_rust(bufferPtr, length, fftSize, windowType)
  - [ ] Check for null result (validation failure)
  - [ ] Copy result to Swift array: Array(UnsafeBufferPointer(start: result, count: fftSize/2))
  - [ ] Call free_fft_result_rust(result) in defer block

- [ ] Build frequency array and return (AC: #5)
  - [ ] Calculate sample rate (default 44100 Hz from options)
  - [ ] Build frequencies array: freq[i] = (sampleRate / fftSize) * i
  - [ ] Create result dictionary with "magnitude" and "frequencies"
  - [ ] Return dictionary

- [ ] Implement error handling (AC: #6)
  - [ ] Throw NSError for invalid buffer
  - [ ] Throw NSError for invalid fftSize
  - [ ] Throw NSError if Rust returns null
  - [ ] Include descriptive error messages
  - [ ] Include error codes (e.g., "VALIDATION_ERROR", "FFT_ERROR")

- [ ] Test iOS implementation
  - [ ] Build iOS module successfully
  - [ ] Test with example buffer (e.g., sine wave)
  - [ ] Verify magnitude spectrum is correct
  - [ ] Verify frequencies array is correct
  - [ ] Test error handling with invalid inputs
  - [ ] Use Memory Graph Debugger to verify no leaks

## Dev Notes

### Learnings from Previous Story

**From Story 2-1-implement-fft-rust-function-bindings (Status: drafted)**

- **Rust FFI Functions Available**: compute_fft_rust and free_fft_result_rust exported
- **Window Types Defined**: 0=none, 1=hanning, 2=hamming, 3=blackman
- **Memory Management Pattern**: Rust allocates → Swift copies → Swift frees Rust memory
- **Validation in Rust**: Power-of-2 and range checks, returns null on failure
- **Next Step**: Implement Swift wrapper that calls these Rust functions safely

[Source: stories/2-1-implement-fft-rust-function-bindings.md]

### Architecture Patterns and Constraints

**iOS Swift FFI Pattern:**

From [Architecture - iOS Swift FFI](../architecture.md#integration-points):

```swift
public func computeFFT(buffer: [Float], fftSize: Int, windowType: Int) throws -> [Float] {
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
            Int32(fftSize),
            Int32(windowType)
        )
    }

    guard let result = rustResult else {
        throw NSError(domain: "LoqaAudioDsp", code: -1,
                     userInfo: [NSLocalizedDescriptionKey: "FFT computation failed"])
    }

    // Copy to Swift array before freeing
    let output = Array(UnsafeBufferPointer(
        start: result,
        count: fftSize / 2
    ))

    return output
}
```

**Expo Modules API Integration:**

```swift
AsyncFunction("computeFFT") { (buffer: [Float], options: [String: Any]) -> [String: Any] in
    let fftSize = options["fftSize"] as? Int ?? buffer.count
    let windowType = mapWindowType(options["windowType"] as? String ?? "hanning")
    let sampleRate = options["sampleRate"] as? Double ?? 44100.0

    let magnitude = try computeFFT(buffer: buffer, fftSize: fftSize, windowType: windowType)
    let frequencies = calculateFrequencies(fftSize: fftSize, sampleRate: sampleRate)

    return [
        "magnitude": magnitude,
        "frequencies": frequencies
    ]
}
```

**Memory Safety Rules:**
- Use defer blocks to guarantee Rust memory is freed
- Copy data from Rust → Swift before freeing
- Never hold references to Rust memory beyond function scope
- Use withUnsafeBufferPointer for zero-copy input

**Performance:**
- Target: <5ms for 2048-sample buffer
- Use .userInitiated QoS for async processing
- Minimize memory allocations

### Project Structure Notes

Files modified by this story:

```
ios/
├── RustFFI/
│   └── RustBridge.swift    # MODIFIED: Add FFT function declarations
└── LoqaAudioDspModule.swift # MODIFIED: Implement computeFFT
```

**Alignment Notes:**
- Integrates with Rust FFI from Story 2.1
- Uses memory management patterns from Story 1.3
- Follows Expo Modules API from Story 1.1

**Prerequisites:**
- Story 1.3: Swift FFI scaffold in place
- Story 2.1: Rust FFT functions available

**Testing Strategy:**
- Use synthetic sine wave for predictable FFT results
- Verify peak appears at expected frequency
- Test with various window types
- Verify memory management with Xcode tools

### References

- [Architecture Document - iOS Swift FFI](../architecture.md#integration-points) - FFI pattern
- [Architecture Document - Memory Management](../architecture.md#memory-management-at-ffijni-boundary) - defer blocks
- [Architecture Document - Expo Modules API](../architecture.md#native-module-interface) - AsyncFunction pattern
- [PRD - FR17-FR20](../prd.md#native-platform-integration) - iOS platform requirements
- [Epics Document - Story 2.2](../epics.md#story-22-implement-ios-computefft-native-function) - Full acceptance criteria

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/2-2-implement-ios-computefft-native-function.context.xml](./2-2-implement-ios-computefft-native-function.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
