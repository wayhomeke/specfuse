# openspec-readiness-reporting Specification

## Purpose
TBD - created by archiving change openspec-init-failure-visibility. Update Purpose after archive.

## Requirements

### Requirement: Scaffolding succeeds regardless of OpenSpec readiness

`scaffold(config)` SHALL complete normally and SHALL NOT change its exit path when the OpenSpec CLI cannot be installed or when `openspec init` fails. OpenSpec remains optional.

#### Scenario: Install failure does not reject

- **WHEN** `scaffold(config)` runs with `initOpenspec` true in an environment where the OpenSpec CLI is absent and installing it fails
- **THEN** the returned promise resolves rather than rejecting, and all non-OpenSpec artifacts (`CLAUDE.md`, `.gitignore`, `.claude/settings.local.json`, the skill files and their templates) are present

#### Scenario: Init failure does not reject

- **WHEN** `scaffold(config)` runs with `initOpenspec` true, the OpenSpec CLI is present, and `openspec init` fails
- **THEN** the returned promise resolves rather than rejecting, and all non-OpenSpec artifacts are present

#### Scenario: Built CLI exits zero on the failure path

- **WHEN** the built CLI is invoked with `--yes` in an environment where the OpenSpec CLI is off `PATH` and `npm` exits non-zero
- **THEN** the process exit code is `0`

### Requirement: The opsx line is annotated when OpenSpec is not ready

`scaffold(config)` SHALL annotate the `/opsx:propose` line in `Next steps` with a pointer to the trailing notice when OpenSpec is not ready, and SHALL print that line unannotated otherwise.

#### Scenario: Annotation present when OpenSpec is unavailable

- **WHEN** scaffolding completes with `initOpenspec` true and OpenSpec did not become ready
- **THEN** stdout contains a `/opsx:propose` line whose trailing comment refers the reader to the notice below, and does NOT contain the string `# start your first change`

#### Scenario: Line is verbatim when OpenSpec is ready

- **WHEN** scaffolding completes with `initOpenspec` true and OpenSpec became ready
- **THEN** stdout contains `/opsx:propose   # start your first change` verbatim

#### Scenario: Line is verbatim when the user declined OpenSpec

- **WHEN** scaffolding completes with `initOpenspec` false
- **THEN** stdout contains `/opsx:propose   # start your first change` verbatim and no OpenSpec notice is printed, because nothing was attempted and nothing failed

### Requirement: Next steps keeps its structure

`scaffold(config)` SHALL NOT reorder, remove, or insert lines in the `Next steps` block on the failure path. Only the trailing comment of the `/opsx:propose` line may differ.

#### Scenario: Same lines in the same order on both paths

- **WHEN** stdout from a run where OpenSpec is ready is compared with stdout from a run where it is not
- **THEN** the `Next steps` block of both contains the same lines in the same order — the `cd` line (for a new project), `claude`, then `/opsx:propose` — differing only in that line's trailing comment

#### Scenario: No repair commands inside Next steps

- **WHEN** scaffolding completes with OpenSpec not ready
- **THEN** the `Next steps` block contains no `npm i -g` line and no `openspec init` line; repair commands appear only in the trailing notice

### Requirement: A trailing notice states the missing piece and its repair

`scaffold(config)` SHALL append an end-of-output notice when OpenSpec is not ready, following the shape of the existing Superpowers notice: what is missing, why it matters, and the commands that fix it.

#### Scenario: Notice names the consequence

- **WHEN** scaffolding completes with OpenSpec not ready
- **THEN** the notice states that the `/opsx:*` slash commands are not available, so the generated workflow cannot be entered until OpenSpec is initialized

#### Scenario: Notice appears after Next steps

- **WHEN** scaffolding completes with OpenSpec not ready
- **THEN** the notice's position in stdout is after the `Next steps` block

#### Scenario: No notice on the success path

- **WHEN** scaffolding completes with OpenSpec ready
- **THEN** stdout contains no OpenSpec notice

#### Scenario: Superpowers notice is unaffected

- **WHEN** scaffolding completes in an environment without the Superpowers plugin
- **THEN** the Superpowers notice is printed with its existing wording, independently of OpenSpec readiness

### Requirement: The notice distinguishes install failure from init failure

`scaffold(config)` SHALL report which of the two failure modes occurred, because they require different repair steps.

#### Scenario: Install failure lists both commands

- **WHEN** the OpenSpec CLI is absent and installing it fails
- **THEN** the notice contains both `npm i -g @fission-ai/openspec` and `openspec init --tools claude --force`

#### Scenario: Init failure lists only the init command

- **WHEN** the OpenSpec CLI is present or was installed successfully, but `openspec init` fails
- **THEN** the notice contains `openspec init --tools claude --force` and does NOT instruct the user to install the CLI again

#### Scenario: Readiness is tracked, not inferred from the filesystem

- **WHEN** `scaffold(config)` determines what to print
- **THEN** the decision derives from the outcome recorded by the OpenSpec setup step, not from probing for `.claude/commands/opsx/`, so a pre-existing directory from an earlier run cannot mask a failure in this one
