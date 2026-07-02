## 1. Schema & Validation Foundation

- [x] 1.1 Write test: `_schema.yaml` validates v2 hybrid seed structure (requires intent, dimensions, anchors with colors/typography/spacing/radius, structure)
  - Verify: `npx vitest run tests/design-md/schema.test.ts`
- [x] 1.2 Rewrite `src/design-md/templates/_schema.yaml` to v2 format (add intent, expand anchors, add structure)
  - Verify: `npx vitest run tests/design-md/schema.test.ts`

## 2. Archetype Templates Rewrite

- [x] 2.1 Write test: all 16 archetype YAMLs validate against v2 schema (hybrid seed fields, valid hex colors, valid px units, scale ratio 1.0-2.0)
  - Verify: `npx vitest run tests/design-md/archetypes.test.ts`
- [x] 2.2 Rewrite first 4 archetypes to v2 hybrid seed format (internal-tool category: e.g., enterprise-admin, data-dashboard, dev-console, ops-monitor)
  - Verify: `npx vitest run tests/design-md/archetypes.test.ts`
- [x] 2.3 Rewrite next 4 archetypes to v2 hybrid seed format (consumer/mobile category)
  - Verify: `npx vitest run tests/design-md/archetypes.test.ts`
- [x] 2.4 Rewrite next 4 archetypes to v2 hybrid seed format (e-commerce/marketing category)
  - Verify: `npx vitest run tests/design-md/archetypes.test.ts`
- [x] 2.5 Rewrite final 4 archetypes to v2 hybrid seed format (form-heavy/content/remaining categories)
  - Verify: `npx vitest run tests/design-md/archetypes.test.ts`

## 3. SKILL.md Content Rewrite

- [x] 3.1 Write test: `composeDesignMdSkill()` output contains required sections (Questionnaire with 5 questions, Matching algorithm, Token Derivation rules, Output Format spec, Backup instruction)
  - Verify: `npx vitest run tests/design-md/skill-content.test.ts`
- [x] 3.2 Write SKILL.md §1: questionnaire logic with dimension mapping rules
  - Verify: `npx vitest run tests/design-md/skill-content.test.ts`
- [x] 3.3 Write SKILL.md §2: archetype matching algorithm (weighted Euclidean + category bonus)
  - Verify: `npx vitest run tests/design-md/skill-content.test.ts`
- [x] 3.4 Write SKILL.md §3: token derivation rules (colors 15+, typography scale, spacing 6-level, radius 6-level, elevation, components 8-10, cross-reference syntax)
  - Verify: `npx vitest run tests/design-md/skill-content.test.ts`
- [x] 3.5 Write SKILL.md §4: output format specification (YAML front matter schema + Markdown body structure)
  - Verify: `npx vitest run tests/design-md/skill-content.test.ts`
- [x] 3.6 Write SKILL.md §5: backup/overwrite protection instructions
  - Verify: `npx vitest run tests/design-md/skill-content.test.ts`

## 4. Remove Dead Code

- [x] 4.1 Delete Node.js runtime files: `src/design-md/index.ts`, `questionnaire.ts`, `matcher.ts`, `renderer.ts`, `fine-tuner.ts`, `types.ts`, `archetypes.ts`, `schema.ts`
  - Verify: `npx tsc --noEmit` (no import errors)
- [x] 4.2 ~~Remove `@inquirer/prompts` from package.json dependencies~~ SKIPPED: `src/prompts.ts` still uses it
  - Verify: `grep -r "@inquirer/prompts" src/ --include="*.ts" | grep -v design-md` confirms usage
- [x] 4.3 Update `package.json` build script to remove `cp -r src/design-md/templates dist/design-md/templates` (templates now copied by scaffolder at runtime, not build time) — OR adjust to new path if still needed
  - Verify: `npm run build` succeeds (no change needed, templates dir still exists)
- [x] 4.4 Remove or update old test files that reference deleted modules (`tests/design-md/` matcher/renderer tests)
  - Verify: `npx vitest run` all tests pass (no stale references found)

## 5. Integration Verification

- [x] 5.1 Run full test suite to confirm no regressions
  - Verify: `npx vitest run` — 675 tests passed, 10 files, 0 failures
- [x] 5.2 Run scaffolder integration test to confirm SKILL.md + templates still distribute correctly
  - Verify: `npx vitest run tests/scaffolder.test.ts` — 29 tests passed
- [x] 5.3 Run typecheck and lint
  - Verify: `npx tsc --noEmit && npx eslint .` — both pass
