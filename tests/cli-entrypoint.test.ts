import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * npm and npx never invoke dist/index.js by its real path — they create a
 * symlink (node_modules/.bin/create-specfuse) and run that. An entrypoint
 * guard that compares import.meta.url against a raw argv[1] sees two
 * different paths through a symlink and silently declines to parse, so the
 * CLI exits 0 having done nothing. These tests invoke the built CLI the way
 * a real install does.
 */
describe('CLI entrypoint resolves through a symlinked bin shim', () => {
  const dist = path.resolve(import.meta.dirname, '..', 'dist', 'index.js');
  let dir: string;
  let shim: string;

  beforeAll(() => {
    if (!existsSync(dist)) throw new Error('run `npm run build` before this suite');
    dir = mkdtempSync(path.join(tmpdir(), 'specfuse-bin-'));
    const binDir = path.join(dir, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    shim = path.join(binDir, 'create-specfuse');
    symlinkSync(dist, shim);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const run = (bin: string, args: string[]) =>
    execFileSync(process.execPath, [bin, ...args], { encoding: 'utf-8', cwd: dir });

  it('prints the version when run via its real path', () => {
    expect(run(dist, ['--version']).trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('prints the version when run via a symlinked shim', () => {
    expect(run(shim, ['--version']).trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('prints help when run via a symlinked shim', () => {
    expect(run(shim, ['--help'])).toContain('create-specfuse');
  });
});
