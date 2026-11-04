## 1. dsh Entry-Skill Templates

- [x] 1.1 RED — Add tests to `tests/templates/specfuse-command.test.ts` for `composeSpecfuseDshSkill('default')` and `composeSpecfuseDshSkill('full')`: kebab-case `name` equal to the directory, `disable-model-invocation: true`, `user-invocable: true`, the exact usage lines, the trailing-text requirement phrase, FuseReview → FuseQA → Verify → archive order, `.agents/skills/fusedoc/SKILL.md`, and absence of `$ARGUMENTS`. Verify: `npx vitest run tests/templates/specfuse-command.test.ts` fails on the missing export.
- [x] 1.2 GREEN — Refactor `src/templates/specfuse-command.ts` into a shared pipeline-body renderer with a harness argument, add `composeSpecfuseDshSkill(mode)`, and keep the two existing Claude composers byte-compatible. Verify: `npx vitest run tests/templates/specfuse-command.test.ts` passes.
- [x] 1.3 RED/GREEN — Add a test asserting `composeFuseDocSkill()` names its own directory without `.claude/skills/fusedoc/`; update `src/templates/fusedoc-skill.ts`. Verify: `npx vitest run tests/templates/fusedoc-skill.test.ts` passes.
- [x] 1.4 Add a dsh frontmatter validator test that parses every shared and entry skill body from its composer output, asserting the kebab-case name regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, a non-empty description, and boolean invocation fields where present. Verify: `npx vitest run tests/templates/` passes.

## 2. Scaffolder Distribution

- [x] 2.1 RED — Add tests to `tests/scaffolder.test.ts`: fresh scaffold writes `.agents/skills/{design-md,fusedoc,fusereview,fuseqa}/SKILL.md` with assets; each dsh body equals its `.claude` counterpart byte for byte; `.agents/skills/specfuse/SKILL.md` and `.agents/skills/specfuse-full/SKILL.md` exist; an existing `.agents/skills/fuseqa/SKILL.md` is preserved; the printed listing names `.agents/skills/`. Verify: `npx vitest run tests/scaffolder.test.ts` fails.
- [x] 2.2 GREEN — Extract a skill-install helper in `src/scaffolder.ts`, distribute the four shared skills and their assets to both roots, write the two entry skills only when absent, and extend the printed listing. Verify: `npx vitest run tests/scaffolder.test.ts` passes.
- [x] 2.3 Verify the build copies assets for both roots: `npm run build`, then confirm `dist/fusedoc/templates`, `dist/fuseqa/templates`, and `dist/design-md/templates` exist before the built-artifact E2E runs.

## 3. OpenSpec Dual-Adapter Initialization

- [x] 3.1 RED — Add a `tests/utils/tools.test.ts` assertion that the spawned command is `openspec init --tools claude,agents --force`, and update the readiness assertions in `tests/scaffolder.test.ts` from `--tools claude` to `--tools claude,agents`. Verify: `npx vitest run tests/utils/tools.test.ts tests/scaffolder.test.ts` fails.
- [x] 3.2 GREEN — Change `initOpenspec()` in `src/utils/tools.ts` and the two notice strings in `src/scaffolder.ts`. Verify: `npx vitest run tests/utils/tools.test.ts tests/scaffolder.test.ts` passes.

## 4. Documentation

- [x] 4.1 RED/GREEN — Extend `tests/readme-skill-tree.test.ts` to assert `.agents/skills/`, `/specfuse`, `/specfuse-full`, and `/openspec-*` are documented; update `README.md` (tree, dsh section, migration table) and add `docs/dsh.md` with the Node 24.9 requirement, `npx @deepseek-ai/dsh` launch forms, endpoint mapping, patch example, and `SPECFUSE_DSH_E2E=1`. Verify: `npx vitest run tests/readme-skill-tree.test.ts` passes.
- [x] 4.2 Audit the change for credential values with an assignment-shaped pattern: `rg -n "(API_KEY|AUTH_TOKEN|SECRET)\s*[:=]\s*[\"']?[A-Za-z0-9_-]{16,}" README.md docs/dsh.md src tests | rg -v '\$[A-Z_]'` returns no output. The earlier `sk-[A-Za-z0-9]` form was rejected because it matches ordinary words such as `task-oriented`; the `$VAR` exclusion keeps documented environment-variable references from counting as values. Verify: the command produces no credential value.

## 5. Deterministic E2E

- [x] 5.1 Author `tests/e2e/dsh-harness-compatibility/skill-distribution.test.ts` over the built `dist/index.js`: scaffold in an isolated scratch project, assert both roots, byte equality, entry-skill frontmatter, asset parity, no-overwrite, and the printed listing. Verify: `npm run build && npx vitest run tests/e2e/dsh-harness-compatibility/skill-distribution.test.ts` passes.
- [x] 5.2 Extend `tests/e2e/openspec-readiness-reporting/success-path.test.ts` to assert `.agents/skills/openspec-propose/SKILL.md` exists after a real dual-adapter init. Verify: `npx vitest run tests/e2e/openspec-readiness-reporting/success-path.test.ts` passes.
- [x] 5.3 Record both additions in `tests/e2e/LEDGER.md` with capability, traces-to, shape, and the reason each cannot be a unit test. Verify: the ledger entry names the new files.

## 6. Real dsh Model E2E

- [x] 6.1 Author `tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts`, gated on `SPECFUSE_DSH_E2E=1`, Node 24.9+, and an endpoint (exported `DEEPSEEK_BASE_URL`/`DEEPSEEK_API_KEY`, else `SOURCE_BASE_URL`/`SOURCE_AUTH_TOKEN` from `~/private.env`); it scaffolds the built artifact with a scratch `HOME`, writes a `cordis.patch.yml` with `your-model-id`, adds a `catalog-canary` skill, runs `npx @deepseek-ai/dsh headless` three times (catalog listing, `/specfuse`, `/specfuse-full`), and asserts the shared skills plus canary are listed, the entry skills are not, and both usage lines are printed. Verify: `node --version` is 24.x, then `SPECFUSE_DSH_E2E=1 npx vitest run tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts` passes with either endpoint source.
- [x] 6.2 Attribute any red case before changing it: implementation defect → fix the skill body; spec gap → record as Suggestion; false red → fix the case and record why the implementation is correct. Verify: the attribution is written in the final report.

## 7. Full Verification

- [x] 7.1 Run and paste raw output: `npm run build`, `npx tsc --noEmit`, `npx vitest run` under Node 24 with `SPECFUSE_DSH_E2E=1` and the endpoint environment, `npx eslint .`, and `openspec validate add-dsh-harness-compatibility --strict`. Archive only if every command passes.
