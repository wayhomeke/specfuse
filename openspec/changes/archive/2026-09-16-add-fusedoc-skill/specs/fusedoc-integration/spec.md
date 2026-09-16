## Purpose

Defines how FuseDoc is wired into the generated `CLAUDE.md` as a documentation standard spanning the whole pipeline rather than a pipeline beat: which phases reference it, and the guarantee that it introduces no checkpoint of its own.

## ADDED Requirements

### Requirement: FuseDoc is declared a cross-cutting standard, not a beat

The generated `CLAUDE.md` SHALL present FuseDoc as a documentation standard that applies wherever prose is produced, and SHALL NOT present it as a pipeline beat.

#### Scenario: Standard framing stated

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** it states that FuseDoc is a documentation standard spanning the pipeline, invoked on demand by the phases that produce prose

#### Scenario: Pipeline beat count unchanged

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** the pipeline it describes still consists of the same beats as before this change, with FuseDoc named as none of them

#### Scenario: Skill location stated for manual invocation

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** it states that the skill is installed at `.claude/skills/fusedoc/SKILL.md` and may be invoked directly by the user at any time

### Requirement: FuseDoc introduces no checkpoint

The apply exit sequence contains exactly two mandatory checkpoint questions, FuseReview then FuseQA. FuseDoc SHALL NOT add a third, and SHALL NOT make any phase's completion conditional on a FuseDoc decision.

#### Scenario: No third checkpoint question

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** it defines no mandatory FuseDoc checkpoint question, and the apply exit sequence still requires exactly the FuseReview and FuseQA decisions on record

#### Scenario: Apply completion does not depend on FuseDoc

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** apply completion requires no FuseDoc decision record, and no FuseDoc outcome can block entry to the Verify phase

### Requirement: Prose-producing phases reference the standard

Each phase that produces or reviews prose SHALL reference FuseDoc, as a short pointer that links to the skill rather than restating its rules.

#### Scenario: Artifact drafting references the standard

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** the artifact-drafting instructions reference FuseDoc as the standard governing the prose written into proposal, design, and specs artifacts

#### Scenario: FuseReview references the standard for documentation changes

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** the FuseReview section references FuseDoc as the standard applied when the reviewed diff changes prose

#### Scenario: Archive references the standard

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** the archive instructions reference FuseDoc as the standard applied to prose synced into the main specs

#### Scenario: References are pointers, not restatements

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** no phase reference reproduces the axis rules, taxonomy classes, or document tiers that the skill owns

### Requirement: Merging into an existing CLAUDE.md preserves user content

`scaffold()` SHALL add the FuseDoc references when merging into a project that already has a `CLAUDE.md`, without discarding content that file already carried.

#### Scenario: Existing CLAUDE.md gains the references

- **WHEN** `scaffold()` runs in a directory whose `CLAUDE.md` already exists with user-authored content
- **THEN** the merged file contains the FuseDoc references and still contains the pre-existing user content
