## ADDED Requirements

### Requirement: SKILL.md defines per-artifact review surfaces

`composeGrillMeSkill()` output SHALL organize review surfaces by artifact group — `[proposal.md]`, `[design.md]`, `[specs/]`, `[tasks/]` — each listing discovery-oriented checkpoints (not mandatory per-item questions).

#### Scenario: Four artifact groups present

- **WHEN** `composeGrillMeSkill()` is called
- **THEN** its output contains exactly the four artifact-group markers `[proposal.md]`, `[design.md]`, `[specs/]`, and `[tasks/]`

#### Scenario: Groups are discovery-oriented

- **WHEN** the design.md group is rendered
- **THEN** its checkpoints are framed as findings-perspectives (e.g. signature contract, dependency direction, config defaults, error ownership) rather than a forced per-item interrogation list

### Requirement: Structural contract checkpoints cover the signature-conflict family

The design.md group SHALL include the checkpoint `signature contract` (signature substitution: every declared input has a source and consumer), and the specs group SHALL include `input slot` (every spec WHEN input maps to a declared signature parameter) and `assertion strength` (scenarios prove an input took effect, not merely an output shell).

#### Scenario: Signature conflict is in scope

- **WHEN** the design.md group checkpoints are read
- **THEN** a defect like `NewHandler(scannerFactory func() *service.Scanner)` with no path for per-scan `PingOptions` is in scope of the signature-contract checkpoint

#### Scenario: Reverse-direction tracing is explicit

- **WHEN** the specs group is reviewed
- **THEN** the input-slot checkpoint requires each spec WHEN input value (e.g. `count`) to map to a parameter slot in a declared signature, and the assertion-strength checkpoint requires a scenario that proves the input took effect

### Requirement: Assertion-strength triage boundary

When a weak spec assertion is found, the review SHALL classify it as a presentation defect (behavior already defined in proposal/design → strengthen the THEN) or a requirements defect (behavior never defined → flag for Think/user, not invent).

#### Scenario: Presentation defect is fixed in-grill

- **WHEN** `count`'s probing-count behavior is already stated in proposal but the spec only asserts `200`
- **THEN** the review strengthens the THEN to assert the probing count, without adding new requirements

#### Scenario: Requirements defect is routed back

- **WHEN** a behavior that would justify the assertion is nowhere defined in proposal/design
- **THEN** the review does not invent the requirement and marks it to route back to Think/user

### Requirement: Soft limit of nine questions

The review SHALL self-assess after 9 questions whether remaining issues are blocking-level and converge to summary if none remain.

#### Scenario: Convergence at nine

- **WHEN** 9 questions have been asked and no blocking-level issues remain
- **THEN** the review proceeds to the consistency scan and summary instead of continuing to interrogate

#### Scenario: Blocking issues extend beyond nine

- **WHEN** blocking-level issues remain after 9 questions
- **THEN** the review continues resolving them until none remain, then converges
