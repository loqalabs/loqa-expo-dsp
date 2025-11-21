# Story 4.1: Implement Spectral Analysis Rust Function Bindings

Status: ready-for-dev

## Story
As a developer, I want loqa-voice-dsp spectral analysis exposed via FFI/JNI, so that iOS and Android can compute spectral features.

## Acceptance Criteria
1. **Given** Rust compiled **When** exposing spectral **Then** exports analyze_spectrum_rust with SpectrumResult struct
2. **Given** function exposed **When** computing **Then** computes spectral centroid (brightness in Hz)
3. **Given** computing **When** processing **Then** computes spectral rolloff (95% energy threshold frequency)
4. **Given** computing **When** calculating **Then** computes spectral tilt (slope of spectrum)
5. **Given** implementation **When** optimizing **Then** all spectral features computed in single function call

## Tasks / Subtasks
- [ ] Create Rust FFI for analyze_spectrum_rust
- [ ] Define SpectrumResult struct (centroid, rolloff, tilt)
- [ ] Implement spectral centroid calculation
- [ ] Implement spectral rolloff calculation
- [ ] Implement spectral tilt calculation
- [ ] Test with various audio types

## Dev Notes
### Learnings from Previous Story
**From Story 3-6** (Epic 3 complete): Pitch and formant analysis working. Apply same Rust FFI pattern for spectral analysis.

### References
- [Architecture - Rust FFI](../architecture.md#rust-ffijni-integration)
- [PRD - FR13-FR16](../prd.md#core-dsp-analysis-capabilities)
- [Epics - Story 4.1](../epics.md#story-41-implement-spectral-analysis-rust-function-bindings)

## Dev Agent Record
### Context Reference

- [docs/sprint-artifacts/4-1-implement-spectral-analysis-rust-function-bindings.context.xml](./4-1-implement-spectral-analysis-rust-function-bindings.context.xml)

### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
