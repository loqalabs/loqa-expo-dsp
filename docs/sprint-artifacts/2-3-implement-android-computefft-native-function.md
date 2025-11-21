# Story 2.3: Implement Android computeFFT Native Function

Status: ready-for-dev

## Story

As a developer,
I want computeFFT working on Android,
so that Android apps can perform frequency analysis.

## Acceptance Criteria

1. **Given** Rust FFT bindings exist **When** I implement Kotlin computeFFT **Then** LoqaAudioDspModule.kt exposes async function with proper signature
2. **Given** the function is implemented **When** I validate inputs **Then** validates buffer not empty, fftSize power of 2, range 256-8192
3. **Given** inputs valid **When** I call Rust **Then** calls RustBridge.computeFFT(buffer, fftSize, windowType)
4. **Given** Rust returns **When** I process results **Then** JNI handles FloatArray marshalling automatically
5. **Given** computation completes **When** I return **Then** returns map with "magnitude" and "frequencies"
6. **Given** errors occur **When** handled **Then** catches exceptions and rejects Promise with error code and message

## Tasks / Subtasks

- [ ] Update LoqaAudioDspModule.kt with computeFFT
- [ ] Implement input validation (buffer, fftSize)
- [ ] Call RustBridge.computeFFT via JNI
- [ ] Build frequencies array
- [ ] Return result map
- [ ] Implement error handling with Promise.reject
- [ ] Test on Android device/emulator

## Dev Notes

### Learnings from Previous Story

**From Story 2-2-implement-ios-computefft-native-function (Status: drafted)**
- **iOS FFT Working**: Swift implementation complete with proper memory management
- **Cross-Platform Pattern**: Android should mirror iOS API and behavior
- **Validation Rules**: Same validation as iOS (power-of-2, 256-8192 range)

[Source: stories/2-2-implement-ios-computefft-native-function.md]

### References

- [Architecture - Android Kotlin JNI](../architecture.md#integration-points)
- [PRD - FR21-FR24](../prd.md#native-platform-integration)
- [Epics - Story 2.3](../epics.md#story-23-implement-android-computefft-native-function)

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/2-3-implement-android-computefft-native-function.context.xml](./2-3-implement-android-computefft-native-function.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
