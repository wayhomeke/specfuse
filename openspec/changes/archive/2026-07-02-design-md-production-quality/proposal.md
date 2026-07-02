## Why

The current design-md feature produces token output far below production quality — 5 colors, a numeric spacing array, 2 radius values, no components, and fixed template text. Compared to the [awesome-design-md standard](https://github.com/VoltAgent/awesome-design-md) (e.g., Airbnb: 22+ semantic colors, full type scale with weight/lineHeight/letterSpacing, 6-level named radius, component token cross-references, design rationale narrative), the gap is massive. Additionally, the current implementation relies on Node.js runtime logic (`questionnaire.ts`, `matcher.ts`, `renderer.ts`) that Claude cannot execute — the actual consumer is Claude reading SKILL.md instructions, not a Node process.

## What Changes

- **BREAKING**: Remove `src/design-md/questionnaire.ts`, `matcher.ts`, `renderer.ts`, `fine-tuner.ts`, `index.ts` — all Node.js runtime generation logic
- **BREAKING**: Remove the `generateDesignMd()` export and CLI-callable entry point
- Rewrite all 16 archetype YAML templates to "hybrid seed" format: intent descriptions + concrete reference token anchors + required output structure definition
- Rewrite `src/templates/design-md-skill.ts` to emit a comprehensive SKILL.md that serves as Claude's complete generation guide (questionnaire logic, archetype matching, token derivation rules, output format spec)
- Output format aligns to awesome-design-md standard: YAML front matter contains full structured tokens (colors/typography/spacing/rounded/elevation/components with `"{category.token}"` cross-references), Markdown body contains design philosophy and decision rationale

## Non-goals

- No CLI-mode generation (`specfuse design-md` command) — generation is exclusively Claude-driven
- No runtime dependency on inquirer/prompts — questionnaire logic is in SKILL.md instructions
- No theme switching or dark/light mode variants in this iteration
- No animation/motion token system
- No icon system tokens
- No integration with Figma or design tool exports

## Trade-offs

**Alternative A: Keep Node.js runtime + enhance templates** — Retain `generateDesignMd()` with richer templates and a more complex renderer. Rejected because: Claude cannot execute Node imports from SKILL.md, the runtime path adds maintenance burden with zero users, and Claude's contextual reasoning produces better adapted output than template string interpolation.

**Alternative B: Pure high-fidelity seed (no intent descriptions)** — Templates contain only concrete values, no mood/density metadata. Rejected because: Claude needs directional guidance to adapt tokens for the user's specific product; raw hex values without design intent context leads to arbitrary substitutions rather than coherent adaptations.

## Capabilities

### New Capabilities
- `design-md-skill-generation`: SKILL.md content generation — the comprehensive instruction document that guides Claude through questionnaire, archetype matching, token derivation, and DESIGN.md output
- `design-md-archetypes-v2`: Hybrid archetype template schema — intent + reference anchors + structure definition at L2 depth (15+ semantic colors, full type scale, named spacing/radius/elevation, 8-10 component token definitions)

### Modified Capabilities
- `design-md-archetypes`: Existing archetype schema is replaced entirely by v2 format (breaking schema change)
- `design-md-generator`: Existing generator capability is replaced — no longer Node.js runtime, now a static file distribution + SKILL.md instruction set

## Impact

- **Removed code**: `src/design-md/questionnaire.ts`, `matcher.ts`, `renderer.ts`, `fine-tuner.ts`, `index.ts`, `types.ts`
- **Modified code**: `src/templates/design-md-skill.ts` (complete rewrite), `src/design-md/templates/*.yaml` (all 16 files, new schema)
- **Retained code**: `src/scaffolder.ts` (unchanged — still copies SKILL.md + templates to target project)
- **Dependencies**: `@inquirer/prompts` can be removed if no other feature uses it (check first)
- **Tests**: `tests/design-md/` tests for matcher/renderer will be removed; new tests validate YAML schema compliance and SKILL.md content correctness
- **Published package**: Breaking change for anyone importing `generateDesignMd` from specfuse (if any)
