# specfuse-auto-mode Specification

## Purpose
Defines the `/specfuse` command surface: its unattended decision policy, continuous execution order, worktree isolation, failure handling, and the prohibition on committing or pushing.

## Requirements

### Requirement: Command is installed and invoked as `/specfuse <prompt>`

`composeSpecfuseCommand()` SHALL render a slash-command definition whose argument carries the requirement description through `$ARGUMENTS`. `scaffold()` SHALL write it to `<target>/.claude/commands/specfuse.md` and SHALL NOT overwrite an existing file at that path.

#### Scenario: New project receives the command

- **WHEN** `scaffold()` runs for a new project directory
- **THEN** `.claude/commands/specfuse.md` exists with the rendered command content

#### Scenario: Existing command preserved

- **WHEN** `scaffold()` runs where `.claude/commands/specfuse.md` already exists with custom content
- **THEN** that file's content is unchanged after scaffolding

#### Scenario: Missing prompt stops without asking

- **WHEN** the command is invoked with no argument
- **THEN** it prints usage and stops, and SHALL NOT create a change, generate an artifact, or ask the user a question

#### Scenario: Install surface names the command

- **WHEN** `scaffold()` completes
- **THEN** the printed file listing includes `.claude/commands/specfuse.md`

### Requirement: Decision points are answered with the recommended option and recorded

Under `/specfuse`, the model SHALL answer every pipeline decision point itself using the recommended option, and SHALL record each decision with its rationale in the final report. The decision points are: brainstorming questions, the `/design-md` questionnaire, the model-switch checkpoint, the FuseReview checkpoint, and Path B's per-artifact review. `AskUserQuestion` SHALL NOT be called for any of them. FuseQA is not a decision point because it is not part of the pipeline.

#### Scenario: Brainstorming runs without questions

- **WHEN** `/specfuse` starts on a requirement
- **THEN** the model derives 2–3 alternatives with trade-offs, selects the recommended one, and writes the selection and rationale into `design.md` without asking the user

#### Scenario: Design tokens are generated without a questionnaire

- **WHEN** the three-gate test triggers `/design-md` under `/specfuse`
- **THEN** the questionnaire is answered with recommended values and `DESIGN-TOKENS.md` is generated; an existing `DESIGN-TOKENS.md` is left untouched rather than overwritten

#### Scenario: Model switch defaults to the current model

- **WHEN** `/specfuse` reaches the apply entrance
- **THEN** it records the decision as `continue with current model` and proceeds to TDD without asking

#### Scenario: Path B pace control does not apply

- **WHEN** `/specfuse` generates proposal, specs, design, and tasks
- **THEN** it generates them in one continuous pass and does not stop between artifacts for review

#### Scenario: Decisions are auditable

- **WHEN** `/specfuse` completes or stops
- **THEN** the final report lists every automatic decision and the option chosen, so no decision is invisible

### Requirement: Execution order is continuous

`/specfuse` SHALL execute in this order without waiting for user input: brainstorming decisions, proposal, specs, design, tasks, apply, FuseReview, verify, archive. TDD and `verification-before-completion` SHALL still govern every apply task.

#### Scenario: Artifacts are generated in one pass

- **WHEN** `/specfuse` completes brainstorming
- **THEN** proposal, specs, design, and tasks are written before implementation begins

#### Scenario: Apply follows the task list

- **WHEN** `tasks.md` exists
- **THEN** implementation follows its order and each completed task carries fresh verification evidence

#### Scenario: Review follows apply

- **WHEN** the last task passes verification
- **THEN** FuseReview runs before verify

#### Scenario: Verify precedes archive

- **WHEN** FuseReview completes
- **THEN** the full test suite, lint, and the `/opsx:verify` phase run before archive is attempted

### Requirement: Verify failure blocks archive

`/specfuse` SHALL archive only when `/opsx:verify`, the full test suite, and lint all pass. If any check still fails after best-effort repair, the command SHALL NOT archive, SHALL leave the change directory in place, and SHALL write the failure into the final report.

#### Scenario: Passing verify archives

- **WHEN** `/opsx:verify`, the full test suite, and lint all pass
- **THEN** archive runs and the final report names the archived change

#### Scenario: Verify checks implementation against specs

- **WHEN** the verify phase runs
- **THEN** `/opsx:verify` checks task completion, requirement implementation, and scenario coverage before the full test suite and lint, rather than relying on structural validation alone

