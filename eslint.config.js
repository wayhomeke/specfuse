import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Flat config (ESLint 9+). This file makes the lint gate that CLAUDE.md has
// always documented (`npx eslint .`) actually exist — before it, the repo had
// no config and no installed ESLint, so "zero warnings" was unmeasurable.
//
// Ignore list, and why each entry is not "hiding" project code:
//  - `openspec/`, `docs/`, `projects/` hold workflow artifacts and generated
//    sample pages, not source.
//  - `.claude/` holds agent scaffolding and a vendored third-party skill
//    (`.claude/skills/excalidraw-diagram` is a nested git checkout carrying a
//    Python `.venv` with playwright's JavaScript inside). Linting a vendored
//    dependency's internals says nothing about this project's code.
export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'openspec/**',
      'docs/**',
      'projects/**',
      '.claude/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      // `_`-prefixed parameters are intentional signature parity: the three
      // render* composers take a TemplateContext they do not read, so callers
      // can invoke them uniformly.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Test doubles need loose types: `exec` mock implementations take untyped
    // callback signatures, fixtures are partial config objects, and
    // `scaffold-no-codegraph.test.ts` passes a *deliberately* untyped caller —
    // a spec scenario requires exactly that ("ignores stray fields from an
    // untyped caller"). The rule stays enforced on `src/`, where it caught four
    // real casts that are now properly typed.
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
);
