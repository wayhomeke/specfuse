# fuseqa-checkpoint Specification

## Purpose

Defines FuseQA as an on-demand end-to-end verification capability rather than a pipeline checkpoint: explicit invocation, the local-versus-distributed boundary, scope, attribution grading, and the case lifecycle. The capability name is historical; no checkpoint remains.

## Requirements

### Requirement: Scope excludes regression execution and red-diagnosis

`renderFuseQAOnDemand()` and `composeFuseQASkill()` output SHALL limit FuseQA to authoring cases for the current change's entry-point changes and handling what those new cases expose, and SHALL assign regression execution to the Verify phase.

#### Scenario: Regression assigned to Verify

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output states that executing the existing E2E suite belongs to the Verify phase full test run, not to FuseQA

#### Scenario: No separate red-diagnosis stage

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output states that a new case failing on first run is the TDD RED step and an existing case turning red is a regression caught by the Verify gate, so FuseQA defines no separate red-diagnosis stage

#### Scenario: Verify phase names the E2E regression gate

- **WHEN** `renderVerifyPhase()` is called
- **THEN** its output states that the full test suite is the E2E regression gate and that this gate MUST NOT be skipped

### Requirement: Findings are graded by attribution, not by redness

`renderFuseQAOnDemand()` and `composeFuseQASkill()` output SHALL define three attribution classes with distinct handling, and SHALL bound attribution effort with a time box.

#### Scenario: Implementation defect blocks

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output classifies an implementation defect as **Blocking**, and states the red case itself is the failing test that catches the defect so the implementation is fixed directly

#### Scenario: Spec gap defaults to suggestion

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output classifies a missing spec definition as **Suggestion** by default, and states it escalates to Blocking when the undefined behavior causes user-visible breakage

#### Scenario: False red is case debt, not a finding

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output states a false red is case debt outside the Blocking/Suggestion grading, and requires the ledger to record why the implementation is correct, with evidence

#### Scenario: Attribution time box

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output states that attribution exceeding its time box is downgraded to Suggestion and MUST NOT hold up completion

### Requirement: Cases are project assets with a recorded lifecycle

`renderFuseQAOnDemand()` and `composeFuseQASkill()` output SHALL place cases under `tests/e2e/<capability>/` aligned by name with `openspec/specs/<capability>/`, and SHALL require ledger entries for addition, correction, and removal.

#### Scenario: Case location aligned to capability

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output states cases live in `tests/e2e/<capability>/` with the capability name matching `openspec/specs/<capability>/`

#### Scenario: Removal requires a reason

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output requires every removal to record why the case is no longer valid, stating that without a reason "deleting a red case" and "hiding a defect" are indistinguishable in the ledger

#### Scenario: Addition traces to a source

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output requires each added case to record its source: the spec Scenario it derives from, or the escaped defect it was written for

### Requirement: Skill is referenced and manually invocable

`renderFuseQAOnDemand()` output SHALL reference the skill at `.claude/skills/fuseqa/SKILL.md` and SHALL state that FuseQA runs when the user invokes `/fuseqa` explicitly or when `/specfuse:full` runs it as a pipeline step.

#### Scenario: Skill path referenced

- **WHEN** `renderFuseQAOnDemand()` is called
- **THEN** its output names `.claude/skills/fuseqa/SKILL.md` as the location of the full method

#### Scenario: Manual invocation preserved

- **WHEN** `renderFuseQAOnDemand()` is called
- **THEN** its output states that `/specfuse` does not invoke FuseQA, that the user invokes `/fuseqa` explicitly, and that `/specfuse:full` is the complete variant which does invoke it

### Requirement: FuseQA is on demand, not a pipeline checkpoint

`renderFuseQAOnDemand()` output SHALL state that FuseQA is not part of the default `/specfuse` pipeline, has no checkpoint, and is not a condition of apply completion. It SHALL state that `/specfuse:full` enters FuseQA as an explicit step after FuseReview and before Verify.

#### Scenario: Section states its on-demand position

- **WHEN** `renderFuseQAOnDemand()` is called
- **THEN** its output states that FuseQA is not one of the pipeline beats, has no checkpoint question, and is not invoked by `/specfuse`

#### Scenario: No completion dependency

- **WHEN** `renderFuseQAOnDemand()` is called
- **THEN** its output states that apply completion and entry to Verify do not depend on a FuseQA decision

#### Scenario: Full variant enters it

- **WHEN** `renderFuseQAOnDemand()` is called
- **THEN** its output names `/specfuse:full` and states that it enters FuseQA after FuseReview and before Verify

### Requirement: Applicability boundary is stated

`renderFuseQAOnDemand()` and `composeFuseQASkill()` output SHALL state that local E2E verification suits small or local deployments and that distributed systems should run equivalent checks in CI/CD rather than in the development phase.

#### Scenario: Local scope stated

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output states that FuseQA is useful when the artifact can be deployed and exercised locally

#### Scenario: Distributed boundary stated

- **WHEN** `renderFuseQAOnDemand()` or `composeFuseQASkill()` is called
- **THEN** its output states that distributed systems cannot be meaningfully exercised by local QA and that equivalent checks belong in CI/CD
