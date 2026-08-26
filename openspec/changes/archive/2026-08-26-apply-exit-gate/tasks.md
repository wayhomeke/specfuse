# Implementation Tasks

TDD order throughout: write the failing test first, implement minimally, then refactor. Verification command per task; `npx vitest run` and `npx tsc --noEmit` must stay green.

## 1. FuseReview skill template: test first (RED)

- [x] 1.1 Create `tests/templates/fusereview-skill.test.ts` with failing assertions: output contains markers for all eleven checks (test strength / missing detection / scope fit / real entry / interface both-sides / lifecycle-concurrency / enforcement / configuration choices / capability-consumer / borrowed-state / boundary values); test-strength check carries the regression recipe; lifecycle check carries the seven defect classes; output discipline present (defect/location/impact/evidence, blocking vs suggestion, omit mechanical-gate-covered checks) (spec: fusereview-skill-generation). **Verify:** `npx vitest run tests/templates/fusereview-skill.test.ts` (RED)
- [x] 1.2 Add failing stack-adaptive assertions to the same file: output with a rust context contains the rust `errorHandling` and `concurrency` texts in a stack-adaptive section; with a go context contains the go ones instead (spec: fusereview-skill-generation). **Verify:** `npx vitest run tests/templates/fusereview-skill.test.ts` (RED)

## 2. FuseReview skill template: implement (GREEN) (blocks: 3, 4)

- [x] 2.1 Implement `composeFuseReviewSkill(ctx)` in `src/templates/fusereview-skill.ts`: frontmatter (name `fusereview`, description covering colloquial triggers), review object & preparation (baseline..HEAD, diff as index, surrounding code, fresh-context reviewer), eleven checks with inlined substance, stack-adaptive section from `ctx.stack.errorHandling`/`ctx.stack.concurrency`, output discipline, finding-handling rules (spec: fusereview-skill-generation). **Verify:** `npx vitest run tests/templates/fusereview-skill.test.ts` (GREEN)

## 3. CLAUDE.md checkpoint protocol: test first (RED)

- [x] 3.1 Add failing assertions to `tests/templates/claude-md.test.ts`: `renderApplyFuseReview()` output contains the MUST checkpoint question, forbidden silent advancement, fact list without automatic thresholds (no "≥ 6 tasks"), skip-trace requirement, blocking-through-TDD with fix-diff-only re-review, baseline recording with merge-base fallback, subagent merge-gate linkage, manual-invocation clause; `composeCLAUDEmd()` output contains the section between Do and Verify (spec: apply-exit-checkpoint). **Verify:** `npx vitest run tests/templates/claude-md.test.ts` (RED)

## 4. CLAUDE.md checkpoint protocol: implement (GREEN) (blocks: 7, 8)

- [x] 4.1 Implement `renderApplyFuseReview()` in `src/templates/claude-md.ts` and wire it into `composeCLAUDEmd()` between the apply phase and the verify phase; replace the dangling "code quality" wording in the subagent discipline so it points at the FuseReview skill (specs: apply-exit-checkpoint, fusereview-skill-generation). **Verify:** `npx vitest run tests/templates/claude-md.test.ts` (GREEN)

## 5. Scaffolder distribution: test first (RED)

- [x] 5.1 Add failing assertions to `tests/scaffolder.test.ts`: scaffolding a new project writes `.claude/skills/fusereview/SKILL.md` with rendered content; an existing skill file with custom content is left unchanged (spec: fusereview-skill-generation). **Verify:** `npx vitest run tests/scaffolder.test.ts` (RED)

## 6. Scaffolder distribution: implement (GREEN) (blocks: 7)

- [x] 6.1 Add the distribution step to `scaffold()` in `src/scaffolder.ts`: write the rendered skill via `composeFuseReviewSkill(ctx)` when absent, skip when present, mirroring the grill-me/design-md pattern (spec: fusereview-skill-generation). **Verify:** `npx vitest run tests/scaffolder.test.ts` (GREEN)

## 7. Quality gate (depends on: 2, 4, 6)

- [x] 7.1 Full suite green. **Verify:** `npx vitest run`
- [x] 7.2 Type check clean. **Verify:** `npx tsc --noEmit`
- [x] 7.3 Format check on changed files — the four files introduced/semantically edited by this change pass; `src/scaffolder.ts` and `tests/scaffolder.test.ts` fail with preexisting whole-file quote-style drift already present at HEAD (same class recorded by the previous change's task 5.4; left untouched). **Verify:** `npx prettier --check src/templates/fusereview-skill.ts src/templates/claude-md.ts src/scaffolder.ts tests/templates/fusereview-skill.test.ts tests/templates/claude-md.test.ts tests/scaffolder.test.ts`
- [x] 7.4 Build passes. **Verify:** `npm run build`

## 8. Rendering rehearsal (depends on: 7)

- [x] 8.1 Re-render specfuse's own `CLAUDE.md` FuseReview section from the updated template (keep generated file in sync). **Verify:** `grep -q "FuseReview" CLAUDE.md`
- [x] 8.2 Walkthrough rehearsal: rendered skill + checkpoint for a hypothetical 8-task subagent change (go stack). Result recorded in `.walkthrough-report.md` (generated during apply, then removed): MUST-ask=true, silent-advancement-forbidden=true, no "≥ 6" threshold=true, decision-belongs-to-user=true, skip-trace-required=true; skill renders stack-adaptive directives and all eleven checks. PASS. **Verify:** manual walkthrough recorded; no code change expected
