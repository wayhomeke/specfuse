## 1. Add renderGrillReview function

- [x] 1.1 Write test: `renderGrillReview()` returns string starting with `### Pre-Apply Review (Grill)`
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 1.2 Write test: `renderGrillReview()` accepts zero arguments
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 1.3 Write test: output contains all 7 review dimensions (scope boundary, error paths, dependency risk, testability, security, performance impact, backward compatibility)
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 1.4 Write test: output contains blocking categories (artifact contradictions, uncovered edge cases, missing error handling, security risks, untestable specs)
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 1.5 Write test: output contains exit commands (`grill-stop`, `grill-abort`)
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 1.6 Write test: output contains soft limit "15"
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 1.7 Write test: output contains consistency scan keywords (reference integrity, terminology, logical conflict)
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 1.8 Write test: output contains backup path `.grill-backup/`
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 1.9 Implement `renderGrillReview()` in `src/templates/claude-md.ts` to pass all tests
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`

## 2. Integrate into composeCLAUDEmd

- [x] 2.1 Write test: `composeCLAUDEmd()` output contains "Pre-Apply Review (Grill)" between "Exploration" and "Phase 2: Apply"
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 2.2 Write test: all existing sections remain present and in original order
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`
- [x] 2.3 Insert `renderGrillReview()` call in `composeCLAUDEmd()` sections array between `renderExploration()` and `renderApplyPhase()`
  - Verify: `npx vitest run tests/templates/claude-md.test.ts`

## 3. Add .grill-backup/ to gitignore template

- [x] 3.1 Write test: `composeGitignore()` output contains `.grill-backup/`
  - Verify: `npx vitest run tests/templates/gitignore.test.ts`
- [x] 3.2 Add `.grill-backup/` pattern to `SHARED_PATTERNS` in `src/templates/gitignore.ts`
  - Verify: `npx vitest run tests/templates/gitignore.test.ts`

## 4. Full verification

- [x] 4.1 Run full test suite passes
  - Verify: `npx vitest run`
- [x] 4.2 Run lint with zero warnings
  - Verify: `npx eslint .`
- [x] 4.3 Run typecheck passes
  - Verify: `npx tsc --noEmit`
