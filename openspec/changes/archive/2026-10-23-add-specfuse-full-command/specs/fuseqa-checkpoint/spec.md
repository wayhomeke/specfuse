## MODIFIED Requirements

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
