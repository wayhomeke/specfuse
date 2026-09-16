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

/**
 * The scaffolder reports OpenSpec readiness through stdout, so these suites
 * capture console.log rather than inspecting the filesystem.
 */
async function captureScaffold(config: ProjectConfig): Promise<string> {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  try {
    await scaffold(config);
  } finally {
    spy.mockRestore();
  }
  return lines.join('\n');
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

  it('greenfield: creates .claude/skills/fusedoc/SKILL.md with its references', async () => {
    await scaffold(baseConfig({ targetDir: tmpDir }));

    const skillPath = path.join(tmpDir, '.claude', 'skills', 'fusedoc', 'SKILL.md');
    expect(existsSync(skillPath)).toBe(true);
    expect(readFileSync(skillPath, 'utf-8')).toContain('name: fusedoc');

    const refDir = path.join(tmpDir, '.claude', 'skills', 'fusedoc', 'references');
    expect(existsSync(refDir)).toBe(true);
    expect(readdirSync(refDir).sort()).toEqual([
      'examples.md',
      'probes.md',
      'recall-batteries.md',
    ]);
  });

  it('greenfield: the installed skill links resolve inside the target project', async () => {
    await scaffold(baseConfig({ targetDir: tmpDir }));

    const skillDir = path.join(tmpDir, '.claude', 'skills', 'fusedoc');
    const body = readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');
    const linked = [...body.matchAll(/references\/([a-z-]+\.md)/g)].map((m) => m[1]);
    expect(linked.length).toBeGreaterThanOrEqual(3);
    for (const name of new Set(linked)) {
      expect(existsSync(path.join(skillDir, 'references', name))).toBe(true);
    }
  });

  it('names the skill in the printed file listing', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir }));

    expect(out).toContain('.claude/skills/fusedoc/');
    expect(out).toMatch(/Documentation standard/);
  });

  it('names the skill in the install progress message', async () => {
    const written: string[] = [];
    const spy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation((chunk: string | Uint8Array) => {
        written.push(String(chunk));
        return true;
      });
    try {
      await scaffold(baseConfig({ targetDir: tmpDir }));
    } finally {
      spy.mockRestore();
    }

    expect(written.join('')).toMatch(/fusedoc/);
  });

  it('existing: does not overwrite a custom fusedoc SKILL.md', async () => {
    mkdirSync(path.join(tmpDir, '.claude', 'skills', 'fusedoc'), { recursive: true });
    const skillPath = path.join(tmpDir, '.claude', 'skills', 'fusedoc', 'SKILL.md');
    writeFileSync(skillPath, 'custom fusedoc content');

    await scaffold(baseConfig({ targetDir: tmpDir, isExisting: true }));

    expect(readFileSync(skillPath, 'utf-8')).toBe('custom fusedoc content');
  });

  it('installs unconditionally, asking no extra question', async () => {
    // No prompt is mocked for FuseDoc, so a scaffold that asked one would hang
    // or throw. Reaching the end proves the install is unconditional.
    const config = baseConfig({ targetDir: tmpDir });
    await scaffold(config);

    expect(existsSync(path.join(tmpDir, '.claude', 'skills', 'fusedoc', 'SKILL.md'))).toBe(true);
    expect(Object.keys(config)).not.toContain('initFusedoc');
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

  it('existing: merged CLAUDE.md gains the FuseDoc references and keeps user content', async () => {
    mkdirSync(tmpDir, { recursive: true });
    writeFileSync(path.join(tmpDir, 'CLAUDE.md'), '# My Project\n\nSome existing content.\n');

    await scaffold(baseConfig({ targetDir: tmpDir, isExisting: true }));

    const result = readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf-8');
    expect(result).toContain('Documentation Standard: FuseDoc');
    expect(result).toContain('.claude/skills/fusedoc/SKILL.md');
    expect(result).toContain('Some existing content.');
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

// spec: openspec-readiness-reporting
// Safety net: the E2E cases always run with openspec off PATH and a stubbed npm,
// i.e. permanently on the install-failed path. The success path can only be held
// down here, so it is pinned before the print block is touched.
describe('OpenSpec readiness reporting — success path', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `fusion-ready-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  });

  afterEach(async () => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
    // Reset here, not in a test body: a body-level reset is skipped whenever the
    // test fails, leaving the mock mutated for whatever runs next.
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);
  });

  it('prints the opsx line verbatim when OpenSpec is ready', async () => {
    // The top-level mock defaults to detect=false/install=false, i.e. the
    // install-failed path. Readiness must be set explicitly.
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(true);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);

    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).toContain('/opsx:propose   # start your first change');
  });

  it('prints the opsx line verbatim and no notice when the user declined OpenSpec', async () => {
    // 'skipped' and 'ready' print identically but are distinct states: nothing
    // was attempted, so nothing failed and there is nothing to report.
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: false }));

    expect(out).toContain('/opsx:propose   # start your first change');
    expect(out).not.toMatch(/OpenSpec CLI not (installed|available)/i);
  });
});

// The trust write is the one thing scaffold() does outside the project directory.
// `os.homedir()` reads `process.env.HOME` at call time, so reassigning it
// in-process redirects that write into a scratch home — the same isolation the
// E2E cases get from their spawned env. Restored in afterEach rather than in the
// test body: a body-level restore is skipped when the test fails, and this one
// would then leak a fake HOME into every later test.
describe('trust write tolerates a malformed ~/.claude.json', () => {
  let tmpDir: string;
  let realHome: string | undefined;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `fusion-trust-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(tmpDir, { recursive: true });
    realHome = process.env.HOME;
  });

  afterEach(() => {
    if (realHome === undefined) delete process.env.HOME;
    else process.env.HOME = realHome;
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('self-heals a falsy projects field rather than silently skipping the write', async () => {
    const home = path.join(tmpDir, 'home');
    mkdirSync(home, { recursive: true });
    // Parseable but malformed: a falsy scalar where an object belongs. The
    // function's own comment says it starts fresh on malformed input.
    writeFileSync(path.join(home, '.claude.json'), JSON.stringify({ projects: 0, kept: 'unchanged' }));
    process.env.HOME = home;

    const target = path.join(tmpDir, 'project');
    await captureScaffold(baseConfig({ targetDir: target }));

    const written = JSON.parse(readFileSync(path.join(home, '.claude.json'), 'utf-8'));
    expect(typeof written.projects).toBe('object');
    expect(written.projects[path.resolve(target)].hasTrustDialogAccepted).toBe(true);
    // Unknown keys must survive the read-modify-write round trip.
    expect(written.kept).toBe('unchanged');
  });
});

// spec: openspec-readiness-reporting
describe('OpenSpec readiness reporting — install failed', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `fusion-nofail-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.installOpenspec).mockResolvedValue(false);
  });

  afterEach(async () => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.installOpenspec).mockResolvedValue(false);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);
  });

  it('annotates the opsx line instead of promising it works', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).toMatch(/\/opsx:propose\s+\S*#? ?unavailable yet/i);
    expect(out).not.toContain('# start your first change');
  });

  it('lists both repair commands, since the CLI itself is missing', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).toContain('npm i -g @fission-ai/openspec');
    expect(out).toContain('openspec init --tools claude --force');
  });

  it('states the consequence: the opsx commands do not exist yet', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).toMatch(/\/opsx:\*/);
    expect(out).toMatch(/not available|cannot be entered/i);
  });

  it('places the notice after Next steps', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    const nextSteps = out.indexOf('Next steps');
    const notice = out.search(/OpenSpec (CLI )?(not|is not)/i);
    expect(nextSteps).toBeGreaterThan(-1);
    expect(notice).toBeGreaterThan(nextSteps);
  });
});

// spec: openspec-readiness-reporting
describe('OpenSpec readiness reporting — init failed', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `fusion-initfail-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(true);
    vi.mocked(tools.initOpenspec).mockResolvedValue(false);
  });

  afterEach(async () => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);
  });

  it('lists only the init command, because the CLI is already installed', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).toContain('openspec init --tools claude --force');
    expect(out).not.toContain('npm i -g @fission-ai/openspec');
  });

  it('annotates the opsx line on this path too', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).not.toContain('# start your first change');
  });
});

