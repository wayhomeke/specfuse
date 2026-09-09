## MODIFIED Requirements

### Requirement: Checkpoint question is mandatory after apply completion

`renderApplyFuseReview()` output SHALL require the AI to ask the checkpoint question after the final task is verified, and SHALL forbid silently advancing to verify or archive.

#### Scenario: Mandatory question stated

- **WHEN** `renderApplyFuseReview()` is called
- **THEN** its output contains a MUST-level instruction to ask the user whether to enter FuseReview after the last task passes verification, and states that silent advancement to verify/archive is forbidden

#### Scenario: Checkpoint assembled into CLAUDE.md

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the output contains the FuseReview checkpoint section positioned between the Do (apply) phase and the FuseQA checkpoint section, with the FuseQA section in turn preceding the Verify phase

#### Scenario: Declining FuseReview does not end the apply exit sequence

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the output states that declining FuseReview still leaves the FuseQA checkpoint mandatory, so the apply exit sequence is not terminated by a single decline
