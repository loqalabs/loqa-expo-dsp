# Story 4.5: Add analyzeSpectrum to Public API and Complete Core DSP

Status: ready-for-dev

## Story
As a developer, I want all four DSP functions fully exported and documented, so that the complete MVP DSP capability is available.

## Acceptance Criteria
1. **Given** analyzeSpectrum tested **When** updating API **Then** src/index.ts exports analyzeSpectrum and types
2. **Given** exports added **When** checking **Then** README.md updated with analyzeSpectrum example
3. **Given** all functions **When** reviewing **Then** all four DSP functions exported (computeFFT, detectPitch, extractFormants, analyzeSpectrum)
4. **Given** compilation **When** building **Then** TypeScript produces complete .d.ts definitions
5. **Given** documentation **When** reviewing **Then** all JSDoc comments comprehensive

## Tasks / Subtasks
- [ ] Export analyzeSpectrum from src/index.ts
- [ ] Export SpectrumAnalysisOptions and SpectrumResult types
- [ ] Update README.md with spectral analysis example
- [ ] Verify all four DSP functions exported
- [ ] Verify TypeScript compilation
- [ ] Add comprehensive JSDoc

## Dev Notes
### Learnings from Previous Story
**From Story 4-4**: All tests passing. Epic 4 complete - all four core DSP functions operational!

### References
- [Architecture - API Contracts](../architecture.md#api-contracts)
- [Epics - Story 4.5](../epics.md#story-45-add-analyzespectrum-to-public-api-and-complete-core-dsp)

## Dev Agent Record
### Context Reference
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
