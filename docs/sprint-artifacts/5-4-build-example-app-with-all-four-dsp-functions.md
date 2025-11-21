# Story 5.4: Build Example App with All Four DSP Functions

Status: drafted

## Story
As a developer, I want a working example app demonstrating all DSP functions, so that I can see the library in action and use it as a reference.

## Acceptance Criteria
1. **Given** library complete **When** creating example **Then** builds Expo app in example/ directory
2. **Given** app created **When** implementing **Then** includes screens for FFT, pitch detection, formant extraction, spectral analysis
3. **Given** screens built **When** testing **Then** allows voice recording, displays real-time results, shows visualizations for each function
4. **Given** functionality complete **When** validating **Then** runs on both iOS and Android with same UI/UX

## Tasks / Subtasks
- [ ] Create example/ directory with Expo app
- [ ] Add expo-av for audio recording
- [ ] Create FFT demo screen with frequency visualization
- [ ] Create pitch detection screen with real-time pitch display
- [ ] Create formant extraction screen with F1/F2/F3 plot
- [ ] Create spectral analysis screen with band energy bars
- [ ] Test on iOS and Android devices

## Dev Notes
### Learnings from Previous Story
**From Story 5-3**: Integration patterns documented. Example app demonstrates all patterns in working code.

### References
- [PRD - FR73-FR76](../prd.md#example-application)
- [Epics - Story 5.4](../epics.md#story-54-build-example-app-with-all-four-dsp-functions)

## Dev Agent Record
### Context Reference
### Agent Model Used
### Debug Log References
### Completion Notes List
### File List
