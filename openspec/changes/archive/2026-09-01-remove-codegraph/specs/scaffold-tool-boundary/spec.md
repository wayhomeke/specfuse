## ADDED Requirements

### Requirement: Scaffolding performs no CodeGraph detection, installation, or initialization

`scaffold(config)` SHALL NOT detect, install, or initialize CodeGraph, and `src/utils/tools.ts` SHALL NOT export `detectCodegraph`, `installCodegraph`, or `initCodegraph`. No scaffolding path SHALL execute the CodeGraph remote install script.

#### Scenario: No CodeGraph lifecycle functions are exported

- **WHEN** the module `src/utils/tools.ts` is imported
- **THEN** it exports `detectOpenspec`, `installOpenspec`, and `initOpenspec`, and exports none of `detectCodegraph`, `installCodegraph`, or `initCodegraph`

#### Scenario: A full scaffold spawns no CodeGraph subprocess

- **WHEN** `scaffold(config)` runs to completion with any valid `ProjectConfig`
- **THEN** no spawned command string contains `codegraph`, and no spawned command string contains the CodeGraph install URL `raw.githubusercontent.com/colbymchenry/codegraph`

#### Scenario: Source tree retains no CodeGraph reference

- **WHEN** the `src/` tree is searched case-insensitively for the literal `codegraph`
- **THEN** no match is found in any file

#### Scenario: Scaffolding succeeds with no network access to the install script

- **WHEN** `scaffold(config)` runs in an environment where `raw.githubusercontent.com` is unreachable
- **THEN** scaffolding completes successfully and reports no CodeGraph-related warning

### Requirement: ProjectConfig carries no CodeGraph field

The `ProjectConfig` interface SHALL NOT declare an `initCodegraph` property, and `collectProjectConfig()` SHALL NOT return one. This is a breaking change to the exported type surface.

#### Scenario: Returned config omits the field

- **WHEN** `collectProjectConfig()` resolves under any input combination, interactive or `--yes`
- **THEN** the resolved object has no own property named `initCodegraph`

#### Scenario: Config shape is otherwise unchanged

- **WHEN** `collectProjectConfig()` resolves
- **THEN** the resolved object still carries `projectName`, `stack`, `initGit`, `initOpenspec`, `targetDir`, and `isExisting`

#### Scenario: Scaffolding ignores a stray field from an untyped caller

- **WHEN** `scaffold(config)` is called by an untyped JavaScript caller passing an object that still includes `initCodegraph: true`
- **THEN** scaffolding completes normally and spawns no CodeGraph subprocess, because the field is never read

### Requirement: Setup questionnaire asks exactly three questions

`collectProjectConfig()` SHALL prompt for git initialization, OpenSpec initialization, and tech stack only. It SHALL NOT present a CodeGraph prompt.

#### Scenario: No CodeGraph prompt is shown

- **WHEN** `collectProjectConfig()` runs interactively for a new project
- **THEN** no prompt message contains the text `CodeGraph`

#### Scenario: Existing-directory init skips the git prompt

- **WHEN** `collectProjectConfig()` runs interactively with the project name omitted or `.`
- **THEN** the git prompt is not shown, `initGit` resolves to `false`, and no CodeGraph prompt is shown

#### Scenario: Non-interactive mode presents no prompts

- **WHEN** `collectProjectConfig()` runs with `--yes` and an explicit `--stack`
- **THEN** no prompt is presented and the resolved config sets `initOpenspec` to `true`

#### Scenario: Non-interactive mode still requires an explicit stack

- **WHEN** `collectProjectConfig()` runs with `--yes` and no `--stack` and no custom stack profile
- **THEN** it rejects with an error stating that `--stack` is required with `--yes`

### Requirement: Generated .gitignore contains no CodeGraph entry

`composeGitignore(stack)` SHALL NOT emit a `.codegraph/` pattern for any stack profile.

#### Scenario: Pattern is absent for every built-in stack

- **WHEN** `composeGitignore(stack)` is called for each stack returned by `getBuiltinStacks()`
- **THEN** the output contains no `.codegraph/` line

#### Scenario: Surrounding shared patterns are preserved

- **WHEN** `composeGitignore(stack)` is called for any stack
- **THEN** the output still contains `.idea/`, `.DS_Store`, `.env`, and `*.log`, and still contains every pattern in that stack's `gitignorePatterns`

#### Scenario: Existing projects keep their CodeGraph line

- **WHEN** scaffolding merges into an existing `.gitignore` that already contains `.codegraph/`
- **THEN** that line is preserved in the merged output, because merging appends missing patterns and never removes lines

### Requirement: Subprocess calls are guarded against interactive prompts

Every subprocess spawned by `src/utils/tools.ts` SHALL be launched with stdin closed, a positive timeout, and `killSignal: 'SIGKILL'`, so that a third-party CLI that stops to ask a question fails within a bounded time instead of hanging indefinitely. These guards SHALL NOT set `CODEGRAPH_NO_WATCH`.

#### Scenario: OpenSpec calls carry the guards

- **WHEN** `detectOpenspec()`, `installOpenspec()`, or `initOpenspec(cwd)` spawns a subprocess
- **THEN** the options passed set `stdio` to `['ignore', 'pipe', 'pipe']`, set `timeout` to a value greater than zero, and set `killSignal` to `'SIGKILL'`

#### Scenario: A hung subprocess is reported as failure, not a hang

- **WHEN** a subprocess spawned by `initOpenspec(cwd)` is killed after exceeding its timeout
- **THEN** the function resolves to `false` rather than rejecting or blocking

#### Scenario: Probe and long-running calls use proportionate timeouts

- **WHEN** the timeout of a version-probe call is compared with that of an install or init call
- **THEN** the probe timeout is the shorter of the two, and both are greater than zero

#### Scenario: Profile configuration failure is non-fatal

- **WHEN** `initOpenspec(cwd)` succeeds but the subsequent OpenSpec profile configuration fails
- **THEN** `initOpenspec` still resolves to `true`

## REMOVED Requirements

### Requirement: CodeGraph scaffolding integration

**Reason**: CodeGraph is a code-indexing tool, not a pipeline component. No pipeline beat activates it and no rule in the generated `CLAUDE.md` references it, so bundling its installation added a `curl | sh` execution, a fourth setup prompt, and three lifecycle functions without serving the orchestration SpecFuse exists to provide. The integration also deadlocked `npm create specfuse` on WSL2 `/mnt/*` drives, where CodeGraph disables its file watcher and then asks an unanswerable question inside a non-interactive child process.

**Migration**: Install CodeGraph independently — `curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh`, then `codegraph init -i && codegraph install` in the project directory. Add `.codegraph/` to `.gitignore` manually. Projects scaffolded by earlier versions are unaffected: their existing `.codegraph/` ignore line is preserved by the append-only merge, and any previously initialized index keeps working.
