# Story 5.8: Publish v0.1.0 to npm Registry

Status: drafted

## Story
As a developer, I want v0.1.0 published to npm, so that the library is publicly available for installation.

## Acceptance Criteria
1. **Given** all Epic 1-5 stories complete **When** preparing **Then** all tests pass, CI/CD green, docs complete
2. **Given** ready to publish **When** running npm publish **Then** successfully publishes @loqalabs/loqa-audio-dsp@0.1.0
3. **Given** published **When** verifying **Then** package installable via npm, README displays on npm page, all files present

## Tasks / Subtasks
- [ ] Verify all tests pass (npm test)
- [ ] Verify CI/CD pipeline green
- [ ] Verify docs complete (README, API.md, INTEGRATION_GUIDE.md)
- [ ] Create git tag v0.1.0
- [ ] Run npm publish
- [ ] Verify package on npmjs.com
- [ ] Test installation in fresh project
- [ ] Update project status to "v0.1.0 released"

## Dev Notes
### Learnings from Previous Story
**From Story 5-7**: Release documentation complete. Final publishing step completes Epic 5 and entire project.

### References
- [PRD - FR82](../prd.md#npm-publishing)
- [Epics - Story 5.8](../epics.md#story-58-publish-v010-to-npm-registry)

## Dev Agent Record
### Context Reference
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
