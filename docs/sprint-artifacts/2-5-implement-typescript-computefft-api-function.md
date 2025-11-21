# Story 2.5: Implement TypeScript computeFFT API Function

Status: ready-for-dev

## Story

As a developer,
I want a clean TypeScript computeFFT API,
so that users have a typed, validated interface to FFT analysis.

## Acceptance Criteria

1. **Given** native and validation exist **When** I implement src/computeFFT.ts **Then** function signature matches specification
2. **Given** function called **When** validating **Then** validates audioBuffer using validateAudioBuffer()
3. **Given** validation passes **When** processing **Then** extracts fftSize, windowType with defaults
4. **Given** ready to call native **When** marshalling **Then** converts Float32Array to number[] for bridge
5. **Given** native returns **When** processing result **Then** converts to FFTResult with Float32Array
6. **Given** errors occur **When** caught **Then** wraps native errors in NativeModuleError with context

## Tasks / Subtasks

- [ ] Create src/computeFFT.ts
- [ ] Implement input validation
- [ ] Extract and validate options (fftSize, windowType, sampleRate)
- [ ] Call LoqaAudioDspModule.computeFFT
- [ ] Convert result to FFTResult type
- [ ] Wrap errors in NativeModuleError
- [ ] Add debug logging
- [ ] Export from src/index.ts

## Dev Notes

### Learnings from Previous Story

**From Story 2-4-implement-typescript-input-validation (Status: drafted)**
- **Validation Functions Ready**: validateAudioBuffer, validateSampleRate, validateFFTSize available
- **Error Classes Ready**: ValidationError for input errors, NativeModuleError for native failures
- **Next Step**: Use these utilities in computeFFT implementation

[Source: stories/2-4-implement-typescript-input-validation.md]

### References

- [Architecture - TypeScript API](../architecture.md#api-contracts)
- [PRD - FR28-FR31](../prd.md#typescript-api-layer)
- [Epics - Story 2.5](../epics.md#story-25-implement-typescript-computefft-api-function)

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/2-5-implement-typescript-computefft-api-function.context.xml](./2-5-implement-typescript-computefft-api-function.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
