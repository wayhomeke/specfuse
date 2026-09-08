## Context

The stack layer is the largest and least-used subsystem in SpecFuse. `StackProfile` is a 13-field type threaded through six template composers, but it serves a single product decision the pipeline does not need: *which programming language is the project written in?* The four-beat process — Think → Do → FuseReview → Verify — is invariant across stacks, yet the scaffolder spends its largest surface specializing five artifacts around a choice the user's own project tooling already encodes.

The current architecture:

```
src/index.ts (CLI)
    └── --stack / --stack-from → loadCustomStack()
    └── collectProjectConfig(projectName, stackArg, customStack, yes)
            └── getBuiltinStacks() / detectStacks() / promptFullStackList()
            └── ProjectConfig { stack, ... }
    └── scaffold(config)
            ├── composeGitignore(stack)          → stack.gitignorePatterns + shared
            ├── composeCLAUDEmd(ctx.stack)       → Tech Stack block + test/lint commands
            ├── composeClaudeSettings(stack)     → stack.permissions + shared
            ├── composeFuseReviewSkill(ctx.stack)→ Stack-adaptive checks section
            └── composeOpenspecConfig(ctx.stack) → openspecContext + openspecRules
```

Every edge above is a dependency this change removes. `src/stacks/` (17 files) exists solely to populate `ProjectConfig.stack`; `detect.ts` guesses the stack from marker files; `schema.ts` validates custom YAML profiles. None of it influences the pipeline's control flow — the beats run identically for Rust and React. It is additive complexity with no process value.

Two existing specs reference the stack layer and require deltas:
- `openspec/specs/scaffold-tool-boundary/spec.md` — lists `stack` in the returned config shape, names "tech stack" in the questionnaire requirement, and asserts `--stack` is required with `--yes`.
- `openspec/specs/fusereview-skill-generation/spec.md` — requires a stack-adaptive checks section derived from `ctx.stack.errorHandling`/`ctx.stack.concurrency`.

## Goals / Non-Goals

**Goals:**

- Delete the entire stack layer: `StackProfile`/`StackCommands` types, `src/stacks/`, stack selection/detection in `prompts.ts`, `--stack`/`--stack-from` CLI options, and stack-driven logic in all six template composers.
- Make every generated artifact stack-free: `CLAUDE.md` (no Tech Stack block, generic verification commands), `.gitignore` (shared patterns only), `.claude/settings.local.json` (shared permissions only), `openspec/config.yaml` (stack-agnostic rule set), FuseReview skill (no stack-adaptive section).
- Make `--yes` work without `--stack`; interactive mode asks only about git and OpenSpec.
- Collapse the per-stack test suites into single stack-free suites.
- Make removal mechanically verifiable: `grep -riE "stack-profile|StackProfile|--stack" src/` returns nothing.

**Non-Goals:**

- Adding stack auto-detection to replace the prompt. The project's own files declare its stack; SpecFuse has nothing to add.
- Moving stack profiles into generated projects, or preserving a `generic` fallback.
- Touching the design-md archetype system (`src/design-md/`), which is orthogonal.
- Updating README.md's stack sections in this change — a separate `docs:` commit (recorded in the proposal's Non-goals).
- Editing archived changes in `openspec/changes/archive/`.

## Decisions

### D1: Delete the stack layer outright rather than gate it

Remove the types, the `src/stacks/` directory, the prompt paths, the CLI options, and the template logic in one coordinated removal. No flags, no disabled branches, no `generic` fallback.

*Why:* A disabled subsystem retains its full maintenance surface — 17 files and six threaded call sites keep compiling and keep needing care, serving a path nobody takes. Deletion is the only option consistent with the boundary claim: SpecFuse orchestrates process, and stack knowledge is the project's, not SpecFuse's.

### D2: Generalize the verification commands in `CLAUDE.md` to project-owned wording

`renderApplyPhase` currently emits `Run the actual verification command in the terminal (\`${stack.commands.test}\`)`; `renderVerifyPhase` emits the full test suite and lint commands. Without a stack, these become:

