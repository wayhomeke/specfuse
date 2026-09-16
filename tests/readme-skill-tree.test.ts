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

describe('README frames FuseDoc as a standard, not a beat', () => {
  it('states it is not one of the beats', () => {
    expect(README).toMatch(/不属于五拍|不是拍/);
  });

  it('keeps the pipeline at five beats', () => {
    // A sixth beat would contradict the section that exists to say FuseDoc
    // is not one — this is the README-side twin of the CLAUDE.md assertion.
    expect(README).toContain('五拍流水线');
    expect(README).not.toMatch(/六拍|FuseDoc\s+apply 收尾/);
  });
});
