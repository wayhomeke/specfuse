## ADDED Requirements

### Requirement: Archetype YAML follows hybrid seed schema
Each archetype YAML file SHALL contain both intent descriptions and concrete reference anchor values conforming to the v2 schema.

#### Scenario: Valid hybrid seed structure
- **WHEN** any archetype YAML file in `src/design-md/templates/` is parsed
- **THEN** it contains all required top-level keys: `id`, `name`, `category`, `intent`, `dimensions`, `anchors`, `structure`

#### Scenario: Intent section provides directional guidance
- **WHEN** an archetype YAML `intent` section is read
- **THEN** it contains `mood` (string), `density` (string), and `philosophy` (string) fields that describe design direction in natural language

#### Scenario: Anchors section provides concrete reference values
- **WHEN** an archetype YAML `anchors` section is read
- **THEN** it contains `colors.primary` (hex string), `colors.auxiliary` (array of 1-2 hex strings), `typography.baseSize` (px string), `typography.scale` (number), `spacing.unit` (px string), and `radius.base` (px string)

#### Scenario: Dimensions section uses 1-5 scale
- **WHEN** an archetype YAML `dimensions` section is read
- **THEN** all dimension values (colorTemp, lightness, density, borderRadius, tone) are integers between 1 and 5 inclusive

#### Scenario: Structure section defines output expectations
- **WHEN** an archetype YAML `structure` section is read
- **THEN** it contains `requiredSections` (array of strings) and `componentTokens` (array of strings listing which component definitions to generate)

### Requirement: All 16 archetypes cover the category space
The template set SHALL include 16 archetype YAML files covering all defined product categories.

#### Scenario: Full category coverage
- **WHEN** all YAML files in `src/design-md/templates/` (excluding `_schema.yaml`) are enumerated
- **THEN** there are exactly 16 files and every `category` enum value (internal-tool, dashboard, consumer, developer, mobile, e-commerce, marketing, form-heavy, content) appears at least once

#### Scenario: Each archetype has unique id
- **WHEN** all archetype YAML files are parsed
- **THEN** every `id` value is unique across all 16 files and matches the kebab-case pattern `^[a-z][a-z0-9-]*$`

### Requirement: Schema validation file (_schema.yaml) matches v2 format
The `_schema.yaml` file SHALL define the v2 hybrid seed schema with all required fields and constraints.

#### Scenario: Schema validates all v2 required fields
- **WHEN** `_schema.yaml` is read
- **THEN** it defines `id`, `name`, `category`, `intent`, `dimensions`, `anchors`, and `structure` as required properties

#### Scenario: Schema defines valid anchors substructure
- **WHEN** `_schema.yaml` anchors property is read
- **THEN** it requires `colors` (with primary + auxiliary), `typography` (with baseSize + scale), `spacing` (with unit), and `radius` (with base)

### Requirement: Anchor values are valid design tokens
All concrete anchor values in archetype templates SHALL be syntactically valid.

#### Scenario: Color anchors are valid hex
- **WHEN** any archetype's `anchors.colors.primary` or `anchors.colors.auxiliary[]` values are read
- **THEN** each matches the pattern `^#[0-9a-fA-F]{6}$`

#### Scenario: Typography anchors are valid units
- **WHEN** any archetype's `anchors.typography.baseSize` is read
- **THEN** it matches the pattern `^\d+px$`

#### Scenario: Scale ratio is reasonable
- **WHEN** any archetype's `anchors.typography.scale` is read
- **THEN** it is a number between 1.0 and 2.0 (exclusive of boundaries)
