## Why

The published `create-specfuse@0.17.0` package and the public repository name a developer's personal environment: a private environment file, vendor-specific credential variable names, and a concrete versioned gateway model id. Those details point at an internal endpoint and a private file that no consumer of the package can use. The real-model E2E also reads that personal file by name, so the test cannot run for anyone else without editing source.

## What Changes

- `README.md` and `docs/dsh.md` describe the real dsh E2E through generic process environment variables only: `SPECFUSE_DSH_E2E=1`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, and `SPECFUSE_DSH_MODEL`. They no longer name a personal environment file or a specific versioned model id.
- The `cordis.patch.yml` example uses `<model-id>` as a placeholder instead of a concrete gateway model.
- `tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts` gates on the same three endpoint variables and writes the patch from `SPECFUSE_DSH_MODEL`. It no longer reads a personal environment file or maps vendor credential variables.
- The dsh capability spec's documentation requirement changes from "map from a vendor-specific environment file and show a concrete versioned model id" to "use generic endpoint variables and a model placeholder".
- A new guard, `tests/public-surface-hygiene.test.ts`, scans `README.md`, `docs/**`, the real-model E2E source, and the dsh capability spec for personal-environment markers, so the leak cannot return silently.
- `tests/e2e/LEDGER.md` records the generic gate.

## Capabilities

### New Capabilities

- `public-surface-hygiene`: public documentation, the real-model E2E source, and the dsh capability spec contain no personal environment file, vendor credential variable, or specific versioned model id.

### Modified Capabilities

- `dsh-harness-compatibility`: the documentation requirement and the real-model gate use generic environment variables and a model placeholder instead of a personal file and a concrete model.

## Impact

- `README.md`, `docs/dsh.md`: user-facing setup and E2E instructions.
- `tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts`: gate and patch construction.
- `tests/public-surface-hygiene.test.ts`: new guard.
- `tests/e2e/LEDGER.md`: gate record.
- `openspec/specs/dsh-harness-compatibility/spec.md`: documentation requirement, through a delta spec.
- No runtime dependency or production code change.

## Non-goals

- Rewriting the frozen archive under `openspec/changes/archive/**` or git history. The archive and the already-published `0.17.0` retain the old text; removing them requires a separate history rewrite and a new release, which this change does not perform.
- Removing `DEEPSEEK_BASE_URL` and `DEEPSEEK_API_KEY` from the docs. They are dsh's public provider variables, not personal environment details.
- Changing the dsh skill discovery, entry points, or pipeline behavior.
- Adding a default model id. A default would reintroduce a vendor-specific value and could fail against endpoints that do not serve it.

## Trade-offs

- **Keep a personal-file fallback vs remove it.** The fallback lets one developer run the E2E without exporting variables, but it publishes the file name and makes the test non-portable. Removed; the developer exports the three variables in their shell instead.
- **Use a public default model vs require `SPECFUSE_DSH_MODEL`.** A default is convenient but may not exist on the configured endpoint, and it names a vendor. Required variable; the test skips visibly when absent.
- **Scan all files vs public surfaces.** Scanning the frozen archive would force edits to historical records, which the project forbids. The guard scans current public surfaces; the archive and published 0.17.0 remain a recorded residual risk.

## Verification strategy

- The new guard fails before the scrub and passes after.
- `npx vitest run tests/public-surface-hygiene.test.ts` and the existing README/template suites pass.
- The real dsh E2E runs with the three variables exported in the shell, proving the gate works without a repository file reference.
- Full verify: `/opsx:verify`, full test suite, lint, and `openspec validate --strict`.
