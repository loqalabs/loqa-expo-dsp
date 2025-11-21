# Story 3.6: Add Pitch and Formant Functions to Public API

Status: ready-for-dev

## Story
As a developer, I want detectPitch and extractFormants exported and documented, so that users can discover and use voice analysis features.

## Acceptance Criteria
1. **Given** functions complete **When** updating API **Then** src/index.ts exports detectPitch, extractFormants, and their types
2. **Given** exports added **When** checking docs **Then** all have comprehensive JSDoc comments with usage examples
3. **Given** documentation **When** updating README **Then** includes examples of voice analysis use cases

## Tasks / Subtasks
- [ ] Export detectPitch and extractFormants from src/index.ts
- [ ] Export related types (PitchDetectionOptions, PitchResult, FormantExtractionOptions, FormantsResult)
- [ ] Add comprehensive JSDoc comments
- [ ] Update README.md with voice analysis examples
- [ ] Verify TypeScript compilation

## Dev Notes
### Learnings from Previous Story
**From Story 3-5**: All tests passing. Epic 3 complete - pitch and formant analysis fully operational.

### References
- [Architecture - API Contracts](../architecture.md#api-contracts)
- [Epics - Story 3.6](../epics.md#story-36-add-pitch-and-formant-functions-to-public-api)

## Dev Agent Record
### Context Reference

- [docs/sprint-artifacts/3-6-add-pitch-and-formant-functions-to-public-api.context.xml](./3-6-add-pitch-and-formant-functions-to-public-api.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
