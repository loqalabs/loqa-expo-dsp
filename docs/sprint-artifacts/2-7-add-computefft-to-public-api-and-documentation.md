# Story 2.7: Add computeFFT to Public API and Documentation

Status: ready-for-dev

## Story

As a developer,
I want computeFFT exported and documented,
so that users can discover and use the function.

## Acceptance Criteria

1. **Given** computeFFT complete **When** updating API **Then** src/index.ts exports computeFFT, FFTOptions, FFTResult
2. **Given** exports added **When** checking docs **Then** all have JSDoc comments with description, parameters, return type, examples, @throws
3. **Given** TypeScript compiles **When** checking output **Then** produces correct .d.ts type definitions
4. **Given** documentation **When** updating README **Then** includes basic computeFFT usage example

## Tasks / Subtasks

- [ ] Export computeFFT from src/index.ts
- [ ] Export FFTOptions and FFTResult types
- [ ] Add comprehensive JSDoc comments
- [ ] Verify TypeScript .d.ts generation
- [ ] Update README.md with FFT example
- [ ] Run TypeScript compilation
- [ ] Verify exports work correctly

## Dev Notes

### Learnings from Previous Story

**From Story 2-6-write-unit-tests-for-computefft (Status: drafted)**
- **computeFFT Tested**: All tests passing on TypeScript, iOS, Android
- **Cross-Platform Verified**: Identical behavior confirmed
- **Epic 2 Complete**: First DSP function fully operational
- **Next Step**: Make it publicly available and documented

[Source: stories/2-6-write-unit-tests-for-computefft.md]

### References

- [Architecture - API Contracts](../architecture.md#api-contracts)
- [PRD - FR67-FR70](../prd.md#documentation)
- [Epics - Story 2.7](../epics.md#story-27-add-computefft-to-public-api-and-documentation)

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/2-7-add-computefft-to-public-api-and-documentation.context.xml](./2-7-add-computefft-to-public-api-and-documentation.context.xml)
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
