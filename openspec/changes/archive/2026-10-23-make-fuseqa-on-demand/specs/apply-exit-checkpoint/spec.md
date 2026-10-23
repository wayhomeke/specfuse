## MODIFIED Requirements

### Requirement: Checkpoint question is mandatory after apply completion

`renderApplyFuseReview()` output SHALL require the AI to ask the checkpoint question after the final task is verified for `/opsx:apply` invocations, and SHALL forbid silently advancing to verify or archive. Auto-mode invocations are governed by the `specfuse-auto-mode` capability; this requirement SHALL NOT be read as applying to them. The apply exit sequence has exactly one checkpoint, and completion requires only the FuseReview decision.

#### Scenario: Mandatory question stated

- **WHEN** `renderApplyFuseReview()` is called
- **THEN** its output contains a MUST-level instruction to ask the user whether to enter FuseReview after the last task passes verification, and states that silent advancement to verify/archive is forbidden for interactive invocations

#### Scenario: Checkpoint assembled into CLAUDE.md

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the output contains the FuseReview checkpoint section positioned between the Do (apply) phase and the Verify phase, and contains no second apply-exit checkpoint section

#### Scenario: Declining FuseReview does not end the apply exit sequence

- **WHEN** the user declines FuseReview
- **THEN** the skip decision plus the change facts are recorded in the apply completion report, and the AI proceeds to Verify; there is no second checkpoint to answer

#### Scenario: Apply completion requires only the FuseReview decision

- **WHEN** apply completes
- **THEN** the apply completion report carries the FuseReview decision, and no FuseQA decision is required for apply to be complete or for Verify to be entered
