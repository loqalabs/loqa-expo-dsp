# Story 4.2: Implement iOS and Android analyzeSpectrum Native Functions

Status: ready-for-dev

## Story
As a developer, I want analyzeSpectrum working on both platforms, so that spectral analysis capabilities work cross-platform.

## Acceptance Criteria
1. **Given** Rust bindings exist **When** implementing iOS **Then** exposes AsyncFunction("analyzeSpectrum") returning SpectrumResult dictionary
2. **Given** Rust bindings exist **When** implementing Android **Then** exposes AsyncFunction("analyzeSpectrum") via Kotlin JNI returning map
3. **Given** functions implemented **When** validating **Then** both platforms validate inputs (buffer, sample rate)
4. **Given** errors **When** handling **Then** both platforms handle errors consistently
5. **Given** memory **When** managing **Then** follows established patterns

## Tasks / Subtasks
- [ ] Update iOS LoqaAudioDspModule.swift with analyzeSpectrum
- [ ] Update Android LoqaAudioDspModule.kt with analyzeSpectrum
- [ ] Implement input validation
- [ ] Handle memory management
- [ ] Test on both platforms

## Dev Notes
### Learnings from Previous Story
**From Story 4-1**: Rust spectral analysis ready. Implement native wrappers following established pattern.

### References
- [Architecture - Native Integration](../architecture.md#native-platform-integration)
- [Epics - Story 4.2](../epics.md#story-42-implement-ios-and-android-analyzespectrum-native-functions)

## Dev Agent Record
### Context Reference
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
