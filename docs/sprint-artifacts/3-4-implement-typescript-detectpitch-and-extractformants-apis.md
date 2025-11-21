# Story 3.4: Implement TypeScript detectPitch and extractFormants APIs

Status: ready-for-dev

## Story
As a developer, I want clean TypeScript APIs for pitch detection and formant extraction, so that users have typed, validated interfaces to voice analysis.

## Acceptance Criteria
1. **Given** native functions work **When** implementing TypeScript **Then** creates src/detectPitch.ts and src/extractFormants.ts
2. **Given** functions created **When** validating **Then** both validate inputs using validation.ts functions
3. **Given** validated **When** processing **Then** both provide sensible defaults for optional parameters
4. **Given** native returns **When** converting **Then** converts results to proper TypeScript types
5. **Given** errors **When** wrapping **Then** wraps native errors in NativeModuleError

## Tasks / Subtasks
- [ ] Create src/detectPitch.ts
- [ ] Create src/extractFormants.ts
- [ ] Implement validation for both
- [ ] Set defaults (minFrequency=80Hz, maxFrequency=400Hz, lpcOrder calculation)
- [ ] Convert results to TypeScript types
- [ ] Add error handling and logging

## Dev Notes
### Learnings from Previous Story
**From Story 3-3**: Native functions ready on both platforms. Create TypeScript layer following computeFFT pattern.

### References
- [Architecture - TypeScript API](../architecture.md#api-contracts)
- [PRD - FR28-FR43](../prd.md#typescript-api-layer)
- [Epics - Story 3.4](../epics.md#story-34-implement-typescript-detectpitch-and-extractformants-apis)

## Dev Agent Record
### Context Reference

- [docs/sprint-artifacts/3-4-implement-typescript-detectpitch-and-extractformants-apis.context.xml](./3-4-implement-typescript-detectpitch-and-extractformants-apis.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
