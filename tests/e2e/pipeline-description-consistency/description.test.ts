import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, symlinkSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * FuseQA case — authored per .claude/skills/fuseqa/templates contracts.
 *
 *   artifact:   dist/index.js (the build output), invoked as a real process
 *   entry:      subprocess with argv, and a symlinked bin shim (the npm/npx path)
 *   isolation:  one temp directory, a fresh subdirectory per case, plus a scratch
 *               HOME/XDG_CONFIG_HOME; whole tree removed on teardown
 *   observable: help text on stdout, and the files written into the scaffolded
 *               project — the two things a user actually receives
 *   traces-to:  spec pipeline-description-consistency / "Shipped pipeline
 *               descriptions name every beat" and "carry no positional ordinal"
 *
 * Why this cannot be a unit test: the unit guards call composeCLAUDEmd() and
 * compose*Skill() and read their return values, so they see the template's
 * output. They cannot see whether a scaffolded project receives it — a copy
 * step, a build-script regression, or a stale installed file would leave every
 * one of them green. This drives the CLI and reads what landed on disk.
 */
const DIST = path.resolve(import.meta.dirname, '..', '..', '..', 'dist', 'index.js');
const BEATS = ['Think', 'Do', 'FuseReview', 'FuseQA', 'Verify'] as const;
const ENUMERATION = /Think reviews direction[^.]*\./g;

describe('a scaffolded project receives a complete pipeline description', () => {
  let dir: string;
  let shim: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error('run `npm run build` before this suite');
    dir = mkdtempSync(path.join(tmpdir(), 'pipeline-desc-e2e-'));
    const home = path.join(dir, 'home');
    mkdirSync(path.join(home, '.config'), { recursive: true });

    const binDir = path.join(dir, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    shim = path.join(binDir, 'create-specfuse');
    symlinkSync(DIST, shim);

    // OpenSpec off PATH and a stub npm that fails instantly: this case asserts
    // on what the scaffold writes, not on OpenSpec provisioning, and reaching
    // the network would make it slow and flaky.
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

  const run = (args: string[]) =>
    execFileSync(process.execPath, [shim, ...args], { encoding: 'utf-8', cwd: dir, env });

  const scaffold = (name: string) => {
    run([name, '--yes']);
    return path.join(dir, name);
  };

  const enumerationsIn = (file: string) => readFileSync(file, 'utf-8').match(ENUMERATION) ?? [];

  it('help text names every beat, through the shim a package manager installs', () => {
    const help = run(['--help']);
    const missing = BEATS.filter((b) => !new RegExp(`\\b${b}\\b`).test(help));
    expect(missing).toEqual([]);
  });

  it('the scaffolded CLAUDE.md enumerates every beat in both checkpoints', () => {
    const base = scaffold('desc-a');
    const md = readFileSync(path.join(base, 'CLAUDE.md'), 'utf-8');

    const enumerations = md.match(ENUMERATION) ?? [];
    expect(enumerations.length).toBeGreaterThanOrEqual(2);

    for (const sentence of enumerations) {
      const missing = BEATS.filter((b) => !new RegExp(`\\b${b}\\b`).test(sentence));
      expect(missing, `dropped from: ${sentence.slice(0, 70)}`).toEqual([]);
    }
  });

  it('the scaffolded skills enumerate every beat', () => {
    const base = scaffold('desc-b');

    for (const skill of ['fusereview', 'fuseqa']) {
      const file = path.join(base, '.claude', 'skills', skill, 'SKILL.md');
      expect(existsSync(file), `${skill} skill missing`).toBe(true);

      const enumerations = enumerationsIn(file);
      expect(enumerations.length, `${skill} has no enumeration`).toBeGreaterThan(0);

      for (const sentence of enumerations) {
        const missing = BEATS.filter((b) => !new RegExp(`\\b${b}\\b`).test(sentence));
        expect(missing, `${skill}: dropped from ${sentence.slice(0, 70)}`).toEqual([]);
      }
    }
  });

  it('no shipped description labels a beat by its position', () => {
    const base = scaffold('desc-c');
    const files = [
      path.join(base, 'CLAUDE.md'),
      path.join(base, '.claude', 'skills', 'fusereview', 'SKILL.md'),
      path.join(base, '.claude', 'skills', 'fuseqa', 'SKILL.md'),
    ];

    const ordinal = /\b(first|second|third|fourth|fifth|sixth|[1-6](?:st|nd|rd|th))\s+(pipeline\s+)?beat\b/i;
    for (const file of files) {
      const hit = readFileSync(file, 'utf-8').match(ordinal);
      expect(hit?.[0] ?? null, `${path.basename(path.dirname(file))}/${path.basename(file)}`).toBe(null);
    }
  });

  it('does not list FuseDoc among the beats', () => {
    // FuseDoc is a cross-pipeline standard. Sweeping it into the enumeration
    // would advertise a six-beat pipeline — the same defect, reversed.
    const base = scaffold('desc-d');
    const md = readFileSync(path.join(base, 'CLAUDE.md'), 'utf-8');

    for (const sentence of md.match(ENUMERATION) ?? []) {
      expect(sentence).not.toMatch(/\bFuseDoc\b/);
    }
  });
});
