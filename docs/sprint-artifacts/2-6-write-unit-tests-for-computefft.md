# Story 2.6: Write Unit Tests for computeFFT

Status: ready-for-dev

## Story

As a developer,
I want comprehensive tests for computeFFT,
so that the function is reliable across platforms.

## Acceptance Criteria

1. **Given** computeFFT implemented **When** writing tests **Then** test cases cover valid inputs, validation errors, cross-platform behavior
2. **Given** valid inputs **When** testing **Then** computes FFT correctly, returns proper magnitude/frequencies, accepts Float32Array and number[]
3. **Given** invalid inputs **When** testing **Then** throws ValidationError for empty buffer, large buffer, NaN, non-power-of-2
4. **Given** native tests **When** running **Then** iOS XCTest and Android JUnit validate FFI/JNI bindings
5. **Given** all tests **When** executed **Then** pass on TypeScript, iOS, and Android

## Tasks / Subtasks

- [ ] Write TypeScript tests in __tests__/computeFFT.test.ts (valid inputs, validation errors)
- [ ] Write iOS tests in ios/Tests/FFTTests.swift (native FFT validation)
- [ ] Write Android tests in android/src/test/.../FFTTests.kt (JNI validation)
- [ ] Use mock sine wave data for predictable results
- [ ] Run npm test, iOS tests, Android tests
- [ ] Verify all tests pass

## Dev Notes

### Learnings from Previous Story

**From Story 2-5-implement-typescript-computefft-api-function (Status: drafted)**
- **computeFFT Implemented**: Full TypeScript API with validation and error handling
- **Test Infrastructure Ready**: Jest, XCTest, JUnit configured from Epic 1
- **Next Step**: Write comprehensive tests to validate implementation

[Source: stories/2-5-implement-typescript-computefft-api-function.md]

### References

- [Architecture - Testing](../architecture.md#testing--quality-tools)
- [PRD - Testing Requirements](../prd.md#testing--validation)
- [Epics - Story 2.6](../epics.md#story-26-write-unit-tests-for-computefft)

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/2-6-write-unit-tests-for-computefft.context.xml](./2-6-write-unit-tests-for-computefft.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
