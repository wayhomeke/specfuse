## 1. Types & Config Foundation

- [x] 1.1 Add `DimensionVector`, `Archetype`, `QuestionnaireAnswers`, `DesignMdConfig` type definitions to `src/design-md/types.ts`. Write type-level tests ensuring dimension values are 1-5 integers and category is exhaustive union.
  - Verify: `npx tsc --noEmit`

## 2. Archetype Template Library

- [x] 2.1 Create `src/design-md/templates/_schema.yaml` defining the archetype validation schema. Write test `src/design-md/__tests__/archetype-schema.test.ts` that validates all archetype files against schema.
  - Verify: `npx vitest run src/design-md/__tests__/archetype-schema.test.ts`

- [x] 2.2 Create the first 5 archetypes (internal-tool, saas-dashboard, developer-portal, form-heavy, e-commerce) as YAML files in `src/design-md/templates/`. Each has id, name, category, dimensions, anchors, template.
  - Verify: `npx vitest run src/design-md/__tests__/archetype-schema.test.ts`

- [x] 2.3 Create remaining 10 archetypes (consumer-social, consumer-media, mobile-utility, mobile-lifestyle, marketing-corporate, marketing-creative, content-blog, content-docs, dashboard-analytics, dashboard-monitoring).
  - Verify: `npx vitest run src/design-md/__tests__/archetype-schema.test.ts`

- [x] 2.4 Implement `archetypes.ts` — `loadArchetypes()` function that reads YAML files, validates against schema, returns typed `Archetype[]`. Write unit test for load + validation error cases.
  - Verify: `npx vitest run src/design-md/__tests__/archetypes.test.ts`

## 3. Questionnaire Module

- [x] 3.1 Write test `src/design-md/__tests__/questionnaire.test.ts` defining expected Q1-Q5 structure: question types, option lists, defaults, and return shape.
  - Verify: `npx vitest run src/design-md/__tests__/questionnaire.test.ts` (tests should FAIL — red phase)

- [x] 3.2 Implement `questionnaire.ts` — defines Q1-Q5 questions with `@inquirer/prompts`, collects answers into `QuestionnaireAnswers`.
  - Verify: `npx vitest run src/design-md/__tests__/questionnaire.test.ts`

## 4. Dimension Derivation & Matching

- [x] 4.1 Write test `src/design-md/__tests__/matcher.test.ts` — test dimension derivation (same input → same output), range validation (all values 1-5), and matching order (closest distance first, category bonus applied).
  - Verify: `npx vitest run src/design-md/__tests__/matcher.test.ts` (tests should FAIL — red phase)

- [x] 4.2 Implement `matcher.ts` — `deriveVector(answers: QuestionnaireAnswers): DimensionVector` using predefined mapping table. Implement `matchArchetype(answers): {archetype, score}[]` with weighted Euclidean distance + 20% category bonus.
  - Verify: `npx vitest run src/design-md/__tests__/matcher.test.ts`

## 5. Fine-Tuner Module

- [x] 5.1 Write test `src/design-md/__tests__/fine-tuner.test.ts` — test dimension override applies correctly, skip returns original vector, invalid values rejected.
  - Verify: `npx vitest run src/design-md/__tests__/fine-tuner.test.ts` (tests should FAIL — red phase)

- [x] 5.2 Implement `fine-tuner.ts` — presents matched dimensions, allows user override per dimension, returns final `DimensionVector`.
  - Verify: `npx vitest run src/design-md/__tests__/fine-tuner.test.ts`

## 6. Renderer Module

- [x] 6.1 Write test `src/design-md/__tests__/renderer.test.ts` — test YAML front matter structure validity, required token keys present, Markdown section headers, dimension-to-token mapping correctness.
  - Verify: `npx vitest run src/design-md/__tests__/renderer.test.ts` (tests should FAIL — red phase)

- [x] 6.2 Implement `renderer.ts` — `renderDesignMd(archetype: Archetype, vector: DimensionVector): string`. Maps dimensions to concrete token values, renders template.
  - Verify: `npx vitest run src/design-md/__tests__/renderer.test.ts`

## 7. Orchestrator (index.ts)

- [x] 7.1 Write test `src/design-md/__tests__/index.test.ts` — test full flow: calls questionnaire → matcher → fine-tuner → renderer → writes file. Test backup behavior when DESIGN.md exists. Test abort when user declines overwrite.
  - Verify: `npx vitest run src/design-md/__tests__/index.test.ts` (tests should FAIL — red phase)

- [x] 7.2 Implement `src/design-md/index.ts` — `generateDesignMd(targetDir: string): Promise<string | null>` orchestrating the full pipeline.
  - Verify: `npx vitest run src/design-md/__tests__/index.test.ts`

## 8. SKILL.md Installation in Scaffolder

- [x] 8.1 Add SKILL.md write step to `src/scaffolder.ts` — write `.claude/skills/design-md/SKILL.md` to target directory and output one init log line (same pattern as grill-me skill at lines 131-137). No config field, no prompt, no interactive generation. *(blocked by 9.1)*
  - Verify: `npx vitest run`

## 9. Skill Definition

- [x] 9.1 Create `.claude/skills/design-md/SKILL.md` defining the `/design-md` skill trigger for manual invocation (brownfield projects). Skill calls `generateDesignMd(cwd)`.
  - Verify: file exists and is valid Markdown

## 10. CLAUDE.md Constraint Rules

- [x] 10.1 Add DESIGN.md trigger rules to `CLAUDE.md`: greenfield auto-trigger condition (brainstorm + frontend intent detected) and brownfield manual `/design-md` invocation.
  - Verify: `grep "design-md" CLAUDE.md`

## 11. Full Integration Test

- [x] 11.1 Write integration test: `specfuse init` → verify `.claude/skills/design-md/SKILL.md` file created with valid content.
  - Verify: `npx vitest run` (full suite green)

- [x] 11.2 Run full lint and typecheck.
  - Verify: `npx eslint . && npx tsc --noEmit`
