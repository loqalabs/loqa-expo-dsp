# Story 3.3: Implement iOS and Android Native Functions for Pitch and Formants

Status: ready-for-dev

## Story
As a developer, I want detectPitch and extractFormants working on both platforms, so that voice analysis capabilities work cross-platform.

## Acceptance Criteria
1. **Given** Rust bindings exist **When** implementing iOS **Then** exposes AsyncFunction("detectPitch") and AsyncFunction("extractFormants")
2. **Given** Rust bindings exist **When** implementing Android **Then** exposes async functions via Kotlin JNI
3. **Given** functions implemented **When** validating **Then** both platforms validate inputs (buffer, sample rate, optional params)
4. **Given** errors **When** handling **Then** both platforms handle errors consistently
5. **Given** memory **When** managing **Then** follows established patterns (defer on iOS, automatic on Android)

## Tasks / Subtasks
- [ ] Update iOS LoqaAudioDspModule.swift with detectPitch and extractFormants
- [ ] Update Android LoqaAudioDspModule.kt with detectPitch and extractFormants
- [ ] Implement input validation on both platforms
- [ ] Handle memory management per platform
- [ ] Test on iOS and Android devices

## Dev Notes
### Learnings from Previous Story
**From Story 3-2**: Both Rust functions ready. Implement native wrappers following FFT pattern from Epic 2.

### References
- [Architecture - Native Integration](../architecture.md#native-platform-integration)
- [PRD - FR17-FR27](../prd.md#native-platform-integration)
- [Epics - Story 3.3](../epics.md#story-33-implement-ios-and-android-native-functions-for-pitch-and-formants)

## Dev Agent Record
### Context Reference

- [docs/sprint-artifacts/3-3-implement-ios-and-android-native-functions-for-pitch-and-formants.context.xml](./3-3-implement-ios-and-android-native-functions-for-pitch-and-formants.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
