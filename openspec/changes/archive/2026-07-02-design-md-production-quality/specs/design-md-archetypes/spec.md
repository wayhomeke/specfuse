## REMOVED Requirements

### Requirement: Archetype schema v1 (flat dimensions + minimal anchors)
**Reason**: Replaced by design-md-archetypes-v2 hybrid seed schema. The v1 schema only has `dimensions` (5 integers) and `anchors` (primary + auxiliary colors) — insufficient for L2 token depth generation.
**Migration**: All 16 archetype YAML files will be rewritten to v2 format. The `_schema.yaml` will be updated to define the new structure. No external consumers of the YAML schema exist.

### Requirement: Category-based matching with minimal anchors
**Reason**: The v1 matching only used `dimensions` vector + `category` enum. The v2 schema retains these fields (backward-compatible for matching algorithm) but adds `intent`, `anchors` (expanded), and `structure` sections.
**Migration**: Matching algorithm remains compatible — it still operates on `dimensions` + `category`. New fields are consumed only during token derivation phase.
