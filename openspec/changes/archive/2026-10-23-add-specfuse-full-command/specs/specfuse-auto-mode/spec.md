## MODIFIED Requirements

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
