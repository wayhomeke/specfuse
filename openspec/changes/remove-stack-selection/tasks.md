## 1. Collapse the per-stack test suites first

The per-stack loops (`for (const stack of getBuiltinStacks())`) currently encode invariants that must survive the stack removal. Rewrite them to single stack-free suites asserting each invariant once, so coverage never lapses at any commit.

- [x] 1.1 Record the FuseReview baseline: capture current `HEAD` and confirm a clean starting suite. Verify: `git rev-parse HEAD` and `npx vitest run` (all green).
- [x] 1.2 Collapse `tests/templates/claude-md.test.ts`: replace the `describe(stack.id)` loop with a single suite asserting each invariant once (FUSION markers, TDD iron law, verification evidence, Path A/B, exploration, commit convention, subagent rules, worktree rules, FuseReview section, verify-phase). The assertions that reference `stack.commands.test`/`stack.commands.lint` change to assert the generalized wording ("project's test command" / "project's linter"). Verify: `npx vitest run tests/templates/claude-md.test.ts`.
- [x] 1.3 Collapse `tests/templates/templates.test.ts`: single stack-free suite asserting `composeGitignore()` emits shared patterns only and no `.codegraph/`, no `/target/`, no `node_modules/`; asserting `composeClaudeSettings()` emits shared permissions only. Verify: `npx vitest run tests/templates/templates.test.ts`.
- [x] 1.4 Delete `tests/stacks/` (`detect.test.ts`, `stacks.test.ts`). Verify: `npx vitest run` — remaining suite green.
- [x] 1.5 Update `tests/utils/tools.test.ts` module-surface test: still asserts `detectOpenspec`/`installOpenspec`/`initOpenspec` exported; no stack reference needed (unchanged content, verify no `stack` import leaks). Verify: `npx vitest run tests/utils/tools.test.ts`.

*Blocks: every task in sections 2-6. Nothing stack-related is deleted until these green.*

## 2. Delete the stack subsystem

- [x] 2.1 Delete `src/stacks/` (15 profiles + `index.ts` + `detect.ts` + `schema.ts`) and `tests/stacks/`. Expected: typecheck now fails where imports remain — do NOT fix yet, section 4 resolves them. Verify: `npx vitest run` still green on remaining suites; note the expected typecheck failure.
- [x] 2.2 Add a test asserting `src/index.ts` help/CLI no longer advertises `--stack` or `--stack-from`. RED first: the options still exist. Verify: `npx vitest run` (add test in an appropriate CLI test file, or extend scaffolder tests).
- [x] 2.3 Remove `--stack` / `--stack-from` options and the `loadCustomStack` import from `src/index.ts`; narrow the action signature from `{ stack, stackFrom, yes }` to `{ yes }`. Verify: `npx vitest run` (2.2 goes green) and `node dist/index.js --help` after build.

*Blocked by: section 1.*

## 3. Shrink the types

- [x] 3.1 Delete `StackProfile` and `StackCommands` from `src/types.ts`; remove `stack` from `ProjectConfig` and `TemplateContext` so `TemplateContext` is `{ projectName: string }`. Verify: `npx tsc --noEmit` — expected to fail where `stack` is still consumed (sections 4-5 resolve); note the expected errors.
- [x] 3.2 Add a test asserting `ProjectConfig` has no `stack` own-property after `collectProjectConfig()` resolves, while carrying `projectName`, `initGit`, `initOpenspec`, `targetDir`, `isExisting` (spec: config shape). RED first. Verify: `npx vitest run tests/scaffolder.test.ts`.
- [x] 3.3 Add a test asserting interactive init asks no stack/tech-stack prompt (spec: questionnaire exactly two questions). Verify: `npx vitest run tests/prompts.test.ts`.
- [x] 3.4 Add a test asserting `--yes` without `--stack` presents no prompt and sets `initOpenspec` true (spec: no prompt, no stack needed). Verify: `npx vitest run tests/prompts.test.ts`.

*Blocked by: section 1 (types), but the test additions may be drafted once `collectProjectConfig` signature is known.*

## 4. Simplify prompts and the CLI surface

- [x] 4.1 Rewrite `src/prompts.ts` `collectProjectConfig(projectName, yes?)`: drop `stackArg`/`customStack` params, the four-way stack-resolution branch, `detectAndSelect()`, `promptFullStackList()`, the generic fallback stack, and the `--stack is required with --yes` error. Keep git + OpenSpec prompts only. Verify: `npx vitest run tests/prompts.test.ts` (3.3/3.4 go green) and `npx tsc --noEmit`.
- [x] 4.2 Update `tests/prompts.test.ts`: remove the `'rust'` stack argument from calls and the explicit-stack-rejection case; add a case asserting `--yes` standalone succeeds. Verify: `npx vitest run tests/prompts.test.ts`.
- [x] 4.3 Update `tests/scaffolder.test.ts` config literals: drop `stack:` entries and `getBuiltinStacks()[0]` references (some already exist; sweep all). Verify: `npx vitest run tests/scaffolder.test.ts`.

