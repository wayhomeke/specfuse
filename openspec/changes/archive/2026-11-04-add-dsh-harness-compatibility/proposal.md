## Why

SpecFuse installs its pipeline only into Claude Code discovery roots: `.claude/skills/` and `.claude/commands/`. DeepSeek Harness (`dsh`) scans `.agents/skills/` and `.dsh/skills/`, and reads `CLAUDE.md`, but it does not scan `.claude/skills/` or `.claude/commands/`. A project scaffolded by SpecFuse therefore gives dsh the pipeline protocol while exposing none of the skills or entry points that protocol names. The pipeline cannot start.

## What Changes

- `scaffold()` installs `design-md`, `fusedoc`, `fusereview`, and `fuseqa` under `.agents/skills/` in addition to `.claude/skills/`, together with their template and reference assets. The same composers render both copies.
- New dsh entry-point skills `.agents/skills/specfuse/SKILL.md` and `.agents/skills/specfuse-full/SKILL.md`, invoked as `/specfuse` and `/specfuse-full`. Both are user-invocable and disabled for model invocation; the text following the invocation is the requirement.
- `initOpenspec()` requests both OpenSpec adapters in one call: `openspec init --tools claude,agents --force`. This produces `.claude/commands/opsx/`, `.claude/skills/openspec-*/`, and `.agents/skills/openspec-*/`, so dsh can invoke the OpenSpec workflows as `/openspec-propose`, `/openspec-verify-change`, and their siblings.
- The FuseDoc skill's self-reference stops naming `.claude/skills/fusedoc/`; it names its own directory instead, so the same body is correct under either root.
- Existing-file preservation extends to `.agents/skills/`: a user-authored skill is never overwritten.
- `README.md` and a new `docs/dsh.md` document dsh installation, the skill/command mapping, model endpoint configuration, and the opt-in real-model E2E.
- E2E coverage: one deterministic distribution case over the built artifact, and one real dsh model case that discovers the skills, confirms the entry skills are not model-visible, and checks the missing-requirement stop.

## Capabilities

### New Capabilities

- `dsh-harness-compatibility`: dsh-discoverable skill distribution, command-equivalent entry skills, dual-adapter OpenSpec initialization, and real dsh verification.

### Modified Capabilities

- `openspec-readiness-reporting`: repair notices and the init invocation name `openspec init --tools claude,agents --force` instead of the Claude-only form.

## Impact

- `src/scaffolder.ts`: distributes shared skills and entry skills to `.agents/skills/`, preserves existing files, and prints the new paths.
- `src/templates/specfuse-command.ts`: adds dsh entry-skill composition over the shared pipeline body.
- `src/templates/fusedoc-skill.ts`: root-agnostic self-reference.
- `src/utils/tools.ts`: dual-adapter OpenSpec init.
- `tests/templates/`, `tests/scaffolder.test.ts`, `tests/utils/tools.test.ts`, `tests/e2e/`: new and updated guards.
- `README.md`, `docs/dsh.md`: dsh usage and endpoint configuration.
- No new runtime dependency. Node 24.9 or newer is required only by dsh and by the opt-in real-model E2E, not by the scaffolder.
