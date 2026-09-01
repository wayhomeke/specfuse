## Why

CodeGraph is a code-indexing tool, not a pipeline component. SpecFuse's job is to orchestrate a *process* — Think → Do → FuseReview → Verify — and every generated artifact serves that orchestration. CodeGraph serves none of it: no pipeline beat activates it, no discipline rule references it, and removing it changes no phase of the workflow. It was integrated because it was useful, not because it belonged.

Bundling it costs more than it returns. The scaffolder auto-installs a third-party binary via `curl | sh`, adds a fourth setup question, and owns three lifecycle functions for a tool the pipeline never invokes. That surface produced a real failure: on WSL2 `/mnt/*` drives, CodeGraph disables its file watcher and asks the user how to keep the index fresh — a prompt that deadlocks inside the scaffolder's non-interactive child process, freezing `npm create specfuse` with no visible output. Users can install CodeGraph independently in one command; SpecFuse should not carry that risk on their behalf.

## What Changes

- **BREAKING** Remove `initCodegraph` from the `ProjectConfig` interface. Programmatic callers passing this field will see a TypeScript excess-property error (runtime behavior is unaffected — the field is simply no longer read).
- Remove the "Enable CodeGraph code knowledge graph?" prompt. Scaffolding drops from four setup questions to three (git, OpenSpec, stack).
- Remove `detectCodegraph()`, `installCodegraph()`, and `initCodegraph()` from `src/utils/tools.ts`, including the `curl | sh` remote-install path.
- Remove the CodeGraph orchestration block from `scaffold()`, including its failure warnings and the `~/.local/bin` PATH hint that existed solely to make the `codegraph` binary reachable.
- Remove `.codegraph/` from the generated `.gitignore`. Newly scaffolded projects will carry no CodeGraph trace of any kind.
- **Retain** the non-interactive execution guards (`stdio: ['ignore', …]`, `timeout`, `killSignal: 'SIGKILL'`, and the three timeout tiers) introduced alongside the deadlock fix. These now protect the remaining OpenSpec subprocess calls.

## Non-goals

- **Not cleaning up existing projects.** The brownfield merge strategy is append-only: `mergeGitignore()` adds missing patterns and never removes lines. Projects scaffolded by earlier versions keep their `.codegraph/` line indefinitely. Teaching the merger to delete would break the property that makes brownfield merging safe, and the merger cannot distinguish a line SpecFuse wrote from one the user added by hand.
- **Not discouraging CodeGraph.** This change removes an integration, not an endorsement. Users who want CodeGraph install it directly; SpecFuse simply stops doing it for them.
- **Not documenting the boundary rationale in `docs/design-philosophy.md`.** The reasoning lives in this artifact chain and is recoverable from the archive.
- **Not bumping the package version.** Version bumps are separate `chore:` commits in this repository's history and remain a release-time decision.
- **Not removing the CodeGraph MCP server** from any developer's local Claude Code configuration. This change governs what SpecFuse *generates*, not what a contributor runs locally.

## Trade-offs

**Alternative 1 — Keep the integration, keep the deadlock fix.** The `CODEGRAPH_FORCE_WATCH=1` fix works: it makes the watch policy return "watching is fine" so the blocking prompt never renders. Rejected because the fix overrides a legitimate upstream performance judgment (recursive `fs.watch` genuinely is slow on drvfs, upstream issue #199), leaving WSL2 users with a sluggish watcher instead of the git-hook fallback CodeGraph would have offered them. Working around an upstream tool's correct decision is a sign the integration is in the wrong place — and it leaves SpecFuse owning every future prompt CodeGraph adds.

**Alternative 2 — Keep the integration, default the prompt to "no".** Cheaper, and it removes the deadlock from the default path. Rejected because it keeps all three lifecycle functions, the `curl | sh` installer, and the `ProjectConfig` field alive to serve a feature nobody is opted into by default — carrying the full maintenance surface for near-zero use.

**Alternative 3 — Keep `.codegraph/` in the generated `.gitignore`.** A one-line courtesy to users who install CodeGraph independently, costing nothing. Rejected in favor of a clean boundary: a `.gitignore` entry for a tool SpecFuse does not install is a claim about the user's toolchain that SpecFuse has no basis to make. Users who adopt CodeGraph add one line themselves.

**Alternative 4 — Retain `initCodegraph` as a deprecated optional field.** Preserves type compatibility for any programmatic consumer. Rejected because this package ships as `npm create specfuse` — a one-shot scaffolder, not an imported library — and a retained field grows roots: `prompts.ts` must keep returning it and tests must keep asserting it, sustaining dead code to protect a hypothetical caller.

## Capabilities

### New Capabilities

None. CodeGraph integration was never governed by a spec — it entered the codebase in June 2026 without one, and `openspec/specs/` contains no requirement describing it. This change removes unspec'd behavior, so no new capability is introduced and no delta spec has an existing requirement to amend.

The specs artifact for this change will therefore document the **post-removal contract** of the scaffolding surface it touches: that `scaffold()` performs no CodeGraph detection, installation, or initialization; that `collectProjectConfig()` asks exactly three setup questions; that the generated `.gitignore` contains no `.codegraph/` entry; and that the non-interactive subprocess guards remain in force for OpenSpec calls.

### Modified Capabilities

None. No existing spec in `openspec/specs/` states a requirement about CodeGraph, the setup questionnaire's length, or the generated `.gitignore`'s CodeGraph entry.

## Impact

**Source (6 files):**
- `src/types.ts` — remove `initCodegraph` field from `ProjectConfig` (**BREAKING**)
- `src/prompts.ts` — remove the CodeGraph confirm prompt and the field from the returned config
- `src/scaffolder.ts` — remove the orchestration block, the import of the three functions, and the `~/.local/bin` PATH hint
- `src/utils/tools.ts` — remove `detectCodegraph`, `installCodegraph`, `initCodegraph`, and the `CODEGRAPH_ENV` constant; retain `NONINTERACTIVE`, the timeout tiers, and the `opts()` helper for OpenSpec
- `src/templates/gitignore.ts` — remove `.codegraph/` from `SHARED_PATTERNS`

**Tests (3 files):** `tests/utils/tools.test.ts` (~43 references, including the six deadlock-hardening tests whose CodeGraph-specific assertions must be re-pointed at the OpenSpec calls that retain the guards), `tests/scaffolder.test.ts` (~35 references across three CodeGraph `it()` blocks), `tests/templates/templates.test.ts` (one per-stack assertion that `.gitignore` contains `.codegraph/`, which inverts to asserting its absence).

**Dependencies:** none added or removed — CodeGraph was invoked as an external binary, never imported as a package.

**User-visible:** one fewer setup question; no `curl | sh` execution during scaffolding; no `.codegraph/` line in newly generated `.gitignore` files; no PATH warning. Existing projects are untouched.

## Verification strategy

- `npx vitest run` — full suite green, with CodeGraph tests removed and the retained-guard tests re-pointed at OpenSpec calls.
- `npx tsc --noEmit` — proves no residual reference to the removed `ProjectConfig` field or the deleted functions.
- `grep -ri codegraph src/` returns no matches — the mechanical check that removal is total rather than partial.
- `npm run build && node dist/index.js --help` — the CLI still starts, confirming no dangling import.
- End-to-end scaffold into a scratch directory: assert exactly three prompts, assert the generated `.gitignore` has no `.codegraph/` entry, and assert the run completes without network access to the CodeGraph install script.
