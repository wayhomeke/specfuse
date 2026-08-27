# Implementation Tasks

Removal change: TDD runs inverted — write the absence-assertions first (RED: Grill still present), then delete the code (GREEN). `npx vitest run` and `npx tsc --noEmit` must be green at the end.

## 1. Absence assertions: tests first (RED)

- [x] 1.1 In `tests/templates/claude-md.test.ts`: delete the `renderGrillReview` describe block and its import; update the section-ordering test (drop the "Pre-Apply Review (Grill)" entry, keep Path A/B → Exploration → Phase 2 → Phase 2.5 → Phase 3 → General Rules); delete the "Grill between Exploration and Phase 2" placement test; add negative assertions per stack: `composeCLAUDEmd` output does NOT contain `Grill` (case-insensitive) and NOT contain `grill-me`; `renderApplyFuseReview()` output does NOT contain `Grill` and states FuseReview as the fourth beat (specs: grill-review-section REMOVED, apply-exit-checkpoint unchanged). **Verify:** `npx vitest run tests/templates/claude-md.test.ts` (RED)
- [x] 1.2 In `tests/scaffolder.test.ts`: delete the two grill-me tests (greenfield create / existing no-overwrite); add assertion that after greenfield scaffolding `.claude/skills/grill-me/` does NOT exist (spec: grill-me-skill-generation REMOVED). **Verify:** `npx vitest run tests/scaffolder.test.ts` (RED)
- [x] 1.3 In `tests/templates/templates.test.ts`: replace the `.grill-backup/` assertion with a negative one — `composeGitignore(stack)` output does NOT contain `.grill-backup/` for every builtin stack (spec: grill-review-section REMOVED, Gitignore requirement). **Verify:** `npx vitest run tests/templates/templates.test.ts` (RED)
- [x] 1.4 In `tests/templates/fusereview-skill.test.ts`: add assertions — output does NOT contain `Grill` (case-insensitive), does NOT contain `fifth`, and contains the four-beat wording with FuseReview reviewing the implementation (spec: fusereview-skill-generation, cascade wording). **Verify:** `npx vitest run tests/templates/fusereview-skill.test.ts` (RED)

## 2. Template and scaffolder removal (GREEN) (blocks: 3, 4)

- [x] 2.1 In `src/templates/claude-md.ts`: delete `renderGrillReview()` and its wiring in `composeCLAUDEmd()`; rewrite the deferral rationale in `renderDesignTokensRules()` to drop the Grill consistency-scan reference while keeping the forward-reference argument (design.md/tasks.md reference DESIGN-TOKENS.md, so the token file must exist before those artifacts); update `renderApplyFuseReview()` beat wording to four beats without Grill. **Verify:** `npx vitest run tests/templates/claude-md.test.ts` (GREEN)
- [x] 2.2 Delete `src/templates/grill-me-skill.ts` and `tests/templates/grill-me-skill.test.ts`; remove the grill-me distribution block and its import from `src/scaffolder.ts`. **Verify:** `npx vitest run tests/scaffolder.test.ts` (GREEN)
- [x] 2.3 In `src/templates/gitignore.ts`: remove the `.grill-backup/` pattern from shared patterns. **Verify:** `npx vitest run tests/templates/templates.test.ts` (GREEN)
- [x] 2.4 In `src/templates/fusereview-skill.ts`: replace "Fifth beat ... Grill reviews design" with the four-beat sequence and change the frontmatter description "fifth pipeline beat" to "fourth pipeline beat". **Verify:** `npx vitest run tests/templates/fusereview-skill.test.ts` (GREEN)
- [x] 2.5 In `src/index.ts`: update the CLI description beat sequence to Think → Do → FuseReview → Verify. **Verify:** `npx tsc --noEmit`
- [x] 2.6 Update `README.md`: pipeline section reflects Think → Do → FuseReview → Verify; remove Grill rows from the discipline table; directory tree drops `grill-me/` and adds `fusereview/`. **Verify:** `grep -c "Grill" README.md` returns only historical-intentional mentions (target: 0)

## 3. Self-bootstrap sync (depends on: 2)

- [x] 3.1 Delete this repo's `.claude/skills/grill-me/` directory. **Verify:** `test ! -d .claude/skills/grill-me`
- [x] 3.2 Re-render this repo's own `CLAUDE.md` FUSION block from the updated template. **Verify:** `! grep -qi grill CLAUDE.md`

## 4. Quality gate (depends on: 2, 3)

- [x] 4.1 Full suite green. **Verify:** `npx vitest run`
- [x] 4.2 Type check clean. **Verify:** `npx tsc --noEmit`
- [x] 4.3 Format check on changed files — the four files newly created or semantically rewritten by this change pass; the 5 warned files (scaffolder.ts, index.ts, gitignore.ts and two test files) have preexisting whole-file quote-style drift already present at HEAD, same class recorded by prior changes; left untouched. **Verify:** `npx prettier --check <changed files>`
- [x] 4.4 Build passes. **Verify:** `npm run build`
- [x] 4.5 Zero-residue scan (refined criterion — the original "wc -l outputs 0" was over-strict, since absence-assertion tests must name what they assert absent): `src/` contains zero grill references; every `tests/` reference occurs only inside negative assertions (`not.toContain`, `toBe(false)`) or test names stating removal. **Verify:** `grep -ri grill src/ | wc -l` outputs `0`; `grep -rn grill tests/` shows only negative assertions

## 5. Spec removal validation (depends on: 4)

- [x] 5.1 Validate delta specs parse. **Verify:** `openspec validate remove-grill-phase` passes
