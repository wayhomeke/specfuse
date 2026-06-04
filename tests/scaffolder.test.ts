import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scaffold } from '../src/scaffolder.js';
import { getBuiltinStacks } from '../src/stacks/index.js';
import type { ProjectConfig } from '../src/types.js';

vi.mock('../src/utils/tools.js', () => ({
  detectCodegraph: vi.fn().mockResolvedValue(false),
  installCodegraph: vi.fn().mockResolvedValue(false),
  initCodegraph: vi.fn().mockResolvedValue(true),
  detectOpenspec: vi.fn().mockResolvedValue(false),
  installOpenspec: vi.fn().mockResolvedValue(false),
  initOpenspec: vi.fn().mockResolvedValue(true),
}));

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

  // --- Greenfield mode (new project) ---

  for (const stack of getBuiltinStacks()) {
    it(`greenfield ${stack.id}: creates all required files`, async () => {
      const config: ProjectConfig = {
        projectName: 'test-project',
        stack,
        initGit: false,
        initOpenspec: true,
        initCodegraph: false,
        targetDir: tmpDir,
        isExisting: false,
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

  it('greenfield: CLAUDE.md contains methodology invariants', async () => {
    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: false,
    };

    await scaffold(config);

    const content = readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('Never skip TDD');
    expect(content).toContain('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE');
    expect(content).toContain('<!-- FUSION:START -->');
    expect(content).toContain('<!-- FUSION:END -->');
  });

  it('greenfield: settings.local.json is valid JSON', async () => {
    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: false,
    };

    await scaffold(config);

    const raw = readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.permissions.allow).toBeInstanceOf(Array);
  });

  it('greenfield: fails if directory already exists', async () => {
    mkdirSync(tmpDir, { recursive: true });

    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: false,
    };

    await expect(scaffold(config)).rejects.toThrow('already exists');
  });

  // --- Existing project mode ---

  it('existing: merges CLAUDE.md fusion block into existing file', async () => {
    mkdirSync(tmpDir, { recursive: true });
    const existingContent = '# My Project\n\nSome existing content.\n';
    writeFileSync(path.join(tmpDir, 'CLAUDE.md'), existingContent);

    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: true,
    };

    await scaffold(config);

    const result = readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(result).toContain('Some existing content.');
    expect(result).toContain('<!-- FUSION:START -->');
    expect(result).toContain('Never skip TDD');
  });

  it('existing: replaces fusion block if markers already exist', async () => {
    mkdirSync(tmpDir, { recursive: true });
    const existingContent = '# My Project\n\n<!-- FUSION:START -->\nold stuff\n<!-- FUSION:END -->\n\n# Footer\n';
    writeFileSync(path.join(tmpDir, 'CLAUDE.md'), existingContent);

    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: true,
    };

    await scaffold(config);

    const result = readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(result).toContain('# My Project');
    expect(result).toContain('# Footer');
    expect(result).not.toContain('old stuff');
    expect(result).toContain('Never skip TDD');
    const markerCount = (result.match(/FUSION:START/g) || []).length;
    expect(markerCount).toBe(1);
  });

  it('existing: merges gitignore without duplicates', async () => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(path.join(tmpDir, '.gitignore'), '# My rules\n.DS_Store\n/custom/\n');

    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: true,
    };

    await scaffold(config);

    const result = readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8');
    expect(result).toContain('/custom/');
    expect(result).toContain('# My rules');
    const dsStoreCount = (result.match(/\.DS_Store/g) || []).length;
    expect(dsStoreCount).toBe(1);
  });

  it('existing: merges settings.local.json permissions', async () => {
    mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    const existingSettings = { permissions: { allow: ['Bash(my-custom-cmd *)'] } };
    writeFileSync(
      path.join(tmpDir, '.claude', 'settings.local.json'),
      JSON.stringify(existingSettings, null, 2),
    );

    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: true,
    };

    await scaffold(config);

    const raw = readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.permissions.allow).toContain('Bash(my-custom-cmd *)');
    expect(parsed.permissions.allow).toContain('Bash(openspec *)');
  });

  it('existing: skips openspec config.yaml if it already exists', async () => {
    mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    writeFileSync(path.join(tmpDir, 'openspec', 'config.yaml'), 'schema: custom\n');

    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: true,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: true,
    };

    await scaffold(config);

    const result = readFileSync(path.join(tmpDir, 'openspec', 'config.yaml'), 'utf-8');
    expect(result).toBe('schema: custom\n');
  });

  // --- CodeGraph integration ---

  it('codegraph: skips when initCodegraph is false', async () => {
    const { detectCodegraph } = await import('../src/utils/tools.js');
    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: false,
      targetDir: tmpDir,
      isExisting: false,
    };

    await scaffold(config);

    expect(existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(detectCodegraph).not.toHaveBeenCalled();
  });

  it('codegraph: attempts detection and install when initCodegraph is true', async () => {
    const { detectCodegraph, installCodegraph } = await import('../src/utils/tools.js');
    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: true,
      targetDir: tmpDir,
      isExisting: false,
    };

    await scaffold(config);

    expect(existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(detectCodegraph).toHaveBeenCalled();
    expect(installCodegraph).toHaveBeenCalled();
  });

  it('codegraph: calls initCodegraph when already installed', async () => {
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectCodegraph).mockClear();
    vi.mocked(tools.installCodegraph).mockClear();
    vi.mocked(tools.initCodegraph).mockClear();
    vi.mocked(tools.detectCodegraph).mockResolvedValueOnce(true);
    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: false,
      initOpenspec: false,
      initCodegraph: true,
      targetDir: tmpDir,
      isExisting: false,
    };

    await scaffold(config);

    expect(tools.detectCodegraph).toHaveBeenCalled();
    expect(tools.initCodegraph).toHaveBeenCalledWith(tmpDir);
    expect(tools.installCodegraph).not.toHaveBeenCalled();
  });
});
