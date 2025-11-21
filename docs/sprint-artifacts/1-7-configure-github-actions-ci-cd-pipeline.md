# Story 1.7: Configure GitHub Actions CI/CD Pipeline

Status: ready-for-dev

## Story

As a developer,
I want automated CI/CD with GitHub Actions,
so that every commit is validated and releases are automatically published.

## Acceptance Criteria

1. **Given** the codebase is ready for CI
   **When** I create GitHub Actions workflows
   **Then** .github/workflows/ci.yml is created that:
   - Runs on push and pull_request events
   - Executes lint (ESLint)
   - Executes typecheck (TypeScript)
   - Executes npm test (Jest unit tests)
   - Executes npm audit (security check, fail on high severity)
   - Runs on ubuntu-latest with Node.js 18

2. **Given** CI workflow exists
   **When** I create publish workflow
   **Then** .github/workflows/publish.yml is created that:
   - Triggers on version tags (v*)
   - Runs full test suite
   - Publishes to npm registry with public access
   - Uses NPM_TOKEN secret for authentication

3. **Given** both workflows are created
   **When** I verify their configuration
   **Then** both workflows use actions/checkout@v4 and actions/setup-node@v4

4. **Given** workflows are configured
   **When** I push code to repository
   **Then** CI passes on current codebase (even with placeholder implementations)

## Tasks / Subtasks

- [ ] Create CI workflow (AC: #1, #3)
  - [ ] Create .github/workflows/ directory
  - [ ] Create ci.yml workflow file
  - [ ] Configure to run on push and pull_request events
  - [ ] Add checkout step with actions/checkout@v4
  - [ ] Add Node.js setup with actions/setup-node@v4 (Node 18)
  - [ ] Add npm ci step (clean install)
  - [ ] Add lint step: npm run lint
  - [ ] Add typecheck step: npm run typecheck
  - [ ] Add test step: npm test
  - [ ] Add security audit step: npm audit --audit-level=high
  - [ ] Use ubuntu-latest runner

- [ ] Create publish workflow (AC: #2, #3)
  - [ ] Create publish.yml workflow file
  - [ ] Configure to trigger on tag push (v*)
  - [ ] Add checkout step with actions/checkout@v4
  - [ ] Add Node.js setup with actions/setup-node@v4 and registry-url
  - [ ] Add npm ci step
  - [ ] Add build step: npm run build
  - [ ] Add test step: npm test
  - [ ] Add publish step: npm publish --access public
  - [ ] Configure NODE_AUTH_TOKEN from secrets.NPM_TOKEN
  - [ ] Document NPM_TOKEN requirement in RELEASING.md

- [ ] Add package.json scripts needed by CI
  - [ ] Ensure "lint" script exists: eslint src/**/*.ts
  - [ ] Ensure "typecheck" script exists: tsc --noEmit
  - [ ] Ensure "test" script exists (from Story 1.6)
  - [ ] Ensure "build" script exists: tsc or expo-module-scripts build

- [ ] Verify CI pipeline (AC: #4)
  - [ ] Test lint script passes locally
  - [ ] Test typecheck script passes locally
  - [ ] Test that tests pass locally
  - [ ] Push to GitHub and verify CI runs
  - [ ] Confirm all CI steps pass

- [ ] Document CI/CD setup
  - [ ] Add CI badge to README.md
  - [ ] Document NPM_TOKEN setup in RELEASING.md
  - [ ] Document CI pipeline in CONTRIBUTING.md (if exists)

## Dev Notes

### Learnings from Previous Story

**From Story 1-6-set-up-jest-testing-infrastructure (Status: drafted)**

- **Test Infrastructure Ready**: Jest configured, TypeScript tests can run via `npm test`
- **Test Scripts Available**: "test", "test:watch", "test:coverage" commands ready
- **Native Tests Configured**: iOS XCTest and Android JUnit set up (will run separately)
- **Next Step**: Automate test execution with CI/CD pipeline

[Source: stories/1-6-set-up-jest-testing-infrastructure.md]

### Architecture Patterns and Constraints

**CI/CD Pipeline Configuration:**

From [Architecture - CI/CD Pipeline](../architecture.md#cicd-pipeline):

**CI Workflow Pattern:**

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm audit --audit-level=high
```

**Publish Workflow Pattern:**

```yaml
# .github/workflows/publish.yml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**CI/CD Requirements:**
- From [PRD - FR75-FR78](../prd.md#build--cicd): GitHub Actions on all PRs
- From [PRD - FR79-FR81](../prd.md#build--cicd): Automated npm publish on tags
- All tests must pass before publishing
- Security audit as part of CI pipeline

### Project Structure Notes

Files created by this story:

```
.github/
└── workflows/
    ├── ci.yml              # NEW: Continuous integration
    └── publish.yml         # NEW: npm publishing automation
```

**Alignment Notes:**
- Follows exact CI/CD structure from Architecture document
- Integrates with test infrastructure from Story 1.6
- Supports npm publishing workflow for Story 1.8

**Prerequisites:**
- Story 1.5: TypeScript compilation must work
- Story 1.6: Test scripts must be available

**Testing Strategy:**
- Run all CI steps locally before committing
- Verify CI passes on first push
- Test publish workflow will be validated in Story 1.8

### References

- [Architecture Document - CI/CD Pipeline](../architecture.md#cicd-pipeline) - Workflow configurations
- [Architecture Document - Deployment Architecture](../architecture.md#deployment-architecture) - Release process
- [PRD - FR75-FR81](../prd.md#build--cicd) - CI/CD functional requirements
- [PRD - NFR22](../prd.md#security) - Dependency audit in CI
- [Epics Document - Story 1.7](../epics.md#story-17-configure-github-actions-cicd-pipeline) - Full acceptance criteria

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/1-7-configure-github-actions-ci-cd-pipeline.context.xml](./1-7-configure-github-actions-ci-cd-pipeline.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent during implementation -->

### Completion Notes List

<!-- Will be filled by dev agent after completion -->

### File List

<!-- Will be filled by dev agent with created/modified files -->
