import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// The README tree is the package's front page: it tells a user what a scaffold
// installs. Adding a skill without updating it leaves shipped documentation
// describing a different product than the one npx runs.
const README = readFileSync(path.join(import.meta.dirname, '../README.md'), 'utf-8');

describe('README documents every skill the scaffolder installs', () => {
  for (const skill of ['design-md', 'fusereview', 'fuseqa', 'fusedoc']) {
    it(`lists ${skill}/ in the generated tree`, () => {
      expect(README).toContain(`${skill}/`);
    });
  }
});
