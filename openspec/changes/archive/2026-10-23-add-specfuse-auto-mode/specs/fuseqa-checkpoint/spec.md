## MODIFIED Requirements

### Requirement: FuseQA checkpoint question is mandatory and independent

`renderFuseQA()` output SHALL require the AI to ask the FuseQA checkpoint question after the last task in `tasks.md` passes verification for `/opsx:apply` invocations, SHALL state that the FuseReview answer does not affect whether FuseQA is asked, and SHALL forbid merging the two checkpoints into one question. Auto-mode invocations are governed by the `specfuse-auto-mode` capability; this requirement SHALL NOT be read as applying to them.

#### Scenario: Mandatory question stated

- **WHEN** `renderFuseQA()` is called
- **THEN** its output contains a MUST-level instruction to ask the user whether to enter FuseQA after the last task passes verification for interactive invocations, and states that silent advancement to `/opsx:verify` or `/opsx:archive` is forbidden

#### Scenario: Independence from the FuseReview answer

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states that for interactive invocations any FuseReview answer, accept or decline, leaves the FuseQA question mandatory

#### Scenario: Merged questioning forbidden

- **WHEN** `renderFuseQA()` is called
- **THEN** its output explicitly forbids combining the FuseReview and FuseQA checkpoints into a single question

#### Scenario: Two checkpoints ordered, not nested

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the FuseQA section appears after the FuseReview checkpoint section and before the Verify phase section

### Requirement: Apply completion requires both checkpoint decisions on record

`renderFuseQA()` output SHALL make the apply completion report carry both the FuseReview decision and the FuseQA decision for interactive invocations, and SHALL state that a report missing either record means apply is not complete. The auto-mode equivalent, where both decisions are recorded automatically, is governed by the `specfuse-auto-mode` capability.

#### Scenario: Dual record required

- **WHEN** `renderFuseQA()` is called
- **THEN** its output requires the apply completion report to record both the FuseReview decision and the FuseQA decision

#### Scenario: Missing record blocks verify

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states that a completion report missing either decision means apply is incomplete and `/opsx:verify` MUST NOT be entered

#### Scenario: Skip is recorded with facts

- **WHEN** `renderFuseQA()` is called
- **THEN** its output requires a declined FuseQA to be recorded in the completion report together with the change facts, so the skip is auditable rather than invisible
