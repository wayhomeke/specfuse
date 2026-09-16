# pipeline-description-consistency Specification

## Purpose
Defines the consistency contract for every description of the pipeline that SpecFuse ships: the CLI help text, the generated `CLAUDE.md`, and the FuseReview and FuseQA skills. Each must name all five beats, and none may carry a positional ordinal — an ordinal has to be recomputed by hand every time a beat is added or removed, which is how the shipped descriptions drifted a beat behind.

## Requirements

### Requirement: Shipped pipeline descriptions name every beat

Every surface that describes the pipeline's sequence SHALL name all five beats — Think, Do, FuseReview, FuseQA, Verify. A description that omits a beat advertises a pipeline the product does not have.

#### Scenario: CLI help names every beat

- **WHEN** the built CLI is invoked with `--help`
- **THEN** its description names Think, Do, FuseReview, FuseQA, and Verify

#### Scenario: Generated CLAUDE.md names every beat

- **WHEN** `composeCLAUDEmd()` is called
- **THEN** both the FuseReview and the FuseQA section opening sentences name all five beats

#### Scenario: Both skills name every beat

- **WHEN** `composeFuseReviewSkill()` and `composeFuseQASkill()` are called
- **THEN** each output's body opening sentence names all five beats

### Requirement: Shipped pipeline descriptions carry no positional ordinal

A shipped description SHALL NOT label a beat by its position in the sequence. The sequence is stated by naming the beats; a position label is derived state that goes stale whenever the sequence changes.

#### Scenario: No ordinal labels any beat

- **WHEN** the rendered `CLAUDE.md`, `composeFuseReviewSkill()` output, and `composeFuseQASkill()` output are inspected
- **THEN** none contains an ordinal form — "first beat", "second beat", "third beat", "fourth beat", "fifth beat", or a numeric equivalent — applied to a pipeline beat

#### Scenario: Skill frontmatter still identifies the beat

- **WHEN** `composeFuseReviewSkill()` and `composeFuseQASkill()` are called
- **THEN** each YAML frontmatter `description` identifies its beat by what it does — post-apply code review for FuseReview, post-apply E2E verification for FuseQA — without a positional ordinal

### Requirement: The contract is enforced through the shipped artifact

The guard SHALL exercise the built artifact through its real entry path, not an in-process import, so a description that only breaks once packaged is still caught.

#### Scenario: Built CLI checked through its real entry path

- **WHEN** the guard runs against the build output
- **THEN** it invokes the CLI as a real process and asserts on the help text it prints

#### Scenario: Rendered templates checked at the renderer

- **WHEN** the guard inspects the generated text
- **THEN** it calls `composeCLAUDEmd()`, `composeFuseReviewSkill()`, and `composeFuseQASkill()` rather than reading the repository's own installed copies

### Requirement: Installed skill copies match their rendered output

The repository's own installed skills are derived from the templates. When a template's prose changes, the installed copy SHALL be regenerated rather than hand-edited, so the two cannot diverge.

#### Scenario: Installed copies equal the rendered output

- **WHEN** every installed skill under `.claude/skills/` that the scaffolder generates — design-md, fusedoc, fusereview, fuseqa — is compared against the corresponding `compose*Skill()` output
- **THEN** each file's content equals the rendered output exactly

#### Scenario: Pre-existing drift is repaired by regeneration

- **WHEN** an installed copy has fallen behind its template — carrying prose the template no longer emits, or predating a rename of the artifact it describes
- **THEN** it is regenerated from the template rather than reconciled line by line, because the installed file has no authored content of its own
