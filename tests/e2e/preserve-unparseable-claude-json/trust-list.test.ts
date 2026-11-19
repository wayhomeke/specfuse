import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * FuseQA case — authored per .claude/skills/fuseqa/templates contracts.
 *
 *   artifact:   dist/index.js (the build output), invoked through a symlinked
 *               bin shim like an npm-installed package
 *   entry:      a real subprocess with a scratch HOME
 *   isolation:  project-local scratch directory, scratch HOME/XDG_CONFIG_HOME,
 *               OpenSpec off PATH, stub npm that fails instantly
 *   observable: the `~/.claude.json` bytes and the CLI's stderr
 *   traces-to:  spec trust-list-safety / Scenarios "Invalid JSON is preserved",
 *               "The warning does not expose contents", "Scaffolding completes
 *               with the warning"
 *
 * Why this cannot be a unit test: the unit suite calls scaffold() in-process
 * and spies console.warn. Only the built CLI shows the symlinked entry path,
 * the real stderr stream, and the exit status together.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const DIST = path.join(ROOT, 'dist', 'index.js');

describe('the built CLI preserves an unparseable ~/.claude.json', () => {
  let scratch: string;
  let project: string;
  let home: string;
  let shim: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error('run `npm run build` before this suite');

    scratch = path.join(ROOT, 'tmp', `e2e-trust-${process.pid}-${Date.now()}`);
    project = path.join(scratch, 'project');
    home = path.join(scratch, 'home');
    mkdirSync(project, { recursive: true });
    mkdirSync(path.join(home, '.config'), { recursive: true });

    const binDir = path.join(scratch, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    shim = path.join(binDir, 'create-specfuse');
    symlinkSync(DIST, shim);

    // OpenSpec off PATH and a stub npm that fails instantly: this case asserts
    // on the trust write, not on OpenSpec provisioning.
    const narrowPath = (process.env.PATH ?? '')
      .split(path.delimiter)
      .filter((entry) => !existsSync(path.join(entry, 'openspec')))
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

  afterAll(() => {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  });

  it('leaves the file unchanged, warns without contents, and exits zero', () => {
    const malformed = '{"userSetting":"keep-me",';
    writeFileSync(path.join(home, '.claude.json'), malformed);

    const result = spawnSync(process.execPath, [shim, '.', '--yes'], {
      cwd: project,
      env,
      encoding: 'utf-8',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(path.join(home, '.claude.json'), 'utf-8')).toBe(malformed);
    expect(result.stderr).toContain('Skipping Claude Code trust registration');
    expect(result.stderr).toContain('.claude.json');
    expect(result.stderr).toContain('left unchanged');
    expect(result.stderr).not.toContain('keep-me');
  }, 60_000);
});
