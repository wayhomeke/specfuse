## MODIFIED Requirements

### Requirement: Checkpoint question is mandatory after apply completion

`renderApplyFuseReview()` output SHALL require the AI to ask the checkpoint question after the final task is verified for `/opsx:apply` invocations, and SHALL forbid silently advancing to verify or archive. Auto-mode invocations are governed by the `specfuse-auto-mode` capability; this requirement SHALL NOT be read as applying to them.

#### Scenario: Mandatory question stated

- **WHEN** `renderApplyFuseReview()` is called
- **THEN** its output contains a MUST-level instruction to ask the user whether to enter FuseReview after the last task passes verification, and states that silent advancement to verify/archive is forbidden for interactive invocations

#### Scenario: Checkpoint assembled into CLAUDE.md

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the output contains the FuseReview checkpoint section positioned between the Do (apply) phase and the FuseQA checkpoint section, with the FuseQA section in turn preceding the Verify phase

#### Scenario: Declining FuseReview does not end the apply exit sequence

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the output states that declining FuseReview still leaves the FuseQA checkpoint mandatory for interactive invocations, so the apply exit sequence is not terminated by a single decline

### Requirement: Baseline is recorded at apply start

`renderApplyFuseReview()` output SHALL require recording the HEAD commit at apply start as the review baseline, and SHALL define a fallback for changes without a recorded baseline. The auto-mode review object, which covers uncommitted work, is governed by the `specfuse-auto-mode` capability.

#### Scenario: Baseline and fallback stated

- **WHEN** `renderApplyFuseReview()` is called
- **THEN** its output requires writing the apply-start HEAD into the change's state, defines the review object as `baseline..HEAD` for interactive invocations, and specifies the merge-base fallback with a report annotation when no baseline is recorded
