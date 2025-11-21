# Story 1.6: Set Up Jest Testing Infrastructure

Status: ready-for-dev

## Story

As a developer,
I want a complete testing infrastructure,
so that I can write unit tests for TypeScript, iOS, and Android code.

## Acceptance Criteria

1. **Given** the module structure is complete
   **When** I configure testing frameworks
   **Then** Jest is configured for TypeScript tests:
   - __tests__/ directory created
   - jest.config.js with ts-jest preset
   - Package.json includes test scripts: "test", "test:watch"

2. **Given** Jest is configured
   **When** I set up iOS testing
   **Then** iOS XCTest infrastructure is configured:
   - ios/Tests/ directory created
   - Xcode test target configured
   - Placeholder test files for each DSP function

3. **Given** Jest is configured
   **When** I set up Android testing
   **Then** Android JUnit infrastructure is configured:
   - android/src/test/ directory created
   - build.gradle includes JUnit 4.13+ dependency
   - Placeholder test files for each DSP function

4. **Given** test infrastructure is set up
   **When** I run npm test
   **Then** TypeScript tests run successfully (even if placeholder)

## Tasks / Subtasks

- [ ] Configure Jest for TypeScript (AC: #1)
  - [ ] Install Jest and ts-jest dependencies
  - [ ] Create jest.config.js with ts-jest preset
  - [ ] Configure Jest to ignore native code
  - [ ] Add __tests__/ directory
  - [ ] Add "test" script to package.json: "jest"
  - [ ] Add "test:watch" script: "jest --watch"
  - [ ] Add "test:coverage" script: "jest --coverage"

- [ ] Create TypeScript placeholder tests (AC: #1, #4)
  - [ ] Create __tests__/computeFFT.test.ts with placeholder test
  - [ ] Create __tests__/detectPitch.test.ts with placeholder test
  - [ ] Create __tests__/extractFormants.test.ts with placeholder test
  - [ ] Create __tests__/analyzeSpectrum.test.ts with placeholder test
  - [ ] Create __tests__/validation.test.ts with placeholder test
  - [ ] Ensure all tests pass (even if minimal)

- [ ] Set up iOS XCTest infrastructure (AC: #2)
  - [ ] Create ios/Tests/ directory
  - [ ] Configure Xcode test target in project
  - [ ] Create FFTTests.swift placeholder
  - [ ] Create PitchDetectionTests.swift placeholder
  - [ ] Create FormantExtractionTests.swift placeholder
  - [ ] Create SpectrumAnalysisTests.swift placeholder
  - [ ] Verify test target compiles

- [ ] Set up Android JUnit infrastructure (AC: #3)
  - [ ] Create android/src/test/java/com/loqalabs/loquaaudiodsp/ directory
  - [ ] Add JUnit 4.13+ dependency to build.gradle
  - [ ] Create FFTTests.kt placeholder
  - [ ] Create PitchDetectionTests.kt placeholder
  - [ ] Create FormantExtractionTests.kt placeholder
  - [ ] Create SpectrumAnalysisTests.kt placeholder
  - [ ] Verify tests compile with Gradle

- [ ] Verify test execution
  - [ ] Run `npm test` and verify Jest runs successfully
  - [ ] Run iOS tests via Xcode and verify they execute
  - [ ] Run Android tests via Gradle and verify they execute
  - [ ] Document test execution commands in README or CONTRIBUTING

## Dev Notes

### Learnings from Previous Story

**From Story 1-5-create-typescript-api-scaffold-with-types (Status: drafted)**

- **Type Definitions Complete**: All DSP function types defined (FFTOptions, PitchResult, etc.)
- **Error Classes Ready**: ValidationError, NativeModuleError available for test assertions
- **Module Structure Set**: LoqaAudioDspModule.ts ready to be tested
- **Next Step**: Create test infrastructure to validate TypeScript and native implementations

[Source: stories/1-5-create-typescript-api-scaffold-with-types.md]

### Architecture Patterns and Constraints

**Testing Strategy:**

From [Architecture - Testing & Quality Tools](../architecture.md#testing--quality-tools):

**TypeScript Testing:**
- Jest 29+ as unit testing framework
- ts-jest for TypeScript preprocessing
- Test files in __tests__/ directory (Jest convention)

**Native Testing:**
- iOS: XCTest (built-in with Xcode)
- Android: JUnit 4.13+
- Native tests validate FFI/JNI bindings work correctly

**Test Organization:**
- By feature: Each DSP function has its own test file
- Shared utilities in separate test files
- Placeholder tests created now, real tests in Epic 2+

**Testing Framework Configuration:**

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

### Project Structure Notes

Files/directories created by this story:

```
├── jest.config.js                  # NEW: Jest configuration
├── __tests__/                      # NEW: TypeScript tests
│   ├── computeFFT.test.ts
│   ├── detectPitch.test.ts
│   ├── extractFormants.test.ts
│   ├── analyzeSpectrum.test.ts
│   └── validation.test.ts
├── ios/Tests/                      # NEW: iOS XCTests
│   ├── FFTTests.swift
│   ├── PitchDetectionTests.swift
│   ├── FormantExtractionTests.swift
│   └── SpectrumAnalysisTests.swift
└── android/src/test/               # NEW: Android JUnit tests
    └── java/com/loqalabs/loquaaudiodsp/
        ├── FFTTests.kt
        ├── PitchDetectionTests.kt
        ├── FormantExtractionTests.kt
        └── SpectrumAnalysisTests.kt
```

**Alignment Notes:**
- Follows testing structure from Architecture document
- Placeholder tests ensure infrastructure works
- Real test implementation happens in Epic 2+

**Prerequisites:**
- Story 1.5: TypeScript types needed for test assertions

**Testing Strategy:**
- Initial tests are minimal placeholders
- Verify test frameworks are correctly configured
- Ensure tests run without errors
- Foundation for comprehensive testing in later epics

### References

- [Architecture Document - Testing & Quality Tools](../architecture.md#testing--quality-tools) - Testing frameworks and tools
- [Architecture Document - Test Co-location](../architecture.md#code-organization) - Test organization patterns
- [PRD - FR76-FR77](../prd.md#build--cicd) - CI test execution requirements
- [PRD - Testing & Validation](../prd.md#testing--validation) - Test coverage requirements
- [Epics Document - Story 1.6](../epics.md#story-16-set-up-jest-testing-infrastructure) - Full acceptance criteria

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/1-6-set-up-jest-testing-infrastructure.context.xml](./1-6-set-up-jest-testing-infrastructure.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
