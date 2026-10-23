## MODIFIED Requirements

### Requirement: Shipped pipeline descriptions name every beat

Every surface that describes the pipeline's sequence SHALL name all four beats — Think, Do, FuseReview, Verify. A description that omits a beat, or that lists FuseQA among them, advertises a pipeline the product does not have.

#### Scenario: CLI help names every beat

- **WHEN** the built CLI is invoked with `--help`
- **THEN** its description names Think, Do, FuseReview, and Verify, and does not list FuseQA as a beat

#### Scenario: Generated CLAUDE.md names every beat

- **WHEN** `composeCLAUDEmd()` is called
- **THEN** the FuseReview section opening sentence names all four beats in order

#### Scenario: Both skills name every beat

- **WHEN** `composeFuseReviewSkill()` and `composeFuseQASkill()` are called
- **THEN** the FuseReview skill names all four beats in order, and the FuseQA skill states that it is not a beat and runs on demand

### Requirement: Shipped pipeline descriptions carry no positional ordinal

A shipped description SHALL NOT label a beat by its position in the sequence. The sequence is stated by naming the beats; a position label is derived state that goes stale whenever the sequence changes.

#### Scenario: No ordinal labels any beat

- **WHEN** the rendered `CLAUDE.md`, `composeFuseReviewSkill()` output, and `composeFuseQASkill()` output are inspected
- **THEN** none contains an ordinal form — "first beat", "second beat", "third beat", "fourth beat", "fifth beat", or a numeric equivalent — applied to a pipeline beat

#### Scenario: Skill frontmatter still identifies the beat

- **WHEN** `composeFuseReviewSkill()` and `composeFuseQASkill()` are called
- **THEN** each YAML frontmatter `description` identifies its capability by what it does — post-apply code review for FuseReview, on-demand local E2E verification for FuseQA — without a positional ordinal

### Requirement: The contract is enforced through the shipped artifact

The guard SHALL exercise the built artifact through its real entry path, not an in-process import, so a description that only breaks once packaged is still caught.

#### Scenario: Built CLI checked through its real entry path

- **WHEN** the guard runs against the build output
- **THEN** it invokes the CLI as a real process and asserts on the help text it prints

#### Scenario: Rendered templates checked at the renderer

- **WHEN** the guard inspects the generated text
- **THEN** it calls `composeCLAUDEmd()`, `composeFuseReviewSkill()`, and `composeFuseQASkill()` rather than reading the repository's own installed copies

#### Scenario: FuseQA is checked for absence from the beat list

- **WHEN** the guard inspects `composeFuseQASkill()` output
- **THEN** it asserts that FuseQA is not described as a pipeline beat and that the on-demand boundary is stated
