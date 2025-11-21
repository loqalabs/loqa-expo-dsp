# Story 3.2: Implement Formant Extraction Rust Function Bindings

Status: ready-for-dev

## Story
As a developer, I want loqa-voice-dsp LPC formant extraction exposed via FFI/JNI, so that iOS and Android can extract formants from audio buffers.

## Acceptance Criteria
1. **Given** Rust compiled **When** exposing LPC **Then** exports extract_formants_rust with FormantsResult struct
2. **Given** function exposed **When** calling **Then** uses LPC analysis from loqa-voice-dsp
3. **Given** processing **When** validating **Then** validates audio appropriate for formant analysis
4. **Given** defaults **When** not specified **Then** default LPC order is (sample_rate / 1000) + 2
5. **Given** result **When** returning **Then** returns formant frequencies in Hz

## Tasks / Subtasks
- [ ] Create Rust FFI for extract_formants_rust
- [ ] Define FormantsResult struct (f1, f2, f3, bandwidths)
- [ ] Implement LPC analysis call
- [ ] Add input validation for voiced audio
- [ ] Set default LPC order
- [ ] Test with vowel samples

## Dev Notes
### Learnings from Previous Story
**From Story 3-1**: Pitch detection FFI established. Formants follow same pattern with different algorithm (LPC vs YIN).

### References
- [Architecture - Rust FFI/JNI](../architecture.md#rust-ffijni-integration)
- [PRD - FR9-FR12](../prd.md#core-dsp-analysis-capabilities)
- [Epics - Story 3.2](../epics.md#story-32-implement-formant-extraction-rust-function-bindings)

## Dev Agent Record
### Context Reference

- [docs/sprint-artifacts/3-2-implement-formant-extraction-rust-function-bindings.context.xml](./3-2-implement-formant-extraction-rust-function-bindings.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