// spec: openspec-readiness-reporting
describe('OpenSpec readiness reporting — no notice on the quiet paths', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `fusion-quiet-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  });

  afterEach(async () => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);
  });

  it('prints no OpenSpec notice when it is ready', async () => {
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(true);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);

    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).not.toMatch(/Note: OpenSpec/i);
    expect(out).not.toContain('npm i -g @fission-ai/openspec');
  });

  it('prints no OpenSpec notice when the user declined it', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: false }));

    expect(out).not.toMatch(/Note: OpenSpec/i);
  });
});

// spec: openspec-readiness-reporting
describe('OpenSpec readiness reporting — Next steps keeps its structure', () => {
  let tmpDir: string;

  // chalk emits escape codes even in a non-TTY, so strip them before comparing
  // structure; otherwise a coloured comment marker looks like a different line.
  // The control character in the pattern is the point: it is the ANSI
  // escape chalk emits for colour, which these comparisons must strip.
  // eslint-disable-next-line no-control-regex
  const stripAnsi = (v: string) => v.replace(/\u001b\[[0-9;]*m/g, '');

  const nextStepsBlock = (out: string) => {
    const lines = stripAnsi(out).split('\n');
    const start = lines.findIndex((l) => l.includes('Next steps'));
    const rest = lines.slice(start + 1);
    const end = rest.findIndex((l) => l.trim() === '');
    return (end === -1 ? rest : rest.slice(0, end)).map((l) => l.trim());
  };

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `fusion-struct-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  });

  afterEach(async () => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);
  });

  it('emits the same lines in the same order on both paths', async () => {
    // Guards against a future line inserted into Next steps that bypasses the
    // annotation: the sequences would stop matching.
    const failed = nextStepsBlock(
      await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true })),
    );

    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(true);
    const ready = nextStepsBlock(
      await captureScaffold(baseConfig({ targetDir: `${tmpDir}-b`, initOpenspec: true })),
    );
    rmSync(`${tmpDir}-b`, { recursive: true, force: true });

    // Pinned against a literal sequence: a relative comparison alone cannot see
    // a line added unconditionally, because it appears on both paths and the
    // sequences still match.
    expect(failed.map((l) => l.split('#')[0].trim())).toEqual([
      'cd test-project',
      'claude',
      '/opsx:propose',
    ]);
    expect(failed.length).toBe(ready.length);
    expect(failed.map((l) => l.split('#')[0].trim())).toEqual(
      ready.map((l) => l.split('#')[0].trim()),
    );
  });

  it('keeps repair commands out of Next steps', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));
    const block = nextStepsBlock(out).join('\n');

    expect(block).not.toContain('npm i -g');
    expect(block).not.toContain('openspec init');
  });
});

