# Story 5.6: Finalize package.json and Publishing Configuration

Status: drafted

## Story
As a developer, I want package.json properly configured for npm publishing, so that the library can be published with correct metadata and dependencies.

## Acceptance Criteria
1. **Given** library complete **When** finalizing package.json **Then** includes name, version 0.1.0, description, keywords, repository, license (MIT)
2. **Given** metadata set **When** checking dependencies **Then** peerDependencies include expo, react-native with correct versions
3. **Given** dependencies set **When** validating **Then** files field includes only necessary files (lib/, ios/, android/, loqa-audio-dsp.podspec, README.md)
4. **Given** package ready **When** checking scripts **Then** includes prepare, clean, test, typecheck scripts

## Tasks / Subtasks
- [ ] Set name: "@loqalabs/loqa-audio-dsp"
- [ ] Set version: "0.1.0"
- [ ] Add description, keywords, repository, license
- [ ] Configure peerDependencies (expo, react-native)
- [ ] Set files field to include only distributables
- [ ] Add npm scripts (prepare, clean, test, typecheck)
- [ ] Test npm pack to verify package contents

## Dev Notes
### Learnings from Previous Story
**From Story 5-5**: Performance validated. Package configuration enables publishing.

### References
- [PRD - FR77-FR79](../prd.md#npm-publishing)
- [Epics - Story 5.6](../epics.md#story-56-finalize-packagejson-and-publishing-configuration)

## Dev Agent Record
### Context Reference
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
