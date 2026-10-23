## REMOVED Requirements

### Requirement: Skill frontmatter triggers on both flow and colloquial phrasing

**Reason**: FuseQA is no longer invoked by the pipeline's flow. A frontmatter description that advertises an in-flow trigger keeps suggesting automatic activation, which is the behavior this change removes.

**Migration**: The frontmatter describes explicit on-demand requests only. Colloquial triggers remain, but they are requests to run FuseQA, not a pipeline hook.

## ADDED Requirements

### Requirement: Skill declares on-demand scope and explicit invocation

`composeFuseQASkill(ctx)` SHALL emit YAML frontmatter whose `name` is `fuseqa` and whose `description` states that the skill runs only when the user asks for it, that it is not a pipeline beat, and that it suits local end-to-end verification. The body SHALL state the local-versus-distributed boundary.

#### Scenario: Frontmatter names an on-demand capability

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output starts with YAML frontmatter containing `name: fuseqa` and a `description` stating that invocation is explicit and the skill is not a pipeline beat

#### Scenario: Colloquial triggers remain for explicit requests

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the `description` contains at least two colloquial trigger phrases covering end-to-end test authoring and QA acceptance, understood as user requests rather than pipeline triggers

#### Scenario: Body states the applicability boundary

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the body states that FuseQA is useful when the artifact can be deployed and exercised locally, and that distributed systems should run equivalent checks in CI/CD rather than in the development phase

#### Scenario: Body carries no beat claim

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output does not describe FuseQA as a pipeline beat, a post-apply checkpoint, or part of the apply exit sequence

#### Scenario: Activation failure mode stated in the skill body

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the body states that FuseQA authors cases for the current change and does not execute the existing regression suite
