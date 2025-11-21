# Story 5.5: Add Performance Benchmarking to Example App

Status: drafted

## Story
As a developer, I want performance benchmarks in the example app, so that I can verify the library meets performance requirements and optimize if needed.

## Acceptance Criteria
1. **Given** example app complete **When** adding benchmarks **Then** measures execution time for all four DSP functions
2. **Given** benchmarks running **When** testing **Then** validates against NFR requirements (FFT <50ms, pitch <100ms, formants <150ms, spectral <75ms)
3. **Given** results collected **When** displaying **Then** shows min/max/average times and frames per second capability

## Tasks / Subtasks
- [ ] Add benchmark screen to example app
- [ ] Measure computeFFT execution time (target: <50ms for 2048 samples)
- [ ] Measure detectPitch execution time (target: <100ms)
- [ ] Measure extractFormants execution time (target: <150ms)
- [ ] Measure analyzeSpectrum execution time (target: <75ms)
- [ ] Display results with pass/fail against NFR targets
- [ ] Test on both iOS and Android

## Dev Notes
### Learnings from Previous Story
**From Story 5-4**: Example app complete with all DSP functions. Benchmarks validate performance.

### References
- [Architecture - Performance Requirements](../architecture.md#performance-requirements)
- [PRD - NFR1-NFR50](../prd.md#performance-requirements)
- [Epics - Story 5.5](../epics.md#story-55-add-performance-benchmarking-to-example-app)

## Dev Agent Record
### Context Reference
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