*Blocked by: section 1; 4.1 must land before 3.2/3.3/3.4 can be expected green.*

## 5. Make the template composers stack-free

- [x] 5.1 `src/templates/claude-md.ts`: delete `renderTechStack()`; change `renderApplyPhase(stack)` → no arg, generalize the IRON LAW command to "the project's test command"; change `renderVerifyPhase(stack)` → no arg, generalize to "Run the full test suite" / "Run the linter"; update `composeCLAUDEmd(ctx)` to use `ctx.projectName` only and drop the Tech Stack section. Verify: `npx vitest run tests/templates/claude-md.test.ts` (1.2 green).
- [x] 5.2 `src/templates/gitignore.ts`: drop `stack.gitignorePatterns` usage; emit `SHARED_PATTERNS` only. `composeGitignore()` takes no arg. Verify: `npx vitest run tests/templates/templates.test.ts` (1.3 green).
- [x] 5.3 `src/templates/claude-settings.ts`: drop `stack.permissions`; emit `SHARED_PERMISSIONS` only. `composeClaudeSettings()` takes no arg. Verify: `npx vitest run tests/templates/templates.test.ts`.
- [x] 5.4 `src/templates/openspec-config.ts`: replace `ctx.stack.openspecContext`/`openspecRules` with a hardcoded stack-agnostic rule set (proposal: Non-goals/Trade-offs/modules/<800 words; design: dependency diagram/API surface/error handling; specs: testable/success+failure/boundaries/concrete symbols; tasks: ≤2h/verifiable done/TDD order/verification command/dependencies). `composeOpenspecConfig()` takes no arg. Verify: `npx vitest run` and `npm run build`; inspect a scaffolded `openspec/config.yaml`.
- [x] 5.5 `src/templates/fusereview-skill.ts`: delete the `## Stack-adaptive checks` section and the `const { stack } = ctx` destructure; drop the "stack's mechanical gates" phrase to "the project's own mechanical gates". `composeFuseReviewSkill(ctx)` uses ctx only for nothing (or drop arg if unused). Verify: `npx vitest run tests/templates/fusereview-skill.test.ts` (updated in 1.2/1.3 sweep) and `npx tsc --noEmit`.
- [x] 5.6 Update `src/scaffolder.ts` call sites: `composeGitignore()`, `composeCLAUDEmd(ctx)` with `ctx = { projectName }`, `composeClaudeSettings()`, `composeFuseReviewSkill(ctx)`, `composeOpenspecConfig()`. Verify: `npx tsc --noEmit` clean and `npx vitest run`.

*Blocked by: section 4; the template work depends on types (3.1) and prompts (4.1) settling the signatures.*

## 6. Delta specs and verification

- [x] 6.1 Add a test asserting `composeGitignore()` emits none of `/target/`, `node_modules/`, `/dist/` and preserves `.idea/`/`.DS_Store`/`.env`/`*.log` (spec: stack-free gitignore). Verify: `npx vitest run tests/templates/templates.test.ts`.
- [x] 6.2 Add a test asserting `composeFuseReviewSkill(ctx)` output contains no "Stack-adaptive" heading and still contains all eleven checks (spec: REMOVED stack-adaptive, eleven checks stand). Verify: `npx vitest run tests/templates/fusereview-skill.test.ts`.
- [x] 6.3 Mechanical removal check — must return zero matches: `grep -riE "stack-profile|StackProfile|--stack|--stack-from" src/`. A non-empty result means removal is partial.
- [x] 6.4 Typecheck clean, proving no residual reference to removed types/options: `npx tsc --noEmit`.
- [x] 6.5 Full suite green with raw output pasted: `npx vitest run`.
- [x] 6.6 Build and CLI smoke: `npm run build && node dist/index.js --help` — no `--stack` options, no dangling imports.
- [x] 6.7 End-to-end scaffold into a scratch directory: assert two prompts for a new project (git, OpenSpec), assert generated `CLAUDE.md` has no Tech Stack block, assert `.gitignore` has no build patterns, assert `config.yaml` carries the stack-agnostic rules, assert `--yes` works without `--stack`. Remove the scratch directory afterward. Verify: inspect generated files, then `git status --short` shows no stray artifacts.
- [x] 6.8 FuseReview checkpoint: present change facts (task count, subagent usage, modules touched) and ask whether to run FuseReview on `baseline..HEAD`. Record the decision — including a skip — in the apply completion report.

*Blocked by: sections 1-5.*

## 7. Follow-up (not part of apply)

- [ ] 7.1 README stack sections ship as a separate `docs:` commit, per the proposal's Non-goals. Not run during `/opsx:apply`; tracked here for visibility only.

*Not blocked; informational.*