- IRON LAW step: "Run the project's test command in the terminal"
- Verify phase: "Run the full test suite" / "Run the linter" (the specific commands are whatever the project's `CLAUDE.md` declares)

*Why:* The IRON LAW's force comes from *requiring evidence*, not from naming a specific command. The project's own `CLAUDE.md` — which the user maintains — is the authority on its build/test/lint commands. SpecFuse naming them was a convenience that required the stack layer; the convenience is not worth the subsystem.

### D3: Emit stack-agnostic `openspec/config.yaml` rules

`composeOpenspecConfig` drops `stack.openspecContext` and `stack.openspecRules`, replacing them with a single hardcoded rule set covering only the methodological invariants that hold for any project:

- **proposal**: Non-goals section, Trade-offs with ≥2 alternatives, reference affected modules by name, keep under 800 words
- **design**: dependency diagram, public API surface, error-handling strategy
- **specs**: independently testable, success + failure behaviors, boundary conditions, reference concrete symbols
- **tasks**: ≤2-hour chunks, verifiable done-definitions, TDD order, verification command per task, explicit blocking dependencies

*Why:* These are process constraints, not stack constraints. The proposal/design/specs/tasks rules that reference language-specific constructs (crates, hooks, traits) are dropped; the methodological ones survive. This is the "keep the process, drop the stack" boundary applied to the one artifact that carries per-artifact rules.

### D4: Emit shared-only `.gitignore` and `.claude/settings.local.json`

`composeGitignore` emits `SHARED_PATTERNS` (IDE, OS, env, logs, temp) and nothing else. `composeClaudeSettings` emits `SHARED_PERMISSIONS` (git, openspec, find, rg, grep, wc, tree, WebSearch) and nothing else.

*Why (explicit user decision):* build-output patterns (`node_modules/`, `/target/`, `/dist/`) and stack command permissions (`cargo test *`, `pytest *`) are the project's commit-time judgment. Seeding a Rust-only pattern into a JS project — or cargo permissions into a Python one — is noise. The model decides at commit time with full context, so SpecFuse should not pre-seed guesses.

### D5: Delete the FuseReview stack-adaptive section

`composeFuseReviewSkill` drops the `## Stack-adaptive checks` section and its `stack.errorHandling`/`stack.concurrency` injection. The eleven checks stand alone; the lifecycle-concurrency check already covers lifecycle, cancellation, and shared-state review.

*Why (explicit user decision):* A stack-adaptive section with no stack data to drive it is an empty reminder. The eleven checks are self-contained and complete; removing the section keeps the skill stack-free without losing review substance.

### D6: `--yes` no longer requires `--stack`; interactive mode asks two questions

With `stackArg` and `customStack` gone, `collectProjectConfig` simplifies. For a new project: git + OpenSpec confirms. For existing-directory init: OpenSpec confirm only (git is always `false`). `--yes` skips both and sets `initGit`/`initOpenspec` to `true`. The `--stack is required with --yes` error disappears.

*Why:* The stack requirement existed only to populate `ProjectConfig.stack`. Removing the field removes the constraint. `--yes` becomes a pure "accept defaults" flag.

## Module structure

Removal is leaf-first; nothing that survives imports anything removed. Post-change:

```
src/index.ts
    └── collectProjectConfig(projectName, yes)     — no stack args
    └── scaffold(config)                            — ProjectConfig without stack
            ├── composeGitignore()                  — shared patterns only
            ├── composeCLAUDEmd(ctx)                — ctx { projectName } only
            ├── composeClaudeSettings()             — shared permissions only
            ├── composeFuseReviewSkill(ctx)         — no stack section
            └── composeOpenspecConfig()             — stack-agnostic rules
```

`TemplateContext` shrinks to `{ projectName }`. `ProjectConfig` loses `stack`. The `src/stacks/` directory and `tests/stacks/` are deleted.

## Public API surface

| Symbol | Before | After |
|---|---|---|
| `ProjectConfig.stack` | `StackProfile` (required) | **removed** — BREAKING |
| `TemplateContext.stack` | `StackProfile` (required) | **removed** |
| `StackProfile` / `StackCommands` | exported types | **deleted** |
| `collectProjectConfig(projectName, stackArg?, customStack?, yes?)` | 4 args | `(projectName, yes?)` |
| `composeGitignore(stack)` | takes stack | no arg |
| `composeCLAUDEmd(ctx)` | ctx.stack used | ctx `{ projectName }` |
| `composeClaudeSettings(stack)` | takes stack | no arg |
| `composeFuseReviewSkill(ctx)` | ctx.stack used | no stack section |
| `composeOpenspecConfig(ctx)` | ctx.stack used | no arg |
| `--stack <id>` / `--stack-from <path>` | CLI options | **removed** |
| `loadCustomStack(path)` | `stacks/index.ts` export | **deleted** |

## State and control flow

The scaffolder's state is the single `ProjectConfig` object threaded from `collectProjectConfig()` to `scaffold()`. Removing `stack` narrows it by one field — the only stateful consequence.

Control flow simplifies in three places: `collectProjectConfig` loses the four-way stack-resolution branch (custom → arg → error → detect → prompt) down to a straight line; `index.ts` loses the `loadCustomStack` import and option plumbing; the CLI `opts` type narrows from `{ stack, stackFrom, yes }` to `{ yes }`.

## Terminal output and accessibility

The scaffolder's interface is terminal output:

- The stack-selection prompt is the largest interactive surface removed; interactive init drops from three questions (git, OpenSpec, stack) to two (or one for existing dirs). Fewer decisions is a small accessibility gain for keyboard-only and screen-reader users.
- No remaining output changes wording or `chalk` styling. Color remains decorative, never load-bearing (`NO_COLOR`, non-TTY, screen readers all read the uncolored text fine).
- `--yes` behavior changes: it now works standalone instead of requiring `--stack`. This is a CLI contract change surfaced in the help text.

## Risks / Trade-offs

**[Per-stack test suites collapse to single suites]** → Loop-based tests (`for (const stack of getBuiltinStacks())`) must be rewritten, not just deleted, or the stack-free invariants they encode (FUSION markers, IRON LAW, conventions) lose coverage. Mitigation: D-collapse task rewrites each `describe(stack.id)` block into one flat suite asserting the invariant once; the count of assertions stays proportional to the invariant, not to 15 stacks.

**[The `stack` field removal breaks an untyped caller]** → A hypothetical programmatic consumer passing `stack` gets a TS excess-property error at compile time; runtime is unaffected because the field is no longer read. Accepted per the proposal's BREAKING marker; SpecFuse ships as a one-shot CLI, not an imported library.

**[Verification commands become less specific]** → `CLAUDE.md` no longer names `cargo test` / `npx vitest run`. A user must write their project's commands into their own `CLAUDE.md`. Accepted: the project's own `CLAUDE.md` is the authority, and the IRON LAW's force is the evidence requirement, not the command string.

**[Shared-only `.gitignore` lets build output through]** → A fresh scaffolded project may show `node_modules/` or `/target/` in `git status` until the model adds them at first commit. Accepted per D4: the model decides with full context; pre-seeded guesses are noise.

**[`config.yaml` rules become less stack-specific]** → Proposals/designs no longer get "reference crates" style hints. Accepted: the methodological invariants remain; the stack-specific hints were the part being deleted by definition.

## Migration Plan

Leaf-first, tests before code, build green at each step:

1. Collapse the per-stack test suites in `tests/templates/claude-md.test.ts` and `tests/templates/templates.test.ts` to single stack-free suites asserting each invariant once; delete `tests/stacks/`. Green.
2. Delete `src/stacks/` (17 files) and `tests/stacks/` (2 files). Typecheck fails where imports remain — expected; the next step resolves them.
3. Remove `stack` from `types.ts`; shrink `TemplateContext` to `{ projectName }`.
4. Simplify `prompts.ts` (no stack resolution, two/four-way branch to straight line); update `index.ts` (drop options + import); update `scaffolder.ts` call sites to the new `compose*` signatures.
5. Rewrite the five `compose*` functions to be stack-free (generalized commands, shared-only patterns/permissions, stack-agnostic rules, no stack-adaptive section).
6. Update the delta specs to the stack-free contract (`scaffold-tool-boundary`, `fusereview-skill-generation`).
7. Verify: `npx vitest run`, `npx tsc --noEmit`, `grep -riE "stack-profile|StackProfile|--stack" src/`, `npm run build && node dist/index.js --help`, and an end-to-end scaffold asserting two prompts (or one for existing dirs) and stack-free artifacts.

**Rollback:** a single-commit revert. No migration, no persisted state, no data to undo.

## Open Questions

None blocking. Two items are deliberately settled rather than deferred: build-output `.gitignore` patterns are left to the model at commit time (D4), and README.md's stack sections ship as a separate `docs:` commit (recorded in the proposal's Non-goals).
