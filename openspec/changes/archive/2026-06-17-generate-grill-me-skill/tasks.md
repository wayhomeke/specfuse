## 1. Create grill-me-skill template

- [x] 1.1 Write test: `composeGrillMeSkill()` returns non-empty string
  - Verify: `npx vitest run tests/templates/grill-me-skill.test.ts`
- [x] 1.2 Write test: output starts with `---` frontmatter containing `name: grill-me`
  - Verify: `npx vitest run tests/templates/grill-me-skill.test.ts`
- [x] 1.3 Write test: output contains reference to "CLAUDE.md" and "Pre-Apply Review"
  - Verify: `npx vitest run tests/templates/grill-me-skill.test.ts`
- [x] 1.4 Write test: output contains `.grill-backup/`, `grill-stop`, `grill-abort`
  - Verify: `npx vitest run tests/templates/grill-me-skill.test.ts`
- [x] 1.5 Implement `composeGrillMeSkill()` in `src/templates/grill-me-skill.ts`
  - Verify: `npx vitest run tests/templates/grill-me-skill.test.ts`

## 2. Integrate into scaffolder

- [x] 2.1 Write test: greenfield scaffold creates `.claude/skills/grill-me/SKILL.md`
  - Verify: `npx vitest run tests/scaffolder.test.ts`
- [x] 2.2 Write test: existing skill file is not overwritten
  - Verify: `npx vitest run tests/scaffolder.test.ts`
- [x] 2.3 Add skill file generation step to `scaffold()` in `src/scaffolder.ts`
  - Verify: `npx vitest run tests/scaffolder.test.ts`

## 3. Full verification

- [x] 3.1 Run full test suite passes
  - Verify: `npx vitest run`
- [x] 3.2 Run typecheck passes
  - Verify: `npx tsc --noEmit`
