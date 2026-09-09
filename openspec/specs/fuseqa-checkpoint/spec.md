# fuseqa-checkpoint Specification

## Purpose
TBD - created by archiving change add-fuseqa-phase. Update Purpose after archive.

## Requirements

### Requirement: FuseQA checkpoint question is mandatory and independent

`renderFuseQA()` output SHALL require the AI to ask the FuseQA checkpoint question after the last task in `tasks.md` passes verification, SHALL state that the FuseReview answer does not affect whether FuseQA is asked, and SHALL forbid merging the two checkpoints into one question.

#### Scenario: Mandatory question stated

- **WHEN** `renderFuseQA()` is called
- **THEN** its output contains a MUST-level instruction to ask the user whether to enter FuseQA after the last task passes verification, and states that silent advancement to `/opsx:verify` or `/opsx:archive` is forbidden

#### Scenario: Independence from the FuseReview answer

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states that any FuseReview answer, accept or decline, leaves the FuseQA question mandatory

#### Scenario: Merged questioning forbidden

- **WHEN** `renderFuseQA()` is called
- **THEN** its output explicitly forbids combining the FuseReview and FuseQA checkpoints into a single question

#### Scenario: Two checkpoints ordered, not nested

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the FuseQA section appears after the FuseReview checkpoint section and before the Verify phase section

### Requirement: Apply completion requires both checkpoint decisions on record

`renderFuseQA()` output SHALL make the apply completion report carry both the FuseReview decision and the FuseQA decision, and SHALL state that a report missing either record means apply is not complete.

#### Scenario: Dual record required

- **WHEN** `renderFuseQA()` is called
- **THEN** its output requires the apply completion report to record both the FuseReview decision and the FuseQA decision

#### Scenario: Missing record blocks verify

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states that a completion report missing either decision means apply is incomplete and `/opsx:verify` MUST NOT be entered

#### Scenario: Skip is recorded with facts

- **WHEN** `renderFuseQA()` is called
- **THEN** its output requires a declined FuseQA to be recorded in the completion report together with the change facts, so the skip is auditable rather than invisible

### Requirement: AI presents facts, user decides

`renderFuseQA()` output SHALL require the checkpoint question to present change facts and SHALL forbid automatic trigger thresholds.

#### Scenario: Facts listed

- **WHEN** `renderFuseQA()` is called
- **THEN** its output requires the question to list whether the change touched a user-observable entry point, which capabilities are affected, and the current E2E case count

#### Scenario: No automatic thresholds

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states there are no automatic trigger thresholds and the decision belongs to the user

### Requirement: Scope excludes regression execution and red-diagnosis

`renderFuseQA()` output SHALL limit FuseQA to authoring cases for this change's entry-point changes and handling what those new cases expose, and SHALL assign regression execution to the Verify phase.

#### Scenario: Regression assigned to Verify

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states that executing the existing E2E suite belongs to the Verify phase full test run, not to FuseQA

#### Scenario: No separate red-diagnosis stage

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states that a new case failing on first run is the TDD RED step and an existing case turning red is a regression caught by the Verify gate, so FuseQA defines no separate red-diagnosis stage

#### Scenario: Verify phase names the E2E regression gate

- **WHEN** `renderVerifyPhase()` is called
- **THEN** its output states that the full test suite is the E2E regression gate and that this gate MUST NOT be skipped

### Requirement: Findings are graded by attribution, not by redness

`renderFuseQA()` output SHALL define three attribution classes with distinct handling, and SHALL bound attribution effort with a time box.

#### Scenario: Implementation defect blocks

- **WHEN** `renderFuseQA()` is called
- **THEN** its output classifies an implementation defect as **Blocking**, and states the red case itself is the failing test that catches the defect so the implementation is fixed directly

#### Scenario: Spec gap defaults to suggestion

- **WHEN** `renderFuseQA()` is called
- **THEN** its output classifies a missing spec definition as **Suggestion** by default, and states it escalates to Blocking when the undefined behavior causes user-visible breakage

#### Scenario: False red is case debt, not a finding

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states a false red is case debt outside the Blocking/Suggestion grading, and requires the ledger to record why the implementation is correct, with evidence

#### Scenario: Attribution time box

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states that attribution exceeding its time box is downgraded to Suggestion and MUST NOT hold up apply completion

### Requirement: Cases are project assets with a recorded lifecycle

`renderFuseQA()` output SHALL place cases under `tests/e2e/<capability>/` aligned by name with `openspec/specs/<capability>/`, and SHALL require ledger entries for addition, correction, and removal.

#### Scenario: Case location aligned to capability

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states cases live in `tests/e2e/<capability>/` with the capability name matching `openspec/specs/<capability>/`

#### Scenario: Removal requires a reason

- **WHEN** `renderFuseQA()` is called
- **THEN** its output requires every removal to record why the case is no longer valid, stating that without a reason "deleting a red case" and "hiding a defect" are indistinguishable in the ledger

#### Scenario: Addition traces to a source

- **WHEN** `renderFuseQA()` is called
- **THEN** its output requires each added case to record its source: the spec Scenario it derives from, or the escaped defect it was written for

### Requirement: Skill is referenced and manually invocable

`renderFuseQA()` output SHALL reference the skill at `.claude/skills/fuseqa/SKILL.md` and SHALL preserve manual invocation.

#### Scenario: Skill path referenced

- **WHEN** `renderFuseQA()` is called
- **THEN** its output names `.claude/skills/fuseqa/SKILL.md` as the location of the full method

#### Scenario: Manual invocation preserved

- **WHEN** `renderFuseQA()` is called
- **THEN** its output states the user may invoke the FuseQA skill explicitly at any time, independent of the checkpoint
