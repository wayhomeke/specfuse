# Implementation Tasks

TDD order throughout: write the failing test first, implement minimally, then refactor. Verification command per task; `npx vitest run` and `npx tsc --noEmit` must stay green.

## 1. Grill-me skill: test first (RED)

- [x] 1.1 Add failing assertions to `tests/templates/grill-me-skill.test.ts`: output contains the four artifact-group markers `[proposal.md]`, `[design.md]`, `[specs/]`, `[tasks/]`; contains `signature` contract / `assertion` strength keywords; contains soft-limit `9` (spec: grill-review-dimensions). **Verify:** `npx vitest run tests/templates/grill-me-skill.test.ts` (RED)

## 2. Grill-me skill: implement (GREEN) (blocks: 5, 6)

- [x] 2.1 Rewrite `composeGrillMeSkill()` in `src/templates/grill-me-skill.ts` to emit the self-contained SKILL.md: discipline (one question at a time, evidence per question, recommended answer, blocking/non-blocking, soft limit 9), flow (backup → review → write-after-diff → bidirectional consistency scan → summary → cleanup), per-artifact review surfaces (proposal/design/specs/tasks groups incl. signature contract, dependency direction, config defaults, input slot, assertion strength, spec↔task trace), check tools (signature substitution, bidirectional parameter flow, implementation rehearsal), triage rule (presentation defect → strengthen THEN; requirements defect → route to Think), exit commands (grill-stop / grill-abort) (specs: grill-review-dimensions, grill-review-resilience). **Verify:** `npx vitest run tests/templates/grill-me-skill.test.ts` (GREEN)

## 3. CLAUDE.md protocol: test first (RED)

- [x] 3.1 Add failing assertions to `tests/templates/claude-md.test.ts`: `renderGrillReview()` output contains `Data-flow integrity`; contains soft-limit `9`; Consistency Scan section mentions the reverse direction (spec input → signature parameter slot) (spec: grill-review-protocol). **Verify:** `npx vitest run tests/templates/claude-md.test.ts` (RED)

## 4. CLAUDE.md protocol: implement (GREEN) (blocks: 5, 6)

- [x] 4.1 Update `renderGrillReview()` in `src/templates/claude-md.ts`: add `Data-flow integrity` to Review Dimensions (covering signature substitution + assertion strength), change Soft Limit 15→9, make Consistency Scan bidirectional, add a header line pointing to `.claude/skills/grill-me/SKILL.md` as the source of truth for review surfaces (spec: grill-review-protocol, grill-review-resilience). **Verify:** `npx vitest run tests/templates/claude-md.test.ts` (GREEN)

## 5. Quality gate (depends on: 2, 4)

- [x] 5.1 Full suite green. **Verify:** `npx vitest run`
- [x] 5.2 Type check clean. **Verify:** `npx tsc --noEmit`
- [x] 5.3 Lint — **N/A**: project has no ESLint config (package.json has no lint script; no `eslint.config.*`). Preexisting condition, not introduced by this change. **Verify:** `npx eslint .` fails before and after this change identically
- [x] 5.4 Format check on changed files. **Verify:** `npx prettier --check src/templates/grill-me-skill.ts src/templates/claude-md.ts tests/templates/grill-me-skill.test.ts tests/templates/claude-md.test.ts` (passes; 4 preexisting files with format drift untouched)
- [x] 5.5 Build passes. **Verify:** `npm run build`

## 6. Regression rehearsal (depends on: 5)

- [x] 6.1 Run the signature-conflict rehearsal against the `add-webui-ping-tool` artifacts: confirm the upgraded review surfaces capture the `NewHandler(scannerFactory)` / per-scan `PingOptions` conflict via the signature-contract and input-slot checkpoints. **Verify:** manual walkthrough recorded in the task note; no code change expected
- [x] 6.2 Re-render specfuse's own CLAUDE.md grill protocol section from the updated template (keep generated file in sync). **Verify:** `grep -q "Data-flow integrity" CLAUDE.md && grep -q "After 9 questions" CLAUDE.md`
