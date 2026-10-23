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

describe('README documents the unattended entry point', () => {
  it('lists .claude/commands/specfuse.md in the generated tree', () => {
    expect(README).toMatch(/[├└]── specfuse\.md\s+# SpecFuse 提供：全自动入口/);
  });

  it('describes the unattended mode in its own section', () => {
    expect(README).toContain('### 无人值守：`/specfuse`');
    expect(README).toMatch(/不 commit、不 push/);
  });
});

describe('README frames FuseDoc as a standard, not a beat', () => {
  it('states it is not one of the beats', () => {
    expect(README).toMatch(/不属于四拍|不是拍/);
  });

  it('keeps the pipeline at four beats', () => {
    // A fifth beat would contradict the section that exists to say FuseDoc
    // is not one — this is the README-side twin of the CLAUDE.md assertion.
    expect(README).toContain('四拍流水线');
    expect(README).not.toMatch(/五拍|六拍|FuseDoc\s+apply 收尾/);
  });
});

describe('README documents the migration for existing projects', () => {
  it('names every derived file to remove before re-running the scaffolder', () => {
    for (const file of [
      '.claude/skills/fuseqa/SKILL.md',
      '.claude/skills/fusereview/SKILL.md',
      '.claude/commands/specfuse.md',
    ]) {
      expect(README).toContain(file);
    }
  });
});

describe('README documents FuseQA as on demand', () => {
  it('states that it is outside the pipeline and invoked explicitly', () => {
    expect(README).toContain('### FuseQA（按需，不属于流水线）');
    expect(README).toMatch(/只有显式调用 `\/fuseqa` 才执行/);
  });

  it('states the local versus CI/CD boundary', () => {
    expect(README).toMatch(/适合能在本地完整部署/);
    expect(README).toMatch(/CI\/CD/);
  });
});
