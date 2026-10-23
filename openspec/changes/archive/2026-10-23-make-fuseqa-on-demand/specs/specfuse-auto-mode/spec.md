## REMOVED Requirements

### Requirement: Auto mode enters FuseReview and records FuseQA as declined

**Reason**: FuseQA is no longer part of the pipeline, so there is no FuseQA decision to record. Keeping the record would preserve a beat the product removed.

**Migration**: Record the FuseReview decision only. FuseQA remains available as an explicit `/fuseqa` invocation outside auto mode.

## MODIFIED Requirements

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

### Requirement: Generated CLAUDE.md declares the auto-mode override

`composeCLAUDEmd()` SHALL include an `### Auto Mode: /specfuse` section that declares the overrides above and SHALL NOT remove or weaken the checkpoint rules that govern `/opsx:*` invocations.

#### Scenario: Auto-mode section is present

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the output contains `### Auto Mode: /specfuse` and names the skipped questions, the default model decision, the FuseReview entry, verify-before-archive, and the no-commit/no-push rule

#### Scenario: FuseQA stays on demand

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the auto-mode section states that FuseQA is not entered automatically and remains available only through an explicit `/fuseqa` invocation

#### Scenario: Interactive rules are preserved

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the model-switch and FuseReview checkpoint sections still require their questions for `/opsx:apply`

#### Scenario: No third checkpoint is introduced

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the interactive apply exit path contains exactly the FuseReview checkpoint question, and auto mode adds no new question

## ADDED Requirements

### Requirement: Auto mode enters FuseReview and leaves FuseQA on demand

Under `/specfuse`, the FuseReview checkpoint SHALL NOT be asked; the decision SHALL be recorded as `auto: entered`. FuseQA SHALL NOT be invoked and no FuseQA decision SHALL appear in the completion report.

#### Scenario: FuseReview runs automatically

- **WHEN** the last apply task passes verification under `/specfuse`
- **THEN** FuseReview is entered without a question, using a reviewer context that did not implement the change when one is available

#### Scenario: Blocking findings are fixed test-first

- **WHEN** FuseReview reports a Blocking finding
- **THEN** the defect is fixed test-first and only the fix diff is re-reviewed

#### Scenario: FuseQA is not invoked

- **WHEN** the apply exit sequence runs under `/specfuse`
- **THEN** FuseQA is not invoked, no E2E case authoring is performed by the pipeline, and the completion report records the FuseReview decision only
