import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, readFileSync, rmSync, mkdirSync, writeFileSync, readdirSync, cpSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { scaffold } from '../src/scaffolder.js';
import type { ProjectConfig } from '../src/types.js';

vi.mock('../src/utils/tools.js', () => ({
  detectOpenspec: vi.fn().mockResolvedValue(false),
  installOpenspec: vi.fn().mockResolvedValue(false),
  initOpenspec: vi.fn().mockResolvedValue(true),
}));

function baseConfig(overrides: Partial<ProjectConfig> = {}): ProjectConfig {
  return {
    projectName: 'test-project',
    initGit: false,
    initOpenspec: false,
    targetDir: '',
    isExisting: false,
    ...overrides,
  } as ProjectConfig;
}

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

  it('greenfield: creates all required files', async () => {
    const config = baseConfig({ targetDir: tmpDir, initOpenspec: true });

    await scaffold(config);

    expect(existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(existsSync(path.join(tmpDir, '.gitignore'))).toBe(true);
    expect(existsSync(path.join(tmpDir, '.claude', 'settings.local.json'))).toBe(true);
    expect(existsSync(path.join(tmpDir, 'openspec', 'config.yaml'))).toBe(true);
    expect(existsSync(path.join(tmpDir, 'openspec', 'specs'))).toBe(true);
    expect(existsSync(path.join(tmpDir, 'openspec', 'changes', 'archive'))).toBe(true);
  });

  it('greenfield: does not create .claude/skills/grill-me/ (phase removed)', async () => {
    const config = baseConfig({ targetDir: tmpDir });

    await scaffold(config);

    expect(existsSync(path.join(tmpDir, '.claude', 'skills', 'grill-me'))).toBe(false);
  });

  it('greenfield: creates .claude/skills/fusereview/SKILL.md with rendered content', async () => {
    const config = baseConfig({ targetDir: tmpDir });

    await scaffold(config);

    const skillPath = path.join(tmpDir, '.claude', 'skills', 'fusereview', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    const content = readFileSync(skillPath, 'utf-8');
    expect(content).toContain('name: fusereview');
    expect(content).toContain('[test-strength]');
  });

  it('existing: does not overwrite existing fusereview skill', async () => {
    mkdirSync(path.join(tmpDir, '.claude', 'skills', 'fusereview'), { recursive: true });
    writeFileSync(path.join(tmpDir, '.claude', 'skills', 'fusereview', 'SKILL.md'), 'custom content');

    const config = baseConfig({ targetDir: tmpDir, isExisting: true });

    await scaffold(config);

    const content = readFileSync(path.join(tmpDir, '.claude', 'skills', 'fusereview', 'SKILL.md'), 'utf-8');
    expect(content).toBe('custom content');
  });

  it('greenfield: creates .claude/skills/design-md/SKILL.md', async () => {
    const config = baseConfig({ targetDir: tmpDir });

    await scaffold(config);

    expect(existsSync(path.join(tmpDir, '.claude', 'skills', 'design-md', 'SKILL.md'))).toBe(true);
    const content = readFileSync(path.join(tmpDir, '.claude', 'skills', 'design-md', 'SKILL.md'), 'utf-8');
    expect(content).toContain('name: design-md');
  });

  // Safety net for the copyTemplateDir refactor: these lock in design-md's
  // current distribution behavior so replacing the .yaml-only filter cannot
  // silently drop templates.
  it('greenfield: copies all design-md archetype templates', async () => {
    const config = baseConfig({ targetDir: tmpDir });

    await scaffold(config);

    const dir = path.join(tmpDir, '.claude', 'skills', 'design-md', 'templates');
    expect(existsSync(dir)).toBe(true);
    const files = readdirSync(dir);
    expect(files).toContain('_schema.yaml');
    expect(files.filter((f) => f.endsWith('.yaml')).length).toBe(17);
  });

  it('existing: does not overwrite a custom design-md SKILL.md', async () => {
    mkdirSync(path.join(tmpDir, '.claude', 'skills', 'design-md'), { recursive: true });
    const skillPath = path.join(tmpDir, '.claude', 'skills', 'design-md', 'SKILL.md');
    writeFileSync(skillPath, 'custom design-md content');

    await scaffold(baseConfig({ targetDir: tmpDir, isExisting: true }));

    expect(readFileSync(skillPath, 'utf-8')).toBe('custom design-md content');
  });

  it('greenfield: creates .claude/skills/fuseqa/SKILL.md with its templates', async () => {
    const config = baseConfig({ targetDir: tmpDir });

    await scaffold(config);

    const skillPath = path.join(tmpDir, '.claude', 'skills', 'fuseqa', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    expect(readFileSync(skillPath, 'utf-8')).toContain('name: fuseqa');

    const tdir = path.join(tmpDir, '.claude', 'skills', 'fuseqa', 'templates');
    expect(existsSync(tdir)).toBe(true);
    expect(readdirSync(tdir).sort()).toEqual([
      '_case-schema.yaml',
      'derivation-checklist.md',
      'entry-recipes.md',
      'ledger.md',
    ]);
  });

  it('existing: does not overwrite a custom fuseqa SKILL.md', async () => {
    mkdirSync(path.join(tmpDir, '.claude', 'skills', 'fuseqa'), { recursive: true });
    const skillPath = path.join(tmpDir, '.claude', 'skills', 'fuseqa', 'SKILL.md');
    writeFileSync(skillPath, 'custom fuseqa content');

    await scaffold(baseConfig({ targetDir: tmpDir, isExisting: true }));

    expect(readFileSync(skillPath, 'utf-8')).toBe('custom fuseqa content');
  });

  it('missing template source is fatal, not silently skipped', async () => {
    // A skill referencing templates that were never copied fails later and
    // further from its cause than a failed scaffold does. Simulated by making
    // the built template source unreadable to the copy step.
    const { rm } = await import('node:fs/promises');
    const srcDir = path.resolve(import.meta.dirname, '..', 'src', 'fuseqa', 'templates');
    const stash = path.join(os.tmpdir(), `fuseqa-tpl-stash-${Date.now()}`);

    // Move the real template dir aside, run scaffold, expect a thrown error.
    cpSync(srcDir, stash, { recursive: true });
    await rm(srcDir, { recursive: true, force: true });
    try {
      await expect(scaffold(baseConfig({ targetDir: tmpDir }))).rejects.toThrow(
        /Template source directory missing/,
      );
    } finally {
      cpSync(stash, srcDir, { recursive: true });
      rmSync(stash, { recursive: true, force: true });
    }
  });

  it('greenfield: CLAUDE.md contains methodology invariants and no tech-stack block', async () => {
    const config = baseConfig({ targetDir: tmpDir });

    await scaffold(config);

    const content = readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(content).toContain('Never skip TDD');
    expect(content).toContain('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE');
    expect(content).toContain('<!-- FUSION:START -->');
    expect(content).toContain('<!-- FUSION:END -->');
    expect(content).not.toContain('## Tech Stack');
  });

  it('greenfield: settings.local.json is valid JSON', async () => {
    const config = baseConfig({ targetDir: tmpDir });

    await scaffold(config);

    const raw = readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.permissions.allow).toBeInstanceOf(Array);
  });

  it('greenfield: fails if directory already exists', async () => {
    mkdirSync(tmpDir, { recursive: true });

    const config = baseConfig({ targetDir: tmpDir });

    await expect(scaffold(config)).rejects.toThrow('already exists');
  });

  // --- Existing project mode ---

  it('existing: merges CLAUDE.md fusion block into existing file', async () => {
    mkdirSync(tmpDir, { recursive: true });
    const existingContent = '# My Project\n\nSome existing content.\n';
    writeFileSync(path.join(tmpDir, 'CLAUDE.md'), existingContent);

    const config = baseConfig({ targetDir: tmpDir, isExisting: true });

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

    const config = baseConfig({ targetDir: tmpDir, isExisting: true });

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

    const config = baseConfig({ targetDir: tmpDir, isExisting: true });

    await scaffold(config);

    const result = readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8');
    expect(result).toContain('/custom/');
    expect(result).toContain('# My rules');
    const dsStoreCount = (result.match(/\.DS_Store/g) || []).length;
    expect(dsStoreCount).toBe(1);
  });

  it('ignores stray initCodegraph and stack fields from an untyped caller', async () => {
    // An untyped JS caller may still pass the removed fields; both must be
    // inert — no CodeGraph subprocess, no stack-derived content (spec:
    // "Scaffolding ignores stray fields from an untyped caller").
    const config = {
      projectName: 'test-project',
      initGit: false,
      initOpenspec: false,
      initCodegraph: true,
      stack: { id: 'stray', gitignorePatterns: ['/target/'], permissions: ['Bash(stray *)'] },
      targetDir: tmpDir,
      isExisting: false,
    } as unknown as ProjectConfig;

    await scaffold(config);

    expect(existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    const gitignore = readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8');
    expect(gitignore).not.toContain('.codegraph/');
    expect(gitignore).not.toContain('/target/');
    const settings = JSON.parse(readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8'));
    expect(settings.permissions.allow).not.toContain('Bash(stray *)');
  });

  it('collectProjectConfig returns no stack field', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    const config = await collectProjectConfig('test-project', true);
    expect(Object.prototype.hasOwnProperty.call(config, 'stack')).toBe(false);
    expect(config).toHaveProperty('projectName');
    expect(config).toHaveProperty('initGit');
    expect(config).toHaveProperty('initOpenspec');
    expect(config).toHaveProperty('targetDir');
    expect(config).toHaveProperty('isExisting');
  });

  it('existing: preserves a pre-existing .codegraph/ line (append-only merge)', async () => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(path.join(tmpDir, '.gitignore'), '# My rules\n.codegraph/\n');

    const config = baseConfig({ targetDir: tmpDir, isExisting: true });

    await scaffold(config);

    const result = readFileSync(path.join(tmpDir, '.gitignore'), 'utf-8');
    // Merging appends missing patterns and never removes lines, so a line the
    // user (or an older SpecFuse) wrote survives even though we no longer emit it.
    expect(result).toContain('.codegraph/');
  });

  it('existing: merges settings.local.json permissions', async () => {
    mkdirSync(path.join(tmpDir, '.claude'), { recursive: true });
    const existingSettings = { permissions: { allow: ['Bash(my-custom-cmd *)'] } };
    writeFileSync(
      path.join(tmpDir, '.claude', 'settings.local.json'),
      JSON.stringify(existingSettings, null, 2),
    );

    const config = baseConfig({ targetDir: tmpDir, isExisting: true });

    await scaffold(config);

    const raw = readFileSync(path.join(tmpDir, '.claude', 'settings.local.json'), 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.permissions.allow).toContain('Bash(my-custom-cmd *)');
    expect(parsed.permissions.allow).toContain('Bash(openspec *)');
  });

  it('existing: skips openspec config.yaml if it already exists', async () => {
    mkdirSync(path.join(tmpDir, 'openspec'), { recursive: true });
    writeFileSync(path.join(tmpDir, 'openspec', 'config.yaml'), 'schema: custom\n');

    const config = baseConfig({ targetDir: tmpDir, initOpenspec: true, isExisting: true });

    await scaffold(config);

    const result = readFileSync(path.join(tmpDir, 'openspec', 'config.yaml'), 'utf-8');
    expect(result).toBe('schema: custom\n');
  });
});
