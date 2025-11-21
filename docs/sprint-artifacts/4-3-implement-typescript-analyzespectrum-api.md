# Story 4.3: Implement TypeScript analyzeSpectrum API

Status: ready-for-dev

## Story
As a developer, I want a clean TypeScript API for spectral analysis, so that users have a typed, validated interface to spectral features.

## Acceptance Criteria
1. **Given** native functions work **When** implementing **Then** creates src/analyzeSpectrum.ts with proper signature
2. **Given** function created **When** validating **Then** validates audioBuffer and sampleRate
3. **Given** validated **When** calling **Then** calls LoqaAudioDspModule.analyzeSpectrum
4. **Given** native returns **When** converting **Then** converts result to SpectrumResult type
5. **Given** errors **When** wrapping **Then** wraps native errors in NativeModuleError

## Tasks / Subtasks
- [ ] Create src/analyzeSpectrum.ts
- [ ] Implement input validation
- [ ] Call native module
- [ ] Convert results to TypeScript types
- [ ] Add error handling

## Dev Notes
### Learnings from Previous Story
**From Story 4-2**: Native functions ready. Create TypeScript layer following established pattern.

### References
- [Architecture - TypeScript API](../architecture.md#api-contracts)
- [Epics - Story 4.3](../epics.md#story-43-implement-typescript-analyzespectrum-api)

## Dev Agent Record
### Context Reference
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
