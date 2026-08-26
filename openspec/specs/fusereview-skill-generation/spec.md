## Purpose

Defines the generation and scaffolding contract for the self-contained FuseReview skill: the eleven review checks with inlined substance, stack-adaptive sections derived from `StackProfile`, the output discipline, and distribution behavior of `scaffold()`.

## Requirements

### Requirement: Skill template renders eleven checks with substance

`composeFuseReviewSkill(ctx)` output SHALL contain all eleven review checks — test strength, missing detection, scope fit, real entry path, interface both-sides, lifecycle and concurrency, enforcement paths, configuration choices, capability-consumer fit, borrowed-state boundaries, boundary values — each carrying actionable substance, not a bare name.

#### Scenario: All eleven checks present

- **WHEN** `composeFuseReviewSkill(ctx)` is called with any valid `TemplateContext`
- **THEN** its output contains a marker or heading for each of the eleven checks, and the test-strength check contains the regression recipe (introduce the regression, watch it fail, revert)

#### Scenario: Lifecycle check carries the defect taxonomy

- **WHEN** `composeFuseReviewSkill(ctx)` is called
- **THEN** the lifecycle/concurrency check contains the seven defect classes (independent orthogonal outcomes, both-sides contract normalization, async-is-not-sync, dispose-to-quiescence, callback containment, environment isolation for untrusted output, link-shaped path handling)

### Requirement: Skill consumes stack profile for adaptive checks

`composeFuseReviewSkill(ctx)` output SHALL include stack-adaptive review directives derived from `ctx.stack.errorHandling` and `ctx.stack.concurrency`.

#### Scenario: Stack-specific directives rendered

- **WHEN** `composeFuseReviewSkill(ctx)` is called with a rust stack context
- **THEN** its output contains the rust stack's `errorHandling` text and `concurrency` text inside a stack-adaptive section

#### Scenario: Different stack yields different directives

- **WHEN** `composeFuseReviewSkill(ctx)` is called with a go stack context
- **THEN** the stack-adaptive section contains the go stack's `errorHandling` text instead of the rust one

### Requirement: Skill is self-contained and disciplined

`composeFuseReviewSkill(ctx)` output SHALL not depend on host-project documents for its review method and SHALL state the output discipline.

#### Scenario: Output discipline present

- **WHEN** `composeFuseReviewSkill(ctx)` is called
- **THEN** its output requires each finding to carry defect, location, impact, and evidence; separates blocking from suggestion; and instructs omitting checks already enforced by the stack's mechanical gates (lint/test/typecheck commands)

#### Scenario: No external document routing

- **WHEN** the rendered skill is inspected
- **THEN** no check delegates its substance to a document that only exists in the scaffolder's own repository

### Requirement: Scaffolder distributes the skill without overwriting

`scaffold()` SHALL write the skill to `<target>/.claude/skills/fusereview/SKILL.md` for new projects and SHALL NOT overwrite an existing file.

#### Scenario: New project receives the skill

- **WHEN** `scaffold()` runs for a new project directory
- **THEN** `.claude/skills/fusereview/SKILL.md` exists with the rendered skill content

#### Scenario: Existing skill preserved

- **WHEN** `scaffold()` runs where `.claude/skills/fusereview/SKILL.md` already exists with custom content
- **THEN** the file content is unchanged after scaffolding
