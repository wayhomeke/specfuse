## Context

See `proposal.md` for motivation. The current real-model E2E reads a personal environment file, maps vendor-specific credential variables, and writes a concrete versioned gateway model id into its patch. The same details appear in `README.md`, `docs/dsh.md`, `tests/e2e/LEDGER.md`, and the dsh capability spec. The npm package includes `README.md` and `docs/dsh.md`, so the leak ships to consumers.

The project already treats `openspec/changes/archive/**` as frozen. The archive and the published `0.17.0` therefore retain the old text; this change cleans current surfaces and records the residual.

## Goals / Non-Goals

**Goals:**

- Current public documentation, the real-model E2E source, and the dsh capability spec contain no personal environment file, vendor credential variable, absolute home path, or concrete versioned model id.
- The E2E remains runnable with explicit process environment variables.
- A mechanical guard prevents reintroduction.

**Non-Goals:**

- Editing frozen archive records or rewriting git history.
- Unpublishing or replacing `create-specfuse@0.17.0`.
- Changing dsh discovery, entry-point behavior, or the pipeline.
- Removing the public dsh variables `DEEPSEEK_BASE_URL` and `DEEPSEEK_API_KEY`.

## Decisions

### D1 — Require explicit process environment variables

The E2E gate reads `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, and `SPECFUSE_DSH_MODEL` from the process environment. It no longer reads a personal file or knows vendor-specific credential names.

Alternatives: keeping the file fallback would keep the leak; a generic `SPECFUSE_DSH_ENV_FILE` still invites a personal file path into source; dsh's own `<cwd>/.env` support would create a repo-local file that could be committed. Explicit variables keep the secret in the developer's shell and the repository generic.

### D2 — Require a model id instead of naming one

`SPECFUSE_DSH_MODEL` is required and written into the patch. Documentation uses `<model-id>` in the YAML example.

Alternatives: a default model id is vendor-specific and may not exist on the configured endpoint; discovering the model from the endpoint adds an authenticated request and a second failure mode. A required variable makes the selection explicit and portable.

### D3 — Guard public surfaces, not the frozen archive

`tests/public-surface-hygiene.test.ts` scans `README.md`, `docs/**`, the real-model E2E source, `tests/e2e/LEDGER.md`, and `openspec/specs/dsh-harness-compatibility/spec.md`. It excludes `openspec/changes/archive/**` because the project freezes archived decisions.

Alternatives: scanning the whole repository would force edits to frozen records; scanning only README would miss the test and spec; relying on review alone is not mechanical. The chosen scope covers everything that ships or describes current behavior.

### D4 — Use specific prohibited markers

The guard's denylist names the personal file pattern, vendor credential pattern, absolute home path, versioned model-id pattern, and literal credential-value pattern. The literal patterns live only in the test constant, not in the documentation or the spec.

Alternatives: a broad "any environment variable" rule would reject the public `DEEPSEEK_*` contract and tool defaults; a keyword-only rule would miss a new personal file name. The denylist is a test constant, so a future personal marker is one edit away.

### D5 — Keep `DEEPSEEK_*` in the docs

dsh's provider reads these variables; they are public integration names, not personal details. The guide explains how to supply them from the developer's own shell or secret manager without naming a file.

Alternatives: introducing SpecFuse-specific variable names would add a translation layer dsh does not read. Using placeholders for the variables would make the guide unusable.

### D6 — Run dsh asynchronously and retry only output variance

The E2E uses `spawn`, not `spawnSync`, so the vitest worker can service its RPC while the model runs. Each case allows one retry only when the process exits 0 and the expected output is absent; a non-zero exit or timeout fails immediately. The per-case budget is 600 seconds, enough for two 240-second attempts. The retry absorbs model sampling variance; the skill body that requests the exact line remains guarded by the composer tests.

Alternatives: a blocking call exceeds the worker RPC timeout on slow endpoints; retrying process failures would double the cost without improving attribution. The chosen rule keeps the retry scoped to sampling variance.

### Data flow

```
tests/public-surface-hygiene.test.ts
  ├─ README.md
  ├─ docs/**
  ├─ tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts
  └─ openspec/specs/dsh-harness-compatibility/spec.md

tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts
  ├─ DEEPSEEK_BASE_URL, DEEPSEEK_API_KEY  -> dsh child environment
  └─ SPECFUSE_DSH_MODEL                   -> cordis.patch.yml model id
```

### Public API surface

No production API changes. The E2E's environment contract is:

```text
SPECFUSE_DSH_E2E=1
DEEPSEEK_BASE_URL=<endpoint>
DEEPSEEK_API_KEY=<credential>
SPECFUSE_DSH_MODEL=<model id>
```

### Error handling

- A missing gate variable prints a skip reason naming the missing input; the suite stays green.
- An executed dsh run that exits non-zero fails the case with its stderr.
- The hygiene guard treats a missing scanned file as a failure, not a skip: every scanned surface is part of the repository.
- No credential value is read from disk or written to the patch.

## Risks / Trade-offs

- **The archive, git history, and npm 0.17.0 still contain the old text.** This change cannot rewrite them without destructive operations. → Record the residual in the apply report; a separate history rewrite and release is required.
- **`SPECFUSE_DSH_MODEL` adds a setup step.** → The skip reason and both docs name it explicitly.
- **A denylist can false-positive on a legitimate future mention.** → The guard scans only public surfaces, the markers are specific, and public dsh variables are intentionally allowed.

## Migration Plan

Developers who previously relied on the file fallback export the three variables in their shell before running the E2E. No repository file changes are needed. Consumers of the npm package receive the generic guide in the next release; `0.17.0` is not modified. Rollback is restoring the previous docs and test gate; no runtime state is affected.

## Open Questions

None. The automatic decisions selected explicit environment variables, a required model id, public-surface guard scope, and a specific denylist.
