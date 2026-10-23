## Purpose

Defines the `/specfuse:full` command: the complete unattended pipeline that runs brainstorming, artifacts, apply, FuseReview, FuseQA, verify, and archive without prompting, while `/specfuse` remains the four-beat default with FuseQA on demand.

## ADDED Requirements

### Requirement: The full command is installed and invoked as `/specfuse:full`

`composeSpecfuseFullCommand()` SHALL render a slash command at `.claude/commands/specfuse/full.md`, invoked as `/specfuse:full <requirement description>` with the prompt carried through `$ARGUMENTS`. `scaffold()` SHALL write it and SHALL NOT overwrite an existing file at that path.

#### Scenario: New project receives the full command

- **WHEN** `scaffold()` runs for a new project directory
- **THEN** `.claude/commands/specfuse/full.md` exists with the rendered command content

#### Scenario: Existing command preserved

- **WHEN** `scaffold()` runs where `.claude/commands/specfuse/full.md` already exists with custom content
- **THEN** that file's content is unchanged after scaffolding

#### Scenario: Missing prompt stops without asking

- **WHEN** `/specfuse:full` is invoked with no argument
- **THEN** it prints usage as `/specfuse:full <requirement description>` and stops, without creating a change, generating an artifact, or asking a question

#### Scenario: Install surface names the command

- **WHEN** `scaffold()` completes
- **THEN** the printed file listing includes `.claude/commands/specfuse/full.md`

### Requirement: The full pipeline runs FuseQA between FuseReview and Verify

`composeSpecfuseFullCommand()` output SHALL order the phases as brainstorming decisions, proposal, specs, design, tasks, apply, FuseReview, FuseQA, verify, and archive. FuseQA SHALL run after FuseReview and before Verify, so its new E2E cases are included in the full test run. TDD, `verification-before-completion`, verify-gates-archive, and the no-commit/no-push prohibition SHALL apply unchanged.

#### Scenario: Phase order stated

- **WHEN** `composeSpecfuseFullCommand()` is called
- **THEN** its output names FuseReview, then FuseQA, then Verify, then archive, in that order

#### Scenario: FuseQA runs before the full suite

- **WHEN** the full command is followed
- **THEN** FuseQA authors its cases before the Verify phase runs the project's full test suite

#### Scenario: Verify failure blocks archive

- **WHEN** any verify check still fails after best-effort repair
- **THEN** archive does not run, the change directory remains, and the final report identifies each failed check with its raw output

#### Scenario: No commit or push

- **WHEN** the full command runs
- **THEN** it never runs `git commit`, `git push`, or `git merge`

### Requirement: FuseQA is entered automatically and recorded

Under `/specfuse:full`, FuseQA SHALL be invoked automatically as an explicit pipeline step, SHALL NOT become a checkpoint question, and SHALL be recorded as `auto: entered`. The completion report SHALL carry both the FuseReview and FuseQA decisions.

#### Scenario: FuseQA entered without a question

- **WHEN** FuseReview completes under `/specfuse:full`
- **THEN** FuseQA is invoked without `AskUserQuestion`, and its decision is recorded as `auto: entered`

#### Scenario: Both decisions reported

- **WHEN** the full command completes or stops
- **THEN** the final report records the FuseReview decision and the FuseQA decision

### Requirement: The generated CLAUDE.md names the full variant

`composeCLAUDEmd()` SHALL state that `/specfuse:full` is the variant that enters FuseQA, while `/specfuse` leaves FuseQA on demand.

#### Scenario: Full variant named

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the Auto Mode section names `/specfuse:full` and states that it enters FuseQA after FuseReview and before Verify

#### Scenario: Default command unchanged

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the section still states that `/specfuse` does not invoke FuseQA automatically
