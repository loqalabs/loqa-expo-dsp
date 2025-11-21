# Story 3.1: Implement Pitch Detection Rust Function Bindings

Status: ready-for-dev

## Story
As a developer, I want the loqa-voice-dsp YIN pitch detection exposed via FFI/JNI, so that iOS and Android can detect pitch from audio buffers.

## Acceptance Criteria
1. **Given** Rust loqa-voice-dsp crate compiled **When** exposing YIN **Then** exports detect_pitch_rust C-compatible function with PitchResult struct
2. **Given** function exposed **When** calling **Then** uses YIN algorithm from loqa-voice-dsp
3. **Given** processing **When** validating **Then** validates sample rate 8000-48000 Hz
4. **Given** no pitch **When** returning **Then** returns null frequency (0.0) if undetected
5. **Given** result **When** checking **Then** confidence score between 0.0-1.0

## Tasks / Subtasks
- [ ] Create Rust FFI for detect_pitch_rust
- [ ] Define PitchResult struct (frequency, confidence, is_voiced)
- [ ] Implement YIN algorithm call
- [ ] Add sample rate validation
- [ ] Handle voiced/unvoiced segments
- [ ] Test with various audio samples

## Dev Notes
### Learnings from Previous Story
**From Story 2-7** (Epic 2 complete): FFT working end-to-end. Pattern established: Rust FFI → Native wrappers → TypeScript API → Tests → Public export. Apply same pattern for pitch detection.

### References
- [Architecture - Rust FFI/JNI](../architecture.md#rust-ffijni-integration)
- [PRD - FR5-FR8](../prd.md#core-dsp-analysis-capabilities)
- [Epics - Story 3.1](../epics.md#story-31-implement-pitch-detection-rust-function-bindings)

## Dev Agent Record
### Context Reference

- [docs/sprint-artifacts/3-1-implement-pitch-detection-rust-function-bindings.context.xml](./3-1-implement-pitch-detection-rust-function-bindings.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
