## 1. Public-Surface Hygiene Guard

- [x] 1.1 RED — Add `tests/public-surface-hygiene.test.ts` with a scanner that reads `README.md`, every file under `docs/`, `tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts`, `tests/e2e/LEDGER.md`, and `openspec/specs/dsh-harness-compatibility/spec.md`, plus a fixture test proving each prohibited marker is detected and public dsh variables are not. Verify: `npx vitest run tests/public-surface-hygiene.test.ts` fails on the current leaked surfaces.
- [x] 1.2 GREEN — Scrub `README.md` and `docs/dsh.md`: use only `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, `SPECFUSE_DSH_MODEL`, and a `<model-id>` placeholder; remove every personal file, vendor credential variable, and concrete versioned model id. Verify: the guard still fails only on the remaining surfaces.
- [x] 1.3 GREEN — Refactor `tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts` to gate on `SPECFUSE_DSH_E2E=1`, Node 24.9+, `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, and `SPECFUSE_DSH_MODEL`; remove the personal file reader, vendor credential mapping, and concrete versioned model id; run dsh with async `spawn` and at most one retry for output variance. Verify: `npx vitest run tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts` skips visibly without the gate and exits zero.
- [x] 1.4 GREEN — Rewrite the gate record in `tests/e2e/LEDGER.md` and apply the modified documentation requirement to `openspec/specs/dsh-harness-compatibility/spec.md` (the same text as the delta spec), using generic descriptions only. Verify: `npx vitest run tests/public-surface-hygiene.test.ts` passes.
- [x] 1.5 Verify the delta and main spec agree: `openspec validate scrub-local-environment-details --strict` and `openspec validate --specs --strict` both pass, and the modified requirement text is byte-identical to the delta.

## 2. Real dsh Gate

- [x] 2.1 Run the real dsh E2E with the gate variables exported in the shell only: `SPECFUSE_DSH_E2E=1`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, `SPECFUSE_DSH_MODEL` (Node 24.9+). Verify: `npx vitest run tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts` passes 3/3 without reading any repository-named environment file.
- [x] 2.2 Author `tests/e2e/public-surface-hygiene/package-surface.test.ts` to run `npm pack --dry-run --json`, assert `README.md`, `docs/dsh.md`, and `dist/index.js` are shipped, and scan the shipped docs with the shared guard. Verify: `npm run build && npx vitest run tests/e2e/public-surface-hygiene/package-surface.test.ts` passes.

## 3. Full Verification

- [x] 3.1 Run and paste raw output: `npm run build`, `npx tsc --noEmit`, `SPECFUSE_DSH_E2E=1 npx vitest run` with the four gate variables, `npx eslint .`, `openspec validate scrub-local-environment-details --strict`.
