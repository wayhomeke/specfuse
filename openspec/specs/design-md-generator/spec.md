## ADDED Requirements

### Requirement: Interactive questionnaire collects user style preferences
The `questionnaire.ts` module SHALL present Q1-Q5 questions sequentially using `@inquirer/prompts`, collecting style preferences to derive a target dimension vector.

#### Scenario: Complete Q1-Q5 flow
- **WHEN** `generateDesignMd(targetDir)` is called
- **THEN** system presents Q1 (product type, multi-select), Q2 (audience, single-select), Q3 (mood keywords, multi-select), Q4 (density preference, single-select), Q5 (reference product, optional text input) in sequence
- **THEN** returns a `QuestionnaireAnswers` object with all fields populated

#### Scenario: User skips optional question Q5
- **WHEN** user presses Enter on Q5 without input
- **THEN** `QuestionnaireAnswers.reference` is set to `null`
- **THEN** matching proceeds without reference-based bias

#### Scenario: Q1 multi-select with primary/secondary
- **WHEN** user selects multiple product types in Q1
- **THEN** first selected item is treated as primary (weight 0.7)
- **THEN** remaining selections are secondary (weight 0.3 distributed equally)

### Requirement: Dimension vector derivation from answers
The system SHALL deterministically derive a `DimensionVector` from `QuestionnaireAnswers` using a predefined mapping table.

#### Scenario: Same answers produce same vector
- **WHEN** identical `QuestionnaireAnswers` are provided on separate invocations
- **THEN** the derived `DimensionVector` is byte-for-byte identical

#### Scenario: All dimension values within valid range
- **WHEN** any combination of answers is provided
- **THEN** each dimension in the output vector is an integer between 1 and 5 inclusive

### Requirement: Archetype matching returns ranked results
The `matcher.ts` module SHALL compute weighted Euclidean distance between the target vector and all archetype vectors, returning results sorted by ascending distance.

#### Scenario: Best match returned first
- **WHEN** target vector is `{colorTemp:1, lightness:1, density:1, borderRadius:2, tone:1}`
- **THEN** the first result in the array has the smallest distance among all 15 archetypes

#### Scenario: Two-layer filtering applies category first
- **WHEN** Q1 answer includes "dashboard" as primary type
- **THEN** archetypes with `category: 'dashboard'` are scored with a category bonus (distance reduced by 20%)
- **THEN** non-matching categories are scored without bonus

#### Scenario: No archetypes filtered out
- **WHEN** matching is performed
- **THEN** all 15 archetypes appear in results (none are excluded, only ranked)

### Requirement: Fine-tuning allows dimension overrides
The `fine-tuner.ts` module SHALL present the top matched archetype's dimensions and allow user to override individual values.

#### Scenario: User adjusts one dimension
- **WHEN** top match is shown with dimensions `{colorTemp:2, lightness:3, density:2, borderRadius:3, tone:2}`
- **WHEN** user overrides `borderRadius` to `1`
- **THEN** final vector becomes `{colorTemp:2, lightness:3, density:2, borderRadius:1, tone:2}`

#### Scenario: User accepts without changes
- **WHEN** user confirms the matched archetype without overrides
- **THEN** the archetype's original dimension vector is used unchanged

#### Scenario: User skips fine-tuning entirely
- **WHEN** user selects "skip fine-tuning" option
- **THEN** top match archetype is used as-is without presenting dimension editor

### Requirement: DESIGN.md file generation
The `renderer.ts` module SHALL produce a DESIGN.md file with YAML front matter (machine-readable tokens) and Markdown prose (human-readable rationale).

#### Scenario: Valid DESIGN.md structure
- **WHEN** rendering completes
- **THEN** output file starts with `---` delimiter
- **THEN** contains valid YAML front matter with `tokens` key
- **THEN** ends YAML with `---` delimiter
- **THEN** followed by Markdown sections: Style Direction, Color Palette, Typography, Spacing, Components

#### Scenario: File written to correct path
- **WHEN** `generateDesignMd('/path/to/project')` completes
- **THEN** file is created at `/path/to/project/DESIGN.md`
- **THEN** function returns the absolute path string

#### Scenario: Existing DESIGN.md triggers backup prompt
- **WHEN** `DESIGN.md` already exists at target path
- **THEN** system prompts user to confirm overwrite
- **WHEN** user confirms
- **THEN** existing file is renamed to `DESIGN.md.bak` before writing new content

#### Scenario: User declines overwrite
- **WHEN** `DESIGN.md` already exists and user declines overwrite
- **THEN** generation is aborted
- **THEN** function returns `null`

### Requirement: SKILL.md installation in scaffolder
`scaffolder.ts` SHALL write `.claude/skills/design-md/SKILL.md` during init (same pattern as grill-me skill installation). No interactive generation is triggered at init time.

#### Scenario: SKILL.md written during init
- **WHEN** `specfuse init` completes
- **THEN** `.claude/skills/design-md/SKILL.md` exists in the target directory
- **THEN** file contains valid skill definition for `/design-md` trigger
- **THEN** init log output contains a line indicating design-md skill installation

#### Scenario: SKILL.md content defines trigger and flow
- **WHEN** SKILL.md is read
- **THEN** it describes the `/design-md` command trigger
- **THEN** it references `src/design-md/index.ts` as the generator entry point
- **THEN** it defines the brainstorm auto-trigger condition (frontend intent detected)
