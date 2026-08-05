## ADDED Requirements

### Requirement: Skill is self-contained review method

`composeGrillMeSkill()` output SHALL contain the full review method (per-artifact surfaces, check tools, soft limit, triage rule) inline, so the Grill beat runs without reading any project document for its method.

#### Scenario: Method is inline

- **WHEN** `composeGrillMeSkill()` is called
- **THEN** its output includes the per-artifact review surfaces and the signature-substitution check tool without referencing an external protocol document as the source of the method

#### Scenario: Skill survives missing protocol

- **WHEN** the target project's CLAUDE.md contains no "Pre-Apply Review (Grill)" section
- **THEN** invoking the skill still yields a functional review (surfaces + classification + soft limit + backup path) rather than an empty instruction to activate a missing protocol

### Requirement: CLAUDE.md keeps a minimal fallback dimension set

`renderGrillReview()` output SHALL retain a minimal fallback dimension list that includes `Data-flow integrity`, so a review can run from the protocol alone in the absence of the skill.

#### Scenario: Fallback covers data-flow

- **WHEN** `renderGrillReview()` is called
- **THEN** its Review Dimensions include `Data-flow integrity` covering signature substitution and assertion strength

#### Scenario: Protocol points to the skill as the source of truth

- **WHEN** the protocol header is rendered
- **THEN** it declares the per-artifact review surfaces live in `.claude/skills/grill-me/SKILL.md` and that this document governs discipline and process

### Requirement: Either artifact alone sustains the review

Grill SHALL be runnable when exactly one of the skill or the protocol document is present.

#### Scenario: Only skill present

- **WHEN** the skill exists but the protocol section is absent
- **THEN** the review still has surfaces, classification, soft limit, and backup/rollback behavior

#### Scenario: Only protocol present

- **WHEN** the protocol section exists but the skill is missing
- **THEN** the review still runs from the fallback dimensions, classification, and backup/rollback behavior
