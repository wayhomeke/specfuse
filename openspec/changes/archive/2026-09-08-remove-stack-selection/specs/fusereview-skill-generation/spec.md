## REMOVED Requirements

### Requirement: Skill consumes stack profile for adaptive checks

`composeFuseReviewSkill(ctx)` output SHALL include stack-adaptive review directives derived from `ctx.stack.errorHandling` and `ctx.stack.concurrency`.

**Reason**: The stack layer is removed from the scaffolder. There is no `StackProfile` left to derive directives from, and a stack-adaptive section without stack data is an empty reminder. Lifecycle, cancellation, and shared-state review is already covered by the lifecycle-concurrency check among the eleven checks.

**Migration**: The FuseReview skill consists of the eleven generic checks with no stack-adaptive section. Error-handling and concurrency review is performed through the lifecycle-concurrency check's seven defect classes rather than project-specific policy strings.

## MODIFIED Requirements

### Requirement: Skill is self-contained and disciplined

`composeFuseReviewSkill(ctx)` output SHALL not depend on host-project documents for its review method and SHALL state the output discipline.

#### Scenario: Output discipline present

- **WHEN** `composeFuseReviewSkill(ctx)` is called
- **THEN** its output requires each finding to carry defect, location, impact, and evidence; separates blocking from suggestion; and instructs omitting checks already enforced by the project's own mechanical gates (its lint, test, and typecheck commands)

#### Scenario: No external document routing

- **WHEN** the rendered skill is inspected
- **THEN** no check delegates its substance to a document that only exists in the scaffolder's own repository
