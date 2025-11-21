# Story 3.5: Write Unit Tests for Pitch and Formant Functions

Status: ready-for-dev

## Story
As a developer, I want comprehensive tests for voice analysis functions, so that detectPitch and extractFormants are reliable.

## Acceptance Criteria
1. **Given** functions implemented **When** writing tests **Then** TypeScript tests cover pitch detection and formant extraction
2. **Given** pitch tests **When** running **Then** detects pitch from sine wave, returns confidence, identifies unvoiced, validates sample rate
3. **Given** formant tests **When** running **Then** extracts formants from vowels, returns F1/F2/F3 in expected ranges, validates input
4. **Given** native tests **When** running **Then** iOS XCTest and Android JUnit validate FFI/JNI bindings
5. **Given** all tests **When** executed **Then** pass on TypeScript, iOS, and Android

## Tasks / Subtasks
- [ ] Write __tests__/detectPitch.test.ts
- [ ] Write __tests__/extractFormants.test.ts
- [ ] Write iOS tests for pitch and formants
- [ ] Write Android tests for pitch and formants
- [ ] Use synthetic audio (sine waves, vowel samples)
- [ ] Run all tests and verify they pass

## Dev Notes
### Learnings from Previous Story
**From Story 3-4**: TypeScript APIs complete. Test following Epic 2 pattern with synthetic audio data.

### References
- [Architecture - Testing](../architecture.md#testing--quality-tools)
- [Epics - Story 3.5](../epics.md#story-35-write-unit-tests-for-pitch-and-formant-functions)

## Dev Agent Record
### Context Reference

- [docs/sprint-artifacts/3-5-write-unit-tests-for-pitch-and-formant-functions.context.xml](./3-5-write-unit-tests-for-pitch-and-formant-functions.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
