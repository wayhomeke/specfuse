## 1. Trust-List Preservation

- [x] 1.1 RED — Add tests to `tests/scaffolder.test.ts` that reproduce the overwrite: an invalid-JSON `~/.claude.json` is left byte-identical with a warning; a non-object root is left byte-identical with a warning; a truthy non-object `projects` field is left byte-identical with a warning; a non-object target entry is left byte-identical with a warning. Verify: `npx vitest run tests/scaffolder.test.ts` fails on the invalid-JSON and nested-entry cases.
- [x] 1.2 GREEN — Update `trustDirectory()` in `src/scaffolder.ts` to distinguish `ENOENT` from other read errors, skip and warn on parse failure or a non-plain-object root, skip and warn on a truthy non-object `projects` container, and skip and warn on a truthy non-object target entry. Verify: the new tests pass.
- [x] 1.3 Keep the existing valid-object merge and falsy-`projects` self-heal; rename the existing test's description so it states the self-heal rather than claiming general malformed-file tolerance. Verify: `npx vitest run tests/scaffolder.test.ts` passes.
- [x] 1.4 Add a missing-file case and a valid-merge case (unknown keys plus another project) to lock the create and merge paths. Verify: same suite passes.
- [x] 1.5 Run and paste raw output: `npm run build`, `npx tsc --noEmit`, `npx vitest run`, `npx eslint .`, `openspec validate preserve-unparseable-claude-json --strict`.

## 2. Built-Artifact E2E

- [x] 2.1 Author `tests/e2e/preserve-unparseable-claude-json/trust-list.test.ts` to run the built `dist/index.js` through a symlinked bin shim with a scratch HOME containing invalid JSON, and assert the file is unchanged, stderr carries the warning without its contents, and the process exits zero. Verify: `npm run build && npx vitest run tests/e2e/preserve-unparseable-claude-json/trust-list.test.ts` passes.
