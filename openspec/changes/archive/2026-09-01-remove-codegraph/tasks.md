## 1. Preserve the subprocess guards before deleting their host

Removal order matters: the six hardening tests currently assert the guards through `initCodegraph`. Re-point them **first**, so the guards are never uncovered at any commit.

- [x] 1.1 Record the review baseline: capture the current `HEAD` commit for FuseReview, and confirm a clean starting suite. Verify: `git rev-parse HEAD` and `npx vitest run` (all green).
- [x] 1.2 Re-point the guard tests in `tests/utils/tools.test.ts` from `initCodegraph` to `initOpenspec`: assert `stdio` is `['ignore','pipe','pipe']`, `timeout > 0`, and `killSignal` is `'SIGKILL'` on every spawned call. RED first — the assertions must fail if the guards are stripped from `initOpenspec`. Verify: `npx vitest run tests/utils/tools.test.ts`.
- [x] 1.3 Add a test asserting `detectOpenspec`'s probe timeout is shorter than `initOpenspec`'s, and both are > 0 (spec: proportionate timeouts). Verify: `npx vitest run tests/utils/tools.test.ts`.
- [x] 1.4 Add a test asserting a timed-out `initOpenspec` resolves `false` rather than rejecting or hanging (spec: hang reported as failure). Verify: `npx vitest run tests/utils/tools.test.ts`.
- [x] 1.5 Add a test asserting no spawned option object sets `CODEGRAPH_NO_WATCH` (spec: guards must not set it). Verify: `npx vitest run tests/utils/tools.test.ts`.
- [x] 1.6 Add a test asserting `initOpenspec` resolves `true` when profile configuration fails (spec: profile failure non-fatal). Verify: `npx vitest run tests/utils/tools.test.ts`.

*Blocks: every task in sections 2-5. Do not delete any CodeGraph code until 1.2-1.6 are green.*

## 2. Generated .gitignore drops the CodeGraph entry

- [x] 2.1 Invert the assertion in `tests/templates/templates.test.ts`: for every built-in stack, `composeGitignore(stack)` output must NOT contain `.codegraph/`. Also assert `.idea/`, `.DS_Store`, `.env`, `*.log`, and the stack's own `gitignorePatterns` are still present (spec: surrounding patterns preserved). Expect RED. Verify: `npx vitest run tests/templates/templates.test.ts`.
- [x] 2.2 Remove `'# CodeGraph'` and `'.codegraph/'` from `SHARED_PATTERNS` in `src/templates/gitignore.ts`. Verify: `npx vitest run tests/templates/templates.test.ts` (GREEN).
- [x] 2.3 Add a scaffolder test proving the append-only merge preserves a pre-existing `.codegraph/` line in an existing `.gitignore` (spec: existing projects keep their line). Verify: `npx vitest run tests/scaffolder.test.ts`.

*Blocked by: section 1.*

## 3. Remove the CodeGraph lifecycle functions

- [x] 3.1 Delete the three CodeGraph `it()` blocks from `tests/scaffolder.test.ts` and the `detectCodegraph`/`installCodegraph`/`initCodegraph` describe blocks from `tests/utils/tools.test.ts`. Verify: `npx vitest run` — remaining suite green, and `grep -ci codegraph tests/utils/tools.test.ts` returns 0.
- [x] 3.2 Add a test asserting `src/utils/tools.ts` exports `detectOpenspec`/`installOpenspec`/`initOpenspec` and none of the three CodeGraph functions (spec: no lifecycle functions exported). Expect RED. Verify: `npx vitest run tests/utils/tools.test.ts`.
- [x] 3.3 Delete `detectCodegraph`, `installCodegraph`, `initCodegraph`, and the `CODEGRAPH_ENV` constant from `src/utils/tools.ts`. Keep `NONINTERACTIVE`, the three timeout tiers, and `opts()`. Verify: `npx vitest run tests/utils/tools.test.ts` (GREEN) and `npx tsc --noEmit`.

*Blocked by: section 1.*

## 4. Remove the orchestration and the config field

- [x] 4.1 Add a scaffolder test asserting a full `scaffold(config)` run spawns no command containing `codegraph` and none containing the CodeGraph install URL (spec: no CodeGraph subprocess). Expect RED. Verify: `npx vitest run tests/scaffolder.test.ts`.
- [x] 4.2 Remove the `if (config.initCodegraph)` orchestration block, the `if (config.initCodegraph)` PATH-hint block, and the three CodeGraph imports from `src/scaffolder.ts`. Verify: `npx vitest run tests/scaffolder.test.ts` (GREEN) and `npx tsc --noEmit`.
- [x] 4.3 Add a test asserting `collectProjectConfig()` returns no own `initCodegraph` property while still carrying `projectName`, `stack`, `initGit`, `initOpenspec`, `targetDir`, `isExisting` (spec: config shape). Expect RED. Verify: `npx vitest run`.
- [x] 4.4 Remove the CodeGraph `confirm()` prompt and the field from the returned object in `src/prompts.ts`; remove `initCodegraph` from `ProjectConfig` in `src/types.ts` (**BREAKING**). Verify: `npx vitest run` (GREEN) and `npx tsc --noEmit`.
- [x] 4.5 Add a test asserting `scaffold()` ignores a stray `initCodegraph: true` from an untyped caller — completes normally, spawns no CodeGraph subprocess (spec: stray field ignored). Verify: `npx vitest run tests/scaffolder.test.ts`.

*Blocked by: sections 1 and 3 (3.3 must land before 4.2 so the import removal has nothing left to reference).*

## 5. Questionnaire contract

- [x] 5.1 Add tests asserting no prompt message contains `CodeGraph`; that existing-directory init skips the git prompt and resolves `initGit` to `false`; and that `--yes` with `--stack` presents no prompt and sets `initOpenspec` true (spec: three-question questionnaire). Verify: `npx vitest run`.
- [x] 5.2 Add a test asserting `--yes` without `--stack` and without a custom profile rejects with an error naming `--stack` (spec: explicit stack still required). Verify: `npx vitest run`.

*Blocked by: section 4.*

## 6. Verification and exit

- [x] 6.1 Full suite green: `npx vitest run`. Paste raw terminal output as evidence.
- [x] 6.2 Typecheck clean, proving no residual reference to the removed field or functions: `npx tsc --noEmit`.
- [x] 6.3 Mechanical removal check — must return zero matches: `grep -ri codegraph src/`. A non-empty result means removal is partial.
- [x] 6.4 Build and smoke-test the CLI, proving no dangling import at startup: `npm run build && node dist/index.js --help`.
- [x] 6.5 End-to-end scaffold into a scratch directory inside the repo: assert exactly three prompts, assert the generated `.gitignore` has no `.codegraph/` line, and assert completion without contacting the CodeGraph install URL. Remove the scratch directory afterward. Verify: inspect the generated files, then `git status --short` shows no stray artifacts.
- [x] 6.6 FuseReview checkpoint: present the change facts (task count, subagent usage, modules touched) and ask whether to run FuseReview on `baseline..HEAD`. Record the decision — including a skip — in the apply completion report.

*Blocked by: sections 1-5.*
