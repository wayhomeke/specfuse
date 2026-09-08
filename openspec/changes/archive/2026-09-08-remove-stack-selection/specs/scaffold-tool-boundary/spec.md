## RENAMED Requirements

The three requirements below keep their identity but widen their scope from
"no CodeGraph" to "no CodeGraph and no stack". Renamed first so the MODIFIED
bodies below match their new headers.

- FROM: `### Requirement: ProjectConfig carries no CodeGraph field`
- TO: `### Requirement: ProjectConfig carries no CodeGraph field and no stack field`

- FROM: `### Requirement: Setup questionnaire asks exactly three questions`
- TO: `### Requirement: Setup questionnaire asks exactly two questions`

- FROM: `### Requirement: Generated .gitignore contains no CodeGraph entry`
- TO: `### Requirement: Generated .gitignore is stack-free and contains no CodeGraph entry`

## MODIFIED Requirements

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