// spec: openspec-readiness-reporting
describe('OpenSpec readiness comes from the recorded outcome, not a probe', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `fusion-probe-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    // Set the mocks this suite needs rather than inheriting whatever the previous
    // suite's afterEach left behind: a leaked detect=true makes this read as ready
    // and the suite passes for the wrong reason.
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.installOpenspec).mockResolvedValue(false);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('still reports failure when a stale opsx directory exists from an earlier run', async () => {
    // A filesystem probe would read this leftover directory as success and hide
    // the failure that happened in THIS run.
    mkdirSync(path.join(tmpDir, '.claude', 'commands', 'opsx'), { recursive: true });
    writeFileSync(path.join(tmpDir, '.claude', 'commands', 'opsx', 'new.md'), 'stale');

    const out = await captureScaffold(
      baseConfig({ targetDir: tmpDir, initOpenspec: true, isExisting: true }),
    );

    expect(out).toMatch(/Note: OpenSpec/i);
    expect(out).not.toContain('# start your first change');
  });
});

// spec: openspec-readiness-reporting
// The branch where installOpenspec() succeeds but initOpenspec() then fails.
// Nothing else in the suite sets installOpenspec to true, so without this suite
// `if (installed)` is never entered and the original defect can be reintroduced
// there while every gate stays green.
describe('OpenSpec readiness reporting — installed, then init failed', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `fusion-postinst-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.installOpenspec).mockResolvedValue(true);
    vi.mocked(tools.initOpenspec).mockResolvedValue(false);
  });

  afterEach(async () => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
    const tools = await import('../src/utils/tools.js');
    vi.mocked(tools.detectOpenspec).mockResolvedValue(false);
    vi.mocked(tools.installOpenspec).mockResolvedValue(false);
    vi.mocked(tools.initOpenspec).mockResolvedValue(true);
  });

  it('reports failure rather than promising the command works', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).not.toContain('# start your first change');
    expect(out).toMatch(/Note: OpenSpec/i);
  });

  it('lists only the init command, since the CLI got installed', async () => {
    const out = await captureScaffold(baseConfig({ targetDir: tmpDir, initOpenspec: true }));

    expect(out).toContain('openspec init --tools claude --force');
    expect(out).not.toContain('npm i -g @fission-ai/openspec');
  });
});
