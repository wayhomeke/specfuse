## Purpose

Defines the `grill-me` SKILL.md that `composeGrillMeSkill()` must generate: self-contained review method with per-artifact surfaces, check tools, and the discipline the skill carries into a project.

## Requirements

### Requirement: composeGrillMeSkill function exists
The system SHALL export a function `composeGrillMeSkill()` from `src/templates/grill-me-skill.ts` that returns a string containing valid SKILL.md content.

#### Scenario: Function returns non-empty string
- **WHEN** `composeGrillMeSkill()` is called
- **THEN** it returns a non-empty string

#### Scenario: Function accepts zero arguments
- **WHEN** `composeGrillMeSkill()` is defined
- **THEN** it has zero parameters (stack-agnostic)

---

### Requirement: SKILL.md contains valid frontmatter
The output SHALL begin with YAML frontmatter containing `name: grill-me` and a `description` field.

#### Scenario: Frontmatter structure
- **WHEN** `composeGrillMeSkill()` output is examined
- **THEN** it starts with `---` followed by YAML containing `name: grill-me` and a non-empty `description`, closed by `---`

#### Scenario: Name field is exactly grill-me
- **WHEN** the frontmatter is parsed
- **THEN** the `name` field equals `grill-me`

---

### Requirement: SKILL.md is a self-contained review method
The skill body SHALL contain the full review method inline (per-artifact review surfaces, check tools, soft limit, triage rule), so the Grill beat runs without referencing an external protocol document as the source of the method.

#### Scenario: Method is inline
- **WHEN** the skill body content is examined
- **THEN** it includes the per-artifact review surfaces and the signature-substitution check tool without delegating the method to CLAUDE.md

#### Scenario: CLAUDE.md reference limited to discipline
- **WHEN** the skill body content is examined
- **THEN** any reference to CLAUDE.md positions it as governing project-level discipline, not as the source of the review method

---

### Requirement: SKILL.md contains protocol activation steps
The skill body SHALL include concise protocol steps: backup, one-question review, direct modification, consistency scan, summary.

#### Scenario: Backup step present
- **WHEN** the skill body is examined
- **THEN** it mentions `.grill-backup/`

#### Scenario: Exit commands present
- **WHEN** the skill body is examined
- **THEN** it contains `grill-stop` and `grill-abort`

---

### Requirement: Scaffolder generates skill file
The scaffolder SHALL write `.claude/skills/grill-me/SKILL.md` during project scaffolding.

#### Scenario: Greenfield scaffold creates skill file
- **WHEN** `scaffold()` runs with a new project
- **THEN** the file `.claude/skills/grill-me/SKILL.md` exists in the target directory

#### Scenario: File content matches template output
- **WHEN** the generated file is read
- **THEN** its content equals `composeGrillMeSkill()` output

---

### Requirement: Scaffolder does not overwrite existing skill file
The scaffolder SHALL skip writing if `.claude/skills/grill-me/SKILL.md` already exists.

#### Scenario: Existing file preserved
- **WHEN** `.claude/skills/grill-me/SKILL.md` already exists with custom content
- **AND** `scaffold()` runs in existing-project mode
- **THEN** the file content remains unchanged
