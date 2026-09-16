import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * FuseQA case — authored per .claude/skills/fuseqa/templates contracts.
 *
 *   artifact:   dist/index.js (the build output), invoked as a real process
 *   entry:      subprocess with argv, and a symlinked bin shim (the npm/npx path)
 *   isolation:  one temp directory per file, a fresh subdirectory per case,
 *               plus a scratch HOME/XDG_CONFIG_HOME; whole tree removed on teardown
 *   observable: files written into the scaffolded project, process exit status
 *   traces-to:  spec fusedoc-skill-generation / "Skill reaches the target through
 *               the published artifact" and "Reference files ship with the skill"
 *
 * Why this cannot be a unit test: tests/templates/fusedoc-skill.test.ts calls
 * composeFuseDocSkill() and inspects the returned string, and
 * tests/scaffolder.test.ts imports scaffold() directly. Neither observes the
 * build output. dist/fusedoc/templates is produced by the build script's
 * template-directory glob, not by tsc — if the source directory were named
 * anything other than templates, the references would silently stop shipping
 * while every unit test stayed green. Only invoking the built artifact sees it.
 */
const DIST = path.resolve(import.meta.dirname, '..', '..', '..', 'dist', 'index.js');
const EXPECTED_REFERENCES = ['examples.md', 'probes.md', 'recall-batteries.md'];

describe('scaffolded project receives the FuseDoc skill from the built artifact', () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error('run `npm run build` before this suite');
    dir = mkdtempSync(path.join(tmpdir(), 'fusedoc-e2e-'));
    const home = path.join(dir, 'home');
    mkdirSync(path.join(home, '.config'), { recursive: true });

    // PATH is narrowed to exclude the OpenSpec CLI and a stub npm makes the
    // global install fail instantly: these cases assert on template
    // distribution, not on OpenSpec provisioning, and reaching the network
    // would make them slow and flaky.
    const narrowPath = (process.env.PATH ?? '')
      .split(path.delimiter)
      .filter((p) => !existsSync(path.join(p, 'openspec')))
      .join(path.delimiter);
    const stubBin = path.join(dir, 'stub-bin');
    mkdirSync(stubBin, { recursive: true });
    writeFileSync(path.join(stubBin, 'npm'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });

    env = {
      ...process.env,
      HOME: home,
      XDG_CONFIG_HOME: path.join(home, '.config'),
      PATH: `${stubBin}${path.delimiter}${narrowPath}`,
      GIT_AUTHOR_NAME: 'FuseQA',
      GIT_AUTHOR_EMAIL: 'fuseqa@example.invalid',
      GIT_COMMITTER_NAME: 'FuseQA',
      GIT_COMMITTER_EMAIL: 'fuseqa@example.invalid',
    };
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const scaffold = (cwd: string, name: string) =>
    execFileSync(process.execPath, [DIST, name, '--yes'], { encoding: 'utf-8', cwd, env });

  it('installs the skill and all three reference files', () => {
    scaffold(dir, 'doc-a');
    const skillDir = path.join(dir, 'doc-a', '.claude', 'skills', 'fusedoc');

    expect(existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true);
    expect(readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8')).toContain('name: fusedoc');

    const refDir = path.join(skillDir, 'references');
    expect(existsSync(refDir)).toBe(true);
    expect(readdirSync(refDir).sort()).toEqual(EXPECTED_REFERENCES);
  });

  it('ships references whose every link resolves inside the target project', () => {
    scaffold(dir, 'doc-b');
    const skillDir = path.join(dir, 'doc-b', '.claude', 'skills', 'fusedoc');
    const body = readFileSync(path.join(skillDir, 'SKILL.md'), 'utf-8');

    const linked = [...body.matchAll(/references\/([a-z-]+\.md)/g)].map((m) => m[1]);
    expect(new Set(linked).size).toBeGreaterThanOrEqual(3);
    for (const name of new Set(linked)) {
      expect(existsSync(path.join(skillDir, 'references', name))).toBe(true);
    }
  });

  it('carries non-empty reference bodies, not placeholders', () => {
    scaffold(dir, 'doc-c');
    const refDir = path.join(dir, 'doc-c', '.claude', 'skills', 'fusedoc', 'references');

    // A copy step that produced empty files would satisfy every existence
    // assertion above. Size is the cheap discriminator.
    for (const name of EXPECTED_REFERENCES) {
      const body = readFileSync(path.join(refDir, name), 'utf-8');
      expect(body.length).toBeGreaterThan(500);
    }
  });

  it('emits CLAUDE.md with the documentation standard and no third checkpoint', () => {
    scaffold(dir, 'doc-d');
    const md = readFileSync(path.join(dir, 'doc-d', 'CLAUDE.md'), 'utf-8');

    expect(md).toContain('Documentation Standard: FuseDoc');
    expect(md).toContain('.claude/skills/fusedoc/SKILL.md');
    // The structural property the change exists to preserve: FuseDoc is a
    // standard, so it adds no gate to the apply exit sequence.
    const mandatory = md.match(/the AI MUST ask the user whether to enter \w+/g) ?? [];
    expect(mandatory.sort()).toEqual([
      'the AI MUST ask the user whether to enter FuseQA',
      'the AI MUST ask the user whether to enter FuseReview',
    ]);
  });

  it('emits markdown with no escaped backticks', () => {
    scaffold(dir, 'doc-e');
    const base = path.join(dir, 'doc-e');
    expect(readFileSync(path.join(base, 'CLAUDE.md'), 'utf-8')).not.toContain('\\`');
    expect(
      readFileSync(path.join(base, '.claude', 'skills', 'fusedoc', 'SKILL.md'), 'utf-8'),
    ).not.toContain('\\`');
  });

  it('preserves a user-authored skill file while still copying references', () => {
    const base = path.join(dir, 'doc-f');
    mkdirSync(path.join(base, '.claude', 'skills', 'fusedoc'), { recursive: true });
    const skill = path.join(base, '.claude', 'skills', 'fusedoc', 'SKILL.md');
    writeFileSync(skill, 'USER CONTENT');

    execFileSync(process.execPath, [DIST, '.', '--yes'], { encoding: 'utf-8', cwd: base, env });

    expect(readFileSync(skill, 'utf-8')).toBe('USER CONTENT');
    expect(readdirSync(path.join(base, '.claude', 'skills', 'fusedoc', 'references')).sort()).toEqual(
      EXPECTED_REFERENCES,
    );
  });

  it('runs through a symlinked bin shim, the path npm and npx use', () => {
    const base = path.join(dir, 'shim-host');
    const binDir = path.join(base, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    const shim = path.join(binDir, 'create-specfuse');
    symlinkSync(DIST, shim);

    execFileSync(process.execPath, [shim, 'doc-g', '--yes'], { encoding: 'utf-8', cwd: base, env });

    const skillDir = path.join(base, 'doc-g', '.claude', 'skills', 'fusedoc');
    expect(existsSync(path.join(skillDir, 'SKILL.md'))).toBe(true);
    expect(readdirSync(path.join(skillDir, 'references')).sort()).toEqual(EXPECTED_REFERENCES);
  });
});
