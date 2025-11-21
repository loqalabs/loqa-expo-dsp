# Story 1.8: Create Package Configuration for npm

Status: ready-for-dev

## Story

As a developer,
I want proper npm package configuration,
so that the module can be published and installed correctly.

## Acceptance Criteria

1. **Given** the module is buildable
   **When** I configure package.json for distribution
   **Then** package.json includes:
   - name: "@loqalabs/loqa-audio-dsp"
   - version: "0.1.0"
   - description: "Production-grade audio DSP analysis for React Native/Expo"
   - main: "lib/index.js"
   - types: "lib/index.d.ts"
   - files: ["lib", "ios", "android", "README.md", "API.md", "LICENSE"]
   - peerDependencies: expo ^54.0.0, react, react-native
   - Proper keywords for npm discoverability
   - Repository, bugs, homepage URLs

2. **Given** package.json is configured
   **When** I run the build script
   **Then** TypeScript compiles to lib/ directory

3. **Given** the build succeeds
   **When** I check the output
   **Then** package includes source maps for debugging

4. **Given** all configuration is complete
   **When** I create release documentation
   **Then** CHANGELOG.md is created with initial entry for v0.1.0
   **And** RELEASING.md documents the release process

## Tasks / Subtasks

- [ ] Configure package.json for distribution (AC: #1)
  - [ ] Set name: "@loqalabs/loqa-audio-dsp"
  - [ ] Set version: "0.1.0"
  - [ ] Set description: "Production-grade audio DSP analysis for React Native/Expo"
  - [ ] Set main: "lib/index.js"
  - [ ] Set types: "lib/index.d.ts"
  - [ ] Configure files array: ["lib", "ios", "android", "README.md", "API.md", "LICENSE"]
  - [ ] Add peerDependencies: expo (^54.0.0), react (*), react-native (*)
  - [ ] Add keywords: audio, dsp, fft, pitch, formants, spectrum, react-native, expo
  - [ ] Set author: "Loqa Labs"
  - [ ] Set license: "MIT"
  - [ ] Add repository URL: https://github.com/loqalabs/loqa-audio-dsp
  - [ ] Add homepage URL
  - [ ] Add bugs URL

- [ ] Configure build scripts (AC: #2, #3)
  - [ ] Add "build" script using expo-module-scripts or tsc
  - [ ] Configure TypeScript to output to lib/ directory
  - [ ] Enable source map generation in tsconfig.json
  - [ ] Add "prepublishOnly" script: npm run build
  - [ ] Add "clean" script to remove lib/ directory

- [ ] Create .npmignore file
  - [ ] Exclude development files: __tests__, .github, example (if separate)
  - [ ] Exclude .git directory and Git files
  - [ ] Exclude IDE files (.vscode, .idea, *.swp)
  - [ ] Exclude build artifacts not needed in package
  - [ ] Include lib/, ios/, android/ directories

- [ ] Create LICENSE file
  - [ ] Add MIT License text
  - [ ] Set copyright: Loqa Labs
  - [ ] Set year: 2025

- [ ] Create CHANGELOG.md (AC: #4)
  - [ ] Add header and introduction
  - [ ] Create v0.1.0 section with date
  - [ ] List "Added" features:
    - All four DSP functions (computeFFT, detectPitch, extractFormants, analyzeSpectrum)
    - Cross-platform iOS/Android support
    - TypeScript types and validation
    - Example app with demos
    - Complete documentation
  - [ ] Use Conventional Commits format

- [ ] Create RELEASING.md (AC: #4)
  - [ ] Document version bumping process (npm version)
  - [ ] Document pre-release checklist:
    - Tests pass
    - Documentation updated
    - CHANGELOG updated
  - [ ] Document Git tagging process
  - [ ] Document npm publishing process (automatic via GitHub Actions)
  - [ ] Document post-release steps (GitHub release, announcement)
  - [ ] Note NPM_TOKEN secret requirement

- [ ] Verify package build and structure
  - [ ] Run `npm run build` successfully
  - [ ] Verify lib/ directory contains compiled JavaScript
  - [ ] Verify lib/ directory contains .d.ts type definitions
  - [ ] Verify source maps are generated
  - [ ] Run `npm pack` to create tarball
  - [ ] Inspect tarball contents to verify correct files included

## Dev Notes

### Learnings from Previous Story

**From Story 1-7-configure-github-actions-cicd-pipeline (Status: drafted)**

- **CI Pipeline Ready**: Automated lint, typecheck, test, and audit
- **Publish Workflow Configured**: GitHub Actions will publish on version tags
- **NPM_TOKEN Required**: Secret must be configured in GitHub repository settings
- **Build Script Needed**: This story provides the build configuration CI depends on
- **Next Step**: Configure package for actual npm distribution

[Source: stories/1-7-configure-github-actions-cicd-pipeline.md]

### Architecture Patterns and Constraints

**npm Package Structure:**

From [Architecture - npm Package Structure](../architecture.md#npm-package-structure):

```json
{
  "name": "@loqalabs/loqa-audio-dsp",
  "version": "0.1.0",
  "description": "Production-grade audio DSP analysis for React Native/Expo",
  "main": "lib/index.js",
  "types": "lib/index.d.ts",
  "files": [
    "lib",
    "ios",
    "android",
    "README.md",
    "API.md",
    "LICENSE"
  ],
  "peerDependencies": {
    "expo": "^54.0.0",
    "react": "*",
    "react-native": "*"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "expo-module-scripts": "^3.0.0"
  }
}
```

**Build Configuration:**
- Use expo-module-scripts for building
- TypeScript strict mode enabled (from Story 1.1)
- Output to lib/ directory
- Generate source maps for debugging

**Release Process:**

From [Architecture - Release Process](../architecture.md#release-process):

1. Version bump: `npm version patch|minor|major`
2. Update CHANGELOG.md
3. Tag and push: `git push origin main --tags`
4. GitHub Actions automatically publishes to npm

**Documentation Requirements:**
- CHANGELOG.md with version history (from [PRD - FR53](../prd.md#package-distribution))
- RELEASING.md with release process (from [PRD - FR82](../prd.md#build--cicd))
- MIT LICENSE file

### Project Structure Notes

Files created/modified by this story:

```
├── package.json            # MODIFIED: Distribution configuration
├── .npmignore              # NEW: Exclude files from npm package
├── LICENSE                 # NEW: MIT license
├── CHANGELOG.md            # NEW: Version history
├── RELEASING.md            # NEW: Release process documentation
└── lib/                    # NEW: Compiled TypeScript output (created by build)
    ├── index.js
    ├── index.d.ts
    └── ...
```

**Alignment Notes:**
- Completes Epic 1 foundation - package is now ready for development
- Follows exact package structure from Architecture document
- Integrates with CI/CD from Story 1.7

**Prerequisites:**
- Story 1.1: TypeScript configuration
- Story 1.5: TypeScript source files to compile
- Story 1.7: CI/CD pipeline expecting build script

**Testing Strategy:**
- Use `npm pack` to create local tarball
- Inspect tarball to verify correct files
- Test installation in separate project: `npm install ../loqa-audio-dsp-0.1.0.tgz`
- Verify package structure matches expectations

### References

- [Architecture Document - npm Package Structure](../architecture.md#npm-package-structure) - Package configuration
- [Architecture Document - Release Process](../architecture.md#release-process) - Version and publish workflow
- [PRD - FR44-FR54](../prd.md#package-distribution) - npm package requirements
- [PRD - FR52-FR54](../prd.md#package-distribution) - Versioning and changelog requirements
- [Epics Document - Story 1.8](../epics.md#story-18-create-package-configuration-for-npm) - Full acceptance criteria

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/1-8-create-package-configuration-for-npm.context.xml](./1-8-create-package-configuration-for-npm.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
