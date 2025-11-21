# Story 2.4: Implement TypeScript Input Validation

Status: ready-for-dev

## Story

As a developer,
I want comprehensive input validation,
so that invalid inputs are caught early with clear error messages.

## Acceptance Criteria

1. **Given** validation.ts exists **When** I implement functions **Then** validateAudioBuffer, validateSampleRate, validateFFTSize implemented
2. **Given** validateAudioBuffer called **When** buffer invalid **Then** throws ValidationError with details
3. **Given** validateSampleRate called **When** rate invalid **Then** throws ValidationError with range info
4. **Given** validateFFTSize called **When** not power of 2 **Then** throws ValidationError
5. **Given** errors thrown **When** caught **Then** includes invalid value and expected range

## Tasks / Subtasks

- [ ] Implement validateAudioBuffer (null, empty, NaN, Infinity, max size checks)
- [ ] Implement validateSampleRate (integer, 8000-48000 Hz)  
- [ ] Implement validateFFTSize (integer, power of 2, 256-8192)
- [ ] Write unit tests in __tests__/validation.test.ts
- [ ] Verify all tests pass

## Dev Notes

### Learnings from Previous Story

**From Story 2-3-implement-android-computefft-native-function (Status: drafted)**
- **Native Validation**: Both iOS and Android validate inputs
- **TypeScript Layer**: Should validate BEFORE calling native (fail fast)
- **Error Messages**: Must be descriptive and actionable

[Source: stories/2-3-implement-android-computefft-native-function.md]

### References

- [Architecture - Input Validation](../architecture.md#input-validation)
- [PRD - FR32-FR39](../prd.md#typescript-api-layer)
- [Epics - Story 2.4](../epics.md#story-24-implement-typescript-input-validation)

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/2-4-implement-typescript-input-validation.context.xml](./2-4-implement-typescript-input-validation.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
