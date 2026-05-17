import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scaffold } from '../src/scaffolder.js';
import { getBuiltinStacks } from '../src/stacks/index.js';
import type { ProjectConfig } from '../src/types.js';

describe('scaffolder integration', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `fusion-test-${Date.now()}`);
  });

  afterEach(() => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  for (const stack of getBuiltinStacks()) {
    it(`${stack.id}: creates all required files`, async () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        stack,
        initGit: false,
        initOpenspec: true,
        targetDir: tmpDir,
      };

      await scaffold(config);

      expect(existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
      expect(existsSync(path.join(tmpDir, '.gitignore'))).toBe(true);
      expect(existsSync(path.join(tmpDir, '.claude', 'settings.local.json'))).toBe(true);
      expect(existsSync(path.join(tmpDir, 'openspec', 'config.yaml'))).toBe(true);
      expect(existsSync(path.join(tmpDir, 'openspec', 'specs'))).toBe(true);
      expect(existsSync(path.join(tmpDir, 'openspec', 'changes', 'archive'))).toBe(true);
    });
  }

  it('CLAUDE.md contains methodology invariants', async () => {
    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      targetDir: tmpDir,
    };

    await scaffold(config);

    const content = readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('Never skip TDD');
    expect(content).toContain('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE');
    expect(content).toContain('<!-- FUSION:START -->');
    expect(content).toContain('<!-- FUSION:END -->');
  });

  it('settings.local.json is valid JSON', async () => {
    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      targetDir: tmpDir,
    };

    await scaffold(config);

    const raw = readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.permissions.allow).toBeInstanceOf(Array);
  });

  it('fails if directory already exists', async () => {
    const { mkdirSync } = await import('node:fs');
    mkdirSync(tmpDir, { recursive: true });

    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      targetDir: tmpDir,
    };

    await expect(scaffold(config)).rejects.toThrow('already exists');
  });
});