#### Scenario: Failing verify preserves the change

- **WHEN** any verify check still fails after best-effort repair
- **THEN** archive does not run, the change directory remains, and the final report identifies each failed check with its raw output

### Requirement: Worktree isolation never merges back

When a Git Worktree trigger condition is met, `/specfuse` SHALL create and enter a dedicated worktree before writing any artifact, and SHALL run the entire pipeline there. It SHALL never merge that worktree back to the trunk, and SHALL leave the worktree in place for the user to inspect. Subagent-driven development SHALL NOT be used under `/specfuse`, because its integration step requires a merge.

#### Scenario: Workspace is selected before artifacts

- **WHEN** a worktree trigger condition is met
- **THEN** the worktree is created and entered before the change directory or any artifact is written, so every artifact stays inside it

#### Scenario: Trigger runs the pipeline in a worktree

- **WHEN** a worktree trigger condition is met
- **THEN** artifact generation, apply, FuseReview, verify, and archive all run inside the worktree

#### Scenario: Worktree creation failure falls back

- **WHEN** worktree creation fails
- **THEN** the pipeline continues in the current working tree and the fallback is recorded in the final report

#### Scenario: Review object covers uncommitted work

- **WHEN** FuseReview runs in auto mode and no commits were made
- **THEN** it reviews the working-tree diff relative to the recorded baseline, including untracked files, rather than an empty `baseline..HEAD`

#### Scenario: No subagent integration path is created

- **WHEN** `/specfuse` applies the change
- **THEN** it does not dispatch implementation subagents, so no subagent worktree requires a merge

#### Scenario: No merge to trunk

- **WHEN** the pipeline finishes inside a worktree
- **THEN** the trunk branch is unchanged and the worktree branch remains unmerged

### Requirement: Auto mode never commits or pushes

`/specfuse` SHALL NOT run `git commit`, `git push`, or `git merge` at any point. All changes remain uncommitted in the working tree or worktree.

#### Scenario: Apply leaves work uncommitted

- **WHEN** apply finishes
- **THEN** no commit exists and the working tree holds the changes

#### Scenario: Final report states the prohibition was honored

- **WHEN** `/specfuse` completes or stops
- **THEN** the final report states that no commit and no push were performed

### Requirement: Generated CLAUDE.md declares the auto-mode override

`composeCLAUDEmd()` SHALL include an `### Auto Mode: /specfuse` section that declares the overrides above and SHALL NOT remove or weaken the checkpoint rules that govern `/opsx:*` invocations. It SHALL also name `/specfuse:full` as the complete variant that enters FuseQA.

#### Scenario: Auto-mode section is present

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the output contains `### Auto Mode: /specfuse` and names the skipped questions, the default model decision, the FuseReview entry, verify-before-archive, and the no-commit/no-push rule

#### Scenario: FuseQA stays on demand

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the auto-mode section states that under `/specfuse` FuseQA is not entered automatically and remains available through an explicit `/fuseqa` invocation or the `/specfuse:full` variant

#### Scenario: Full variant named

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the auto-mode section states that `/specfuse:full` enters FuseQA after FuseReview and before Verify and records both decisions as `auto: entered`

#### Scenario: Interactive rules are preserved

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the model-switch and FuseReview checkpoint sections still require their questions for `/opsx:apply`

#### Scenario: No third checkpoint is introduced

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the interactive apply exit path contains exactly the FuseReview checkpoint question, and auto mode adds no new question

### Requirement: Auto mode enters FuseReview and leaves FuseQA on demand

Under `/specfuse`, the FuseReview checkpoint SHALL NOT be asked; the decision SHALL be recorded as `auto: entered`. FuseQA SHALL NOT be invoked under `/specfuse`, and no FuseQA decision SHALL appear in its completion report. `/specfuse:full` is a separate command governed by the `specfuse-full` capability.

#### Scenario: FuseReview runs automatically

- **WHEN** the last apply task passes verification under `/specfuse`
- **THEN** FuseReview is entered without a question, using a reviewer context that did not implement the change when one is available

#### Scenario: Blocking findings are fixed test-first

- **WHEN** FuseReview reports a Blocking finding
- **THEN** the defect is fixed test-first and only the fix diff is re-reviewed

#### Scenario: FuseQA is not invoked

- **WHEN** the apply exit sequence runs under `/specfuse`
- **THEN** FuseQA is not invoked, no E2E case authoring is performed by that command, and its completion report records the FuseReview decision only
