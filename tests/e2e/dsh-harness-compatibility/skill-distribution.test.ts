import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

/**
 * FuseQA case — authored per .claude/skills/fuseqa/templates contracts.
 *
 *   artifact:   dist/index.js (the build output), invoked through a symlinked
 *               bin shim like an npm-installed package
 *   entry:      real subprocess with argv
 *   isolation:  project-local scratch directory, scratch HOME/XDG_CONFIG_HOME,
 *               OpenSpec off PATH, stub npm that fails instantly
 *   observable: the files the scaffolded project receives and the printed listing
 *   traces-to:  spec dsh-harness-compatibility / "The scaffolder installs
 *               dsh-discoverable skills under `.agents/skills`", "Entry points
 *               are dsh-invocable skills that are hidden from the model catalog"
 *
 * Why this cannot be a unit test: tests/scaffolder.test.ts imports scaffold()
 * and mocks utils/tools.js, so it never observes whether the built artifact
 * resolves its template directories. The dsh root and the entry-skill
 * frontmatter exist only after a real scaffold run.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const DIST = path.join(ROOT, 'dist', 'index.js');
const SHARED = ['design-md', 'fusedoc', 'fusereview', 'fuseqa'] as const;

interface SkillFrontmatter {
  name?: unknown;
  description?: unknown;
  'disable-model-invocation'?: unknown;
  'user-invocable'?: unknown;
}

function frontmatter(markdown: string): SkillFrontmatter {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  if (!match) throw new Error('missing YAML frontmatter');
  return parseYaml(match[1]) as SkillFrontmatter;
}

describe('a scaffolded project exposes the pipeline to dsh', () => {
  let scratch: string;
  let shim: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error('run `npm run build` before this suite');
    scratch = path.join(ROOT, 'tmp', `e2e-dsh-${process.pid}-${Date.now()}`);
    mkdirSync(scratch, { recursive: true });

    const home = path.join(scratch, 'home');
    mkdirSync(path.join(home, '.config'), { recursive: true });

    const binDir = path.join(scratch, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    shim = path.join(binDir, 'create-specfuse');
    symlinkSync(DIST, shim);

    // OpenSpec off PATH and a stub npm that fails instantly: these cases assert
    // on dsh distribution, not on OpenSpec provisioning. The scaffold takes its
    // documented "not installed" branch without touching the network.
    const narrowPath = (process.env.PATH ?? '')
      .split(path.delimiter)
      .filter((p) => !existsSync(path.join(p, 'openspec')))
      .join(path.delimiter);
    const stubBin = path.join(scratch, 'stub-bin');
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

  afterAll(() => rmSync(scratch, { recursive: true, force: true }));

  const scaffold = (name: string): string => {
    execFileSync(process.execPath, [shim, name, '--yes'], {
      encoding: 'utf-8',
      cwd: scratch,
      env,
    });
    return path.join(scratch, name);
  };

  it('installs the shared skills under both roots with identical bodies', () => {
    const project = scaffold('dist-a');
    for (const skill of SHARED) {
      const claude = path.join(project, '.claude', 'skills', skill, 'SKILL.md');
      const agents = path.join(project, '.agents', 'skills', skill, 'SKILL.md');
      expect(existsSync(claude), `${claude} is missing`).toBe(true);
      expect(existsSync(agents), `${agents} is missing`).toBe(true);
      expect(readFileSync(agents, 'utf-8'), `${skill} drifted`).toBe(
        readFileSync(claude, 'utf-8'),
      );
    }
  });

  it('installs the entry skills as user-invocable and model-disabled', () => {
    const project = scaffold('dist-b');
    const cases = [
      { name: 'specfuse', usage: 'SPECFUSE_USAGE: /specfuse <requirement description>' },
      {
        name: 'specfuse-full',
        usage: 'SPECFUSE_FULL_USAGE: /specfuse-full <requirement description>',
      },
    ];

    for (const { name, usage } of cases) {
      const body = readFileSync(
        path.join(project, '.agents', 'skills', name, 'SKILL.md'),
        'utf-8',
      );
      const data = frontmatter(body);
      expect(data.name).toBe(name);
      expect(data['disable-model-invocation']).toBe(true);
      expect(data['user-invocable']).toBe(true);
      expect(body).toContain(usage);
      expect(data['argument-hint']).toBeUndefined();
    }
  });

  it('copies the template and reference assets to the dsh root', () => {
    const project = scaffold('dist-c');
    expect(
      readdirSync(path.join(project, '.agents', 'skills', 'fusedoc', 'references')).sort(),
    ).toEqual(['examples.md', 'probes.md', 'recall-batteries.md']);
    expect(
      readdirSync(path.join(project, '.agents', 'skills', 'design-md', 'templates')).filter(
        (file) => file.endsWith('.yaml'),
      ).length,
    ).toBe(17);
    expect(
      readdirSync(path.join(project, '.agents', 'skills', 'fuseqa', 'templates')).sort(),
    ).toEqual(['_case-schema.yaml', 'derivation-checklist.md', 'entry-recipes.md', 'ledger.md']);
  });

  it('preserves a user-authored dsh skill while writing the others', () => {
    const project = path.join(scratch, 'existing');
    const custom = path.join(project, '.agents', 'skills', 'fuseqa', 'SKILL.md');
    mkdirSync(path.dirname(custom), { recursive: true });
    writeFileSync(custom, 'custom dsh skill');

    execFileSync(process.execPath, [shim, '.', '--yes'], {
      encoding: 'utf-8',
      cwd: project,
      env,
    });

    expect(readFileSync(custom, 'utf-8')).toBe('custom dsh skill');
    expect(
      existsSync(path.join(project, '.agents', 'skills', 'specfuse', 'SKILL.md')),
    ).toBe(true);
  });

  it('names the dsh root and entry points in the printed listing', () => {
    const out = execFileSync(process.execPath, [shim, 'dist-d', '--yes'], {
      encoding: 'utf-8',
      cwd: scratch,
      env,
    });
    expect(out).toContain('.agents/skills/');
    expect(out).toContain('.agents/skills/specfuse/');
    expect(out).toContain('.agents/skills/specfuse-full/');
  });
});
