## Purpose

Defines the contract for the scaffold tool boundary of SpecFuse: scaffolding performs no CodeGraph detection, installation, or initialization; `ProjectConfig` carries no CodeGraph field; the setup questionnaire asks exactly three questions; the generated `.gitignore` contains no CodeGraph entry; and subprocess calls are guarded against interactive prompts. The capability reflects the removal of all CodeGraph integration from the scaffolder.
## Requirements
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

### Requirement: ProjectConfig carries no CodeGraph field and no stack field

The `ProjectConfig` interface SHALL NOT declare an `initCodegraph` property or a `stack` property, and `collectProjectConfig()` SHALL NOT return either. This is a breaking change to the exported type surface.

#### Scenario: Returned config omits both fields

- **WHEN** `collectProjectConfig()` resolves under any input combination, interactive or `--yes`
- **THEN** the resolved object has no own property named `initCodegraph` and no own property named `stack`

#### Scenario: Config shape carries only the flow fields

- **WHEN** `collectProjectConfig()` resolves
- **THEN** the resolved object carries `projectName`, `initGit`, `initOpenspec`, `targetDir`, and `isExisting`

#### Scenario: Scaffolding ignores stray fields from an untyped caller

- **WHEN** `scaffold(config)` is called by an untyped JavaScript caller passing an object that still includes `initCodegraph: true` and a `stack` object
- **THEN** scaffolding completes normally, spawns no CodeGraph subprocess, and generates no stack-derived content, because neither field is read

### Requirement: Setup questionnaire asks exactly two questions

`collectProjectConfig()` SHALL prompt for git initialization and OpenSpec initialization only. It SHALL NOT present a CodeGraph prompt or any tech-stack question.

#### Scenario: No CodeGraph prompt is shown

- **WHEN** `collectProjectConfig()` runs interactively for a new project
- **THEN** no prompt message contains the text `CodeGraph`

#### Scenario: No tech-stack question is shown

- **WHEN** `collectProjectConfig()` runs interactively for a new project
- **THEN** no prompt message contains the text `stack` or `tech stack`

#### Scenario: Existing-directory init skips the git prompt

- **WHEN** `collectProjectConfig()` runs interactively with the project name omitted or `.`
- **THEN** the git prompt is not shown, `initGit` resolves to `false`, and no CodeGraph or stack prompt is shown

#### Scenario: Non-interactive mode presents no prompts and needs no stack

- **WHEN** `collectProjectConfig()` runs with `--yes` and no `--stack`
- **THEN** no prompt is presented, the resolved config sets `initOpenspec` to `true`, and no error is raised for a missing stack

### Requirement: Generated .gitignore is stack-free and contains no CodeGraph entry

`composeGitignore()` SHALL NOT emit a `.codegraph/` pattern and SHALL NOT emit stack-derived build-output patterns. It SHALL emit only the shared patterns (IDE, OS, environment, logs).

#### Scenario: No CodeGraph entry

- **WHEN** `composeGitignore()` is called
- **THEN** the output contains no `.codegraph/` line

#### Scenario: No stack-derived build patterns

- **WHEN** `composeGitignore()` is called
- **THEN** the output contains none of `/target/`, `node_modules/`, or `/dist/`

#### Scenario: Shared patterns are preserved

- **WHEN** `composeGitignore()` is called
- **THEN** the output contains `.idea/`, `.DS_Store`, `.env`, and `*.log`

#### Scenario: Existing projects keep their CodeGraph line

- **WHEN** scaffolding merges into an existing `.gitignore` that already contains `.codegraph/`
- **THEN** that line is preserved in the merged output, because merging appends missing patterns and never removes lines

