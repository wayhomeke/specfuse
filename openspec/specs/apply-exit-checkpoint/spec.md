## Purpose

Defines the generated `CLAUDE.md` checkpoint protocol contract emitted by `renderApplyFuseReview()` and assembled by `composeCLAUDEmd()`: the mandatory human checkpoint after apply, fact-presentation without judgment, auditable skip, finding handling with a termination condition, baseline recording, and the subagent merge-gate linkage.

## Requirements

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

### Requirement: AI presents facts, user decides

`renderApplyFuseReview()` output SHALL require the AI to present change facts (task count, whether subagent mode was used, modules touched) with an optional recommendation, and SHALL reserve the decision for the user; it SHALL NOT contain automatic size or destructiveness thresholds.

#### Scenario: Facts listed, judgment absent

- **WHEN** `renderApplyFuseReview()` is called
- **THEN** its output lists the facts to present (task count, subagent usage, touched modules), allows a recommendation, states the decision belongs to the user, and contains no automatic trigger threshold (no "≥ 6 tasks", no destructiveness auto-detection)

### Requirement: Skip is recorded

`renderApplyFuseReview()` output SHALL require a declined checkpoint to be written into the apply completion report with the change-size facts.

#### Scenario: Skip trace required

- **WHEN** the rendered protocol describes a user declining the checkpoint
- **THEN** it requires the skip decision plus the change facts to be recorded in the apply completion report

### Requirement: Findings are handled with a termination condition

`renderApplyFuseReview()` output SHALL route blocking findings through TDD and SHALL limit re-review to the fix diff.

#### Scenario: Blocking path and termination stated

- **WHEN** `renderApplyFuseReview()` is called
- **THEN** its output requires blocking findings to be fixed test-first, records suggestions without enforcing them, and states that fixes are re-reviewed on the fix diff only — no second full review round

### Requirement: Baseline is recorded at apply start

`renderApplyFuseReview()` output SHALL require recording the HEAD commit at apply start as the review baseline, and SHALL define a fallback for changes without a recorded baseline. The auto-mode review object, which covers uncommitted work, is governed by the `specfuse-auto-mode` capability.

#### Scenario: Baseline and fallback stated

- **WHEN** `renderApplyFuseReview()` is called
- **THEN** its output requires writing the apply-start HEAD into the change's state, defines the review object as `baseline..HEAD` for interactive invocations, and specifies the merge-base fallback with a report annotation when no baseline is recorded

### Requirement: Subagent merge gate references the skill

`renderApplyFuseReview()` output SHALL define the previously dangling "code quality" stage of the subagent two-stage review as executing the FuseReview skill, before merge, without a user checkpoint.

#### Scenario: Merge-gate linkage stated

- **WHEN** `renderApplyFuseReview()` is called
- **THEN** its output states that in subagent mode the second review stage of each subagent output executes the FuseReview skill on that subagent's diff before merge, automatically

#### Scenario: Manual invocation preserved

- **WHEN** the rendered protocol is inspected
- **THEN** it states the skill can be invoked explicitly at any time, independent of the checkpoint
