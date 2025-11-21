# Story 1.5: Create TypeScript API Scaffold with Types

Status: ready-for-dev

## Story

As a developer,
I want a complete TypeScript API structure,
so that I can implement DSP functions with full type safety.

## Acceptance Criteria

1. **Given** native modules are scaffolded
   **When** I create TypeScript source files
   **Then** the following files exist in src/:
   - index.ts (main exports - currently empty placeholder exports)
   - LoqaAudioDspModule.ts (native module imports using requireNativeModule)
   - types.ts with complete type definitions for all DSP functions:
     - FFTOptions, FFTResult
     - PitchDetectionOptions, PitchResult
     - FormantExtractionOptions, FormantsResult
     - SpectrumAnalysisOptions, SpectrumResult
   - errors.ts with custom error classes:
     - LoqaAudioDspError (base class)
     - ValidationError
     - NativeModuleError
   - validation.ts with validation function signatures (to be implemented)
   - utils.ts with logging utilities (logDebug, logWarning)

2. **Given** type definitions exist
   **When** I review them
   **Then** all types have JSDoc comments describing their purpose

3. **Given** TypeScript files are created
   **When** I compile the project
   **Then** TypeScript compiles without errors in strict mode

## Tasks / Subtasks

- [ ] Create LoqaAudioDspModule.ts (AC: #1)
  - [ ] Import requireNativeModule from expo-modules-core
  - [ ] Export native module: requireNativeModule('LoqaAudioDsp')
  - [ ] Add TypeScript type annotations for native module

- [ ] Create types.ts with all DSP type definitions (AC: #1, #2)
  - [ ] Define FFTOptions interface with JSDoc
  - [ ] Define FFTResult interface with JSDoc
  - [ ] Define PitchDetectionOptions interface with JSDoc
  - [ ] Define PitchResult interface with JSDoc
  - [ ] Define FormantExtractionOptions interface with JSDoc
  - [ ] Define FormantsResult interface with JSDoc
  - [ ] Define SpectrumAnalysisOptions interface with JSDoc
  - [ ] Define SpectrumResult interface with JSDoc
  - [ ] Follow exact type definitions from Architecture document

- [ ] Create errors.ts with custom error classes (AC: #1, #2)
  - [ ] Create LoqaAudioDspError base class with code and details
  - [ ] Create ValidationError extending LoqaAudioDspError
  - [ ] Create NativeModuleError extending LoqaAudioDspError
  - [ ] Add JSDoc comments to all error classes

- [ ] Create validation.ts with function signatures (AC: #1)
  - [ ] Add validateAudioBuffer function signature (implementation in Epic 2)
  - [ ] Add validateSampleRate function signature
  - [ ] Add validateFFTSize function signature
  - [ ] Add JSDoc comments describing validation rules

- [ ] Create utils.ts with logging utilities (AC: #1, #2)
  - [ ] Implement logDebug function with DEBUG flag check
  - [ ] Implement logWarning function
  - [ ] Add JSDoc comments
  - [ ] Use [LoqaAudioDsp] prefix for all logs

- [ ] Create index.ts placeholder (AC: #1)
  - [ ] Add placeholder export structure (actual exports in Epic 2+)
  - [ ] Import and re-export types
  - [ ] Import and re-export errors
  - [ ] Prepare for future function exports

- [ ] Verify TypeScript compilation (AC: #3)
  - [ ] Run TypeScript compiler (tsc)
  - [ ] Ensure strict mode is enabled
  - [ ] Verify no compilation errors
  - [ ] Check that .d.ts files are generated

## Dev Notes

### Learnings from Previous Story

**From Story 1-4-implement-android-kotlin-jni-bindings-scaffold (Status: drafted)**

- **Native Modules Ready**: Both iOS (Swift) and Android (Kotlin) modules expose placeholder async functions
- **Cross-Platform API Established**: Module name "LoqaAudioDsp" consistent across platforms
- **Function Signatures Defined**: computeFFT, detectPitch, extractFormants, analyzeSpectrum
- **Next Step**: Create TypeScript layer that calls these native modules

[Source: stories/1-4-implement-android-kotlin-jni-bindings-scaffold.md]

### Architecture Patterns and Constraints

**TypeScript Type Definitions:**

Complete type definitions from [Architecture - Data Architecture](../architecture.md#data-architecture):

```typescript
// types.ts
export interface FFTOptions {
  fftSize?: number;
  windowType?: 'hanning' | 'hamming' | 'blackman' | 'none';
  includePhase?: boolean;
}

export interface FFTResult {
  magnitude: Float32Array;
  phase?: Float32Array;
  frequencies: Float32Array;
}

export interface PitchDetectionOptions {
  sampleRate: number;
  minFrequency?: number;
  maxFrequency?: number;
}

export interface PitchResult {
  frequency: number | null;
  confidence: number;
  isVoiced: boolean;
}

// ... additional types
```

**Error Handling Pattern:**

From [Architecture - Error Handling](../architecture.md#error-handling):

```typescript
export class LoqaAudioDspError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'LoqaAudioDspError';
  }
}

export class ValidationError extends LoqaAudioDspError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}
```

**Logging Strategy:**

From [Architecture - Logging Strategy](../architecture.md#logging-strategy):

```typescript
const DEBUG = __DEV__ || process.env.LOQA_AUDIO_DSP_DEBUG === 'true';

export function logDebug(message: string, data?: unknown): void {
  if (DEBUG) {
    console.log(`[LoqaAudioDsp] ${message}`, data || '');
  }
}
```

### Project Structure Notes

Files created by this story:

```
src/
├── index.ts                    # NEW: Main exports (placeholder)
├── LoqaAudioDspModule.ts       # NEW: Native module imports
├── types.ts                    # NEW: All TypeScript type definitions
├── errors.ts                   # NEW: Custom error classes
├── validation.ts               # NEW: Validation function signatures
└── utils.ts                    # NEW: Logging utilities
```

**Alignment Notes:**
- Follows exact type definitions from Architecture document
- Prepares structure for Epic 2+ implementation
- All types align with native module signatures from Stories 1.3 and 1.4

**Prerequisites:**
- Story 1.1: TypeScript configuration with strict mode
- Story 1.3 & 1.4: Native module function signatures defined

**Testing Strategy:**
- TypeScript compilation must pass with strict mode
- Verify .d.ts files are generated correctly
- Check JSDoc comments appear in IDE autocomplete
- Lint code with ESLint to ensure quality

### References

- [Architecture Document - TypeScript Type Definitions](../architecture.md#typescript-type-definitions) - Exact type specifications
- [Architecture Document - Error Handling](../architecture.md#error-handling) - Custom error pattern
- [Architecture Document - Logging Strategy](../architecture.md#logging-strategy) - Debug logging pattern
- [Architecture Document - API Contracts](../architecture.md#api-contracts) - Public API structure
- [PRD - FR31](../prd.md#typescript-api-layer) - Full TypeScript type definitions requirement
- [Epics Document - Story 1.5](../epics.md#story-15-create-typescript-api-scaffold-with-types) - Full acceptance criteria

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/1-5-create-typescript-api-scaffold-with-types.context.xml](./1-5-create-typescript-api-scaffold-with-types.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
