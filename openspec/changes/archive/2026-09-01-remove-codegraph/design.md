## Context

CodeGraph entered SpecFuse in June 2026 as an optional scaffolding step, alongside the OpenSpec integration it structurally mirrors: detect → install → init, gated by a `ProjectConfig` boolean and a setup prompt. That symmetry is misleading. OpenSpec is the pipeline's process engine — `/opsx:*` commands are the Think and Verify beats. CodeGraph indexes code; no beat activates it, no rule in the generated `CLAUDE.md` references it, and the pipeline behaves identically whether it is present or absent.

The integration is not inert. It executes `curl … | sh` against a third-party URL during scaffolding, adds a fourth setup question, and owns three lifecycle functions. That surface produced a concrete failure: on WSL2 `/mnt/*` drives CodeGraph disables its file watcher (upstream issue #199 — recursive `fs.watch` on drvfs is unreliably slow) and then asks the user how to keep the index fresh. Because `codegraph init` calls `offerWatchFallback(clack, projectPath)` with no options, its non-interactive branch is unreachable — the `init` command does not even define a `--yes` flag. Inside the scaffolder's `promisify(exec)` child, stdin is a pipe nobody writes to and stdout is buffered, so the prompt blocks forever and renders nothing. `npm create specfuse` froze with a blank screen.

A fix exists and is currently in the working tree: `CODEGRAPH_FORCE_WATCH=1` makes the watch policy return "watching is fine", so the fallback returns before prompting. It works, but it wins by overriding a correct upstream judgment — leaving WSL2 users a sluggish watcher instead of the git-hook fallback CodeGraph meant to offer. Needing to defeat a dependency's own decision is the signal that the integration sits at the wrong layer.

The same working-tree change also hardened *all* subprocess calls — OpenSpec included — with closed stdin, timeout tiers, and `SIGKILL`. Those guards address the general failure mode (a third-party CLI prompting inside a non-interactive child), not CodeGraph specifically, and outlive this removal.

## Goals / Non-Goals

**Goals:**

- Remove every CodeGraph code path from the scaffolder: detection, installation, initialization, orchestration, the setup prompt, the `ProjectConfig` field, the PATH hint, and the generated `.gitignore` entry.
- Preserve the non-interactive subprocess guards and keep them under test, re-pointed at the OpenSpec calls that now depend on them.
- Leave the scaffolder's structure otherwise untouched, so the diff reads as deletion rather than refactor.
- Make removal mechanically verifiable: `grep -ri codegraph src/` returns nothing.

**Non-Goals:**

- Retrofitting existing projects. The brownfield merge is append-only by design.
- Removing CodeGraph from any contributor's local environment or MCP configuration. This governs what SpecFuse *generates*.
- Introducing a plugin or extension mechanism to make CodeGraph re-attachable. No consumer has asked for one (YAGNI); users install it directly.
- Version bump and release.

## Decisions

### D1: Delete the code rather than gate it behind a disabled flag

Remove the functions and their call sites outright, instead of defaulting the prompt to "no" or hiding it behind an env var.

*Why:* A disabled feature retains its full maintenance surface — the installer, the three functions, the config field, and their tests all keep compiling and keep needing care, to serve a path nobody takes. Deletion is also the only option that makes the boundary claim honestly: SpecFuse orchestrates process, and CodeGraph is not process.

*Alternative considered:* keep the integration with the `CODEGRAPH_FORCE_WATCH` fix. Rejected — it works only by overriding a legitimate upstream performance decision, and it leaves SpecFuse owning every prompt CodeGraph adds in future versions.

### D2: Retain the non-interactive guards; re-point their tests at OpenSpec

Keep `NONINTERACTIVE` (`stdio: ['ignore', 'pipe', 'pipe']`, `killSignal: 'SIGKILL'`), the three timeout tiers, and the `opts()` helper. Delete only `CODEGRAPH_ENV`.

*Why:* The guards defend against a failure mode, not a vendor. `openspec init --tools claude --force` is likewise a third-party CLI in a non-interactive child; it does not prompt today, which is not a guarantee about tomorrow. The empirical lesson from the incident is worth keeping: closing stdin is *not* sufficient — measurement showed clack keeps blocking after EOF — so the timeout is the only hard bound on a hang. `stdio: 'ignore'` still earns its line: most prompt libraries (inquirer, prompts, readline) exit on EOF, so it converts the common case into a fast failure instead of a full timeout wait.

*Consequence:* the six hardening tests written for `initCodegraph` must not be deleted with it. Their assertions move to `detectOpenspec`/`installOpenspec`/`initOpenspec`, or the retained guards ship untested.

*Alternative considered:* revert to bare `execShell` since OpenSpec has never hung. Rejected — it discards knowledge bought with a real incident to save a few lines.

### D3: Remove `initCodegraph` from `ProjectConfig` outright (BREAKING)

*Why:* This package ships as `npm create specfuse` — a one-shot scaffolder. `files` publishes only `dist`, `bin`, and `README`, and nothing documents programmatic use. A deprecated field would oblige `prompts.ts` to keep returning it and tests to keep asserting it: dead code with roots. Excess-property errors surface at compile time for any hypothetical caller; runtime is unaffected because the field is simply no longer read.

### D4: Remove `.codegraph/` from the generated `.gitignore`

*Why:* A `.gitignore` entry for a tool SpecFuse does not install is a claim about the user's toolchain that SpecFuse has no standing to make. Users who adopt CodeGraph add one line.

*Accepted cost:* a user who installs CodeGraph independently must ignore `.codegraph/` themselves, or see it in `git status`.

### D5: Let existing projects keep their `.codegraph/` line

*Why:* `mergeGitignore()` appends missing patterns and never removes lines. That append-only property is what makes brownfield merging safe, and the merger cannot distinguish a line SpecFuse wrote from one the user added by hand — so a removal rule would sometimes delete the user's own configuration. Breaking that invariant to tidy one line is a bad trade.

*Accepted cost:* projects scaffolded by earlier versions diverge permanently from new ones. The divergence is visible but harmless — a stale ignore rule breaks nothing.

## Module structure

CodeGraph's footprint spans five modules in one direction; removal is a leaf-first deletion with no edges left dangling.

```
src/index.ts
    └── prompts.ts ──────── collectProjectConfig()
            │                 └── [DELETE] "Enable CodeGraph?" confirm
            │                 └── [DELETE] initCodegraph from returned config
            ▼
        types.ts ─────────── ProjectConfig
            │                 └── [DELETE] initCodegraph: boolean          (BREAKING)
            ▼
      scaffolder.ts ──────── scaffold()
            │                 └── [DELETE] `if (config.initCodegraph)` block  (~28 lines)
            │                 └── [DELETE] `if (config.initCodegraph)` PATH hint (~10 lines)
            │                 └── [EDIT]   import { … } from './utils/tools.js'
            ├── utils/tools.ts
            │       ├── [DELETE] detectCodegraph / installCodegraph / initCodegraph
            │       ├── [DELETE] CODEGRAPH_ENV
            │       └── [KEEP]   NONINTERACTIVE, timeout tiers, opts()  → OpenSpec
            └── templates/gitignore.ts
                    └── [DELETE] '.codegraph/' from SHARED_PATTERNS
```

Dependencies flow inward and unchanged: `templates/` stays pure (no side effects), `utils/` remains the sole subprocess boundary. Nothing that survives imports anything that is removed.

## Public API surface

| Symbol | Before | After |
|---|---|---|
| `ProjectConfig.initCodegraph` | `boolean` (required) | **removed** — BREAKING |
| `detectCodegraph()` | `() => Promise<boolean>` | **removed** |
| `installCodegraph()` | `() => Promise<boolean>` | **removed** |
| `initCodegraph(cwd)` | `(string) => Promise<boolean>` | **removed** |
| `detectOpenspec` / `installOpenspec` / `initOpenspec` | unchanged | unchanged, guards retained |
| `composeGitignore(stack)` | includes `.codegraph/` | same signature, one fewer line emitted |
| `collectProjectConfig(...)` | 4 prompts | same signature, 3 prompts |

`scaffold(config)` keeps its signature; only its `ProjectConfig` input narrows.

## State and control flow

The scaffolder's state is a single `ProjectConfig` threaded from `collectProjectConfig()` into `scaffold()`; there is no shared mutable state and no store. Removing `initCodegraph` narrows that object by one field — the only stateful consequence.

Control flow simplifies in three places: one fewer `confirm()` await in the prompt sequence, one fewer conditional block in `scaffold()`, and one fewer conditional in the closing output. No ordering changes: the CodeGraph block sat between the OpenSpec skills step and `trustDirectory()`, and those become adjacent with no interdependency.

Failure semantics are unaffected. CodeGraph failures were already non-fatal (`spinner.warn`, never a throw), so deleting them removes warning paths but no error handling that anything else relied on.

## Terminal output and accessibility

The scaffolder's user interface is terminal output, so accessibility here means output legibility rather than DOM semantics:

- The removed PATH hint and the three `spinner.warn` messages are the only affected output. Every remaining line keeps its current wording and its `chalk` styling.
- Color remains decorative, never load-bearing: `chalk.yellow`/`chalk.dim` mark emphasis on text that reads correctly uncolored, which matters under `NO_COLOR`, non-TTY pipes, and screen readers.
- Removing a prompt shortens the interactive sequence, which reduces the number of decisions a user must make — a small accessibility gain for keyboard-only and screen-reader users.
- `--yes` mode still requires `--stack`; that contract is untouched.

## Risks / Trade-offs

**[Deleting the six hardening tests along with `initCodegraph`]** → The guards would ship untested and silently regress. Mitigation: D2 makes re-pointing them to the OpenSpec calls an explicit task; the guards' tests must be green *before* the CodeGraph tests are deleted, so coverage never lapses.

**[A residual reference survives the deletion]** → A dangling import breaks the CLI at startup, after tests pass. Mitigation: `npx tsc --noEmit` plus `grep -ri codegraph src/` as an explicit verification step, and a smoke run of `node dist/index.js --help`.

**[Users relying on auto-installed CodeGraph lose it silently]** → Someone who depended on scaffolding to provide the index finds it missing. Accepted: CodeGraph installs in one command, the pipeline never invoked it, and this is the intended behavior change rather than a defect.

**[`ProjectConfig` change breaks a programmatic consumer]** → A hypothetical importer fails to compile. Accepted per D3, marked BREAKING in the proposal; runtime behavior is unaffected.

**[Existing projects diverge permanently]** → New and old projects differ by one `.gitignore` line. Accepted per D5; harmless, and the alternative violates append-only merging.

## Migration Plan

Removal is leaf-first so the build stays green at each step: tests before code, then leaves before their callers.

1. Re-point the six hardening tests from `initCodegraph` to the OpenSpec calls; confirm green. *(Guards stay covered from here on.)*
2. Invert the `.gitignore` assertion in `tests/templates/templates.test.ts` (absence of `.codegraph/`), then remove the pattern from `SHARED_PATTERNS`.
3. Delete the three CodeGraph `it()` blocks in `tests/scaffolder.test.ts` and the CodeGraph tests in `tests/utils/tools.test.ts`.
4. Delete the three functions and `CODEGRAPH_ENV` from `utils/tools.ts`.
5. Remove the orchestration block, the PATH hint, and the import from `scaffolder.ts`.
6. Remove the prompt from `prompts.ts` and the field from `types.ts`.
7. Verify: `npx vitest run`, `npx tsc --noEmit`, `grep -ri codegraph src/`, `npm run build`, and an end-to-end scaffold asserting three prompts and a clean `.gitignore`.

**Rollback:** a single-commit revert. The change adds no migration, touches no persisted state, and leaves no data to undo — scaffolded projects are already-written files that this change never revisits.

## Open Questions

None blocking. Two items are deliberately settled rather than deferred: existing-project cleanup is declined (D5), and documenting the "process vs. tool" boundary in `docs/design-philosophy.md` is out of scope by the proposal's Non-goals — recoverable from this artifact chain if it is ever wanted.
