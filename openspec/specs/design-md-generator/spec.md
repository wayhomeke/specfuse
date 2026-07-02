## REMOVED Requirements

### Requirement: Node.js runtime generateDesignMd() entry point
**Reason**: The runtime generator (`src/design-md/index.ts` exporting `generateDesignMd()`) is replaced by SKILL.md instruction-driven generation. Claude cannot execute Node.js imports from SKILL.md, and no external consumers use this function.
**Migration**: Generation is now performed by Claude reading SKILL.md instructions. The `composeDesignMdSkill()` function in `src/templates/design-md-skill.ts` emits the SKILL.md content. `src/scaffolder.ts` distributes it to target projects unchanged.

### Requirement: Interactive questionnaire via @inquirer/prompts
**Reason**: Questionnaire logic moves from `src/design-md/questionnaire.ts` (using `@inquirer/prompts`) into SKILL.md as instructions Claude follows natively during conversation. The npm dependency becomes unused.
**Migration**: Remove `@inquirer/prompts` from `package.json` dependencies. Questionnaire flow is defined in SKILL.md §1.

### Requirement: Programmatic archetype matcher
**Reason**: `src/design-md/matcher.ts` (weighted Euclidean distance computation) is replaced by algorithm description in SKILL.md. Claude performs the matching mentally using the documented formula.
**Migration**: Matching algorithm is documented in SKILL.md §1 (Matching subsection). Remove `src/design-md/matcher.ts`.

### Requirement: Template string renderer
**Reason**: `src/design-md/renderer.ts` (string interpolation to produce DESIGN.md) is replaced by SKILL.md's output format specification. Claude generates the output directly following the spec.
**Migration**: Output format is specified in SKILL.md §3. Remove `src/design-md/renderer.ts`.

### Requirement: Fine-tuner interactive adjustment
**Reason**: `src/design-md/fine-tuner.ts` (post-match dimension adjustment via prompts) is replaced by SKILL.md instructions for Claude to offer dimension fine-tuning during conversation.
**Migration**: Fine-tuning flow is included in SKILL.md questionnaire section. Remove `src/design-md/fine-tuner.ts`.
