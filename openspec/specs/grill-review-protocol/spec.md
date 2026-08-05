## Purpose

Defines the CLAUDE.md "Pre-Apply Review (Grill)" protocol contract: the `Data-flow integrity` dimension, the soft limit of nine, and the bidirectional consistency scan that `renderGrillReview()` must emit.

## Requirements

### Requirement: Protocol adds Data-flow integrity dimension

`renderGrillReview()` output SHALL add `Data-flow integrity` to the Review Dimensions list.

#### Scenario: Dimension present

- **WHEN** `renderGrillReview()` is called
- **THEN** its output contains `Data-flow integrity` and a description covering signature substitution (every spec input has a parameter slot) and assertion strength (scenarios prove the input took effect)

### Requirement: Soft limit set to nine

`renderGrillReview()` output SHALL state a soft limit of 9 questions after which the reviewer self-assesses whether remaining issues are blocking-level.

#### Scenario: Nine stated

- **WHEN** `renderGrillReview()` is called
- **THEN** its output contains the soft-limit statement with the number 9

#### Scenario: Self-assessment semantics preserved

- **WHEN** the soft-limit sentence is rendered
- **THEN** it retains the "converge to summary if no blocking-level issues remain" semantics rather than a hard cut-off

### Requirement: Consistency scan is bidirectional

`renderGrillReview()` output SHALL describe the consistency scan as bidirectional: forward (every proposal goal maps to design/specs/tasks) and reverse (every spec WHEN input maps to a parameter slot in a declared signature).

#### Scenario: Reverse direction present

- **WHEN** the Consistency Scan section is rendered
- **THEN** it explicitly includes the reverse direction check from spec inputs to declared signature parameter slots

#### Scenario: Forward mapping retained

- **WHEN** the Consistency Scan section is rendered
- **THEN** it still includes the original reference-integrity check that every goal in the proposal maps to design/specs/tasks
