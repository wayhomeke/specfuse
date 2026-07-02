## ADDED Requirements

### Requirement: Archetype template schema validation
Each archetype YAML file in `src/design-md/templates/` SHALL conform to `_schema.yaml` defining required fields: `id`, `name`, `category`, `dimensions`, `anchors`, `template`.

#### Scenario: Valid archetype file
- **WHEN** an archetype YAML is loaded
- **THEN** it contains `id` (kebab-case string), `name` (display string), `category` (enum), `dimensions` (5 integer fields 1-5), `anchors.primary` (string), `anchors.auxiliary` (string array length 1-2), `template` (multiline YAML string)

#### Scenario: Invalid archetype detected at load time
- **WHEN** an archetype file is missing a required field
- **THEN** `loadArchetypes()` throws an error with the file path and missing field name

#### Scenario: Dimension values out of range
- **WHEN** an archetype file has a dimension value < 1 or > 5
- **THEN** validation throws specifying the field and invalid value

### Requirement: Exactly 15 archetypes available
The system SHALL ship with exactly 15 archetype templates covering all defined categories.

#### Scenario: All archetypes loadable
- **WHEN** `loadArchetypes()` is called
- **THEN** returns exactly 15 `Archetype` objects

#### Scenario: Category coverage
- **WHEN** archetypes are loaded
- **THEN** at least one archetype exists for each category: `internal-tool`, `dashboard`, `consumer`, `developer`, `mobile`, `e-commerce`, `marketing`, `form-heavy`, `content`

### Requirement: Archetype category enum is exhaustive
The `category` field SHALL be a union type limited to the 9 defined categories.

#### Scenario: TypeScript enforces category values
- **WHEN** code assigns an unlisted string to `Archetype.category`
- **THEN** TypeScript compilation fails with a type error

### Requirement: Anchor products are documented per archetype
Each archetype SHALL declare 1 primary and 1-2 auxiliary reference products that exemplify the style.

#### Scenario: Primary anchor exists
- **WHEN** any archetype is inspected
- **THEN** `anchors.primary` is a non-empty string (product name)

#### Scenario: Auxiliary anchors bounded
- **WHEN** any archetype is inspected
- **THEN** `anchors.auxiliary` is an array with 1 or 2 elements

### Requirement: Dimension-to-token mapping is defined per archetype
Each archetype template SHALL include a mapping from dimension integer values (1-5) to concrete design token values.

#### Scenario: borderRadius dimension maps to CSS values
- **WHEN** archetype template is rendered with `borderRadius: 3`
- **THEN** output YAML contains a `border-radius` token with a specific px/rem value (not a dimension integer)

#### Scenario: All 5 dimensions produce token values
- **WHEN** any valid `DimensionVector` is applied to any archetype template
- **THEN** output contains tokens for: color palette, background lightness, spacing scale, border-radius, and font/tone characteristics

### Requirement: Archetype templates produce valid DESIGN.md YAML
The `template` field in each archetype SHALL be a valid YAML template string that, when rendered with a `DimensionVector`, produces parseable YAML.

#### Scenario: Rendered template is valid YAML
- **WHEN** any archetype template is rendered with any valid `DimensionVector`
- **THEN** the output string passes `yaml.parse()` without error

#### Scenario: Rendered template contains required token keys
- **WHEN** template is rendered
- **THEN** output YAML contains at minimum: `colors.primary`, `colors.background`, `spacing.base`, `radius.default`, `typography.fontFamily`
