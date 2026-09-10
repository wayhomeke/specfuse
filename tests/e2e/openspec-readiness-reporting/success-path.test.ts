import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync, execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * FuseQA case — authored per .claude/skills/fuseqa/templates contracts.
 *
 *   artifact:   dist/index.js (the build output), run as a real process
 *   entry:      subprocess with argv, with the real OpenSpec CLI reachable on PATH
 *   isolation:  one temp dir per file, a fresh subdirectory per case, plus a
 *               scratch HOME/XDG_CONFIG_HOME so the real `openspec init` and the
 *               trust-list write land inside it and never touch the developer's
 *               machine; whole tree removed on teardown
 *   observable: exit code, stdout, and the files `openspec init` generates
 *   traces-to:  spec openspec-readiness-reporting / Scenarios "Line is verbatim
 *               when OpenSpec is ready" and "No notice on the success path"
 *
 * Why the unit suite is not enough: tests/scaffolder.test.ts mocks
 * utils/tools.js, so `initOpenspec` returning true is an assumption, not an
 * observation. Only running the real CLI proves that a genuinely successful
 * init produces the `.claude/commands/opsx/` directory whose absence was the
 * whole defect — a mocked "ready" cannot tell a working init from a no-op.
 *
 * Timeout: a real `openspec init` takes ~5.7s, above vitest's 5s default. That
 * cost is inherent to exercising the success path as a user does, not case debt:
 * the work being paid for is the very thing under observation.
 *
 * Skipped when the OpenSpec CLI is unavailable: that is "cannot execute", not
 * "failed", and an unexecutable case must never turn the regression gate red.
 */
const DIST = path.resolve(import.meta.dirname, '..', '..', '..', 'dist', 'index.js');
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
const stripAnsi = (v: string) => v.replace(ANSI, '');

const hasOpenspec = (() => {
  try {
    execFileSync('openspec', ['--version'], { encoding: 'utf-8', stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
})();

if (!hasOpenspec) {
  console.log('[fuseqa] skipping success-path E2E: OpenSpec CLI not found on PATH');
}

describe.skipIf(!hasOpenspec)('scaffolding reports nothing when OpenSpec is ready', () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error('run `npm run build` before this suite');
    dir = mkdtempSync(path.join(tmpdir(), 'fq-ready-'));
    const home = path.join(dir, 'home');
    mkdirSync(path.join(home, '.config'), { recursive: true });
    env = {
      ...process.env,
      HOME: home,
      XDG_CONFIG_HOME: path.join(home, '.config'),
      GIT_AUTHOR_NAME: 'FuseQA',
      GIT_AUTHOR_EMAIL: 'fuseqa@example.invalid',
      GIT_COMMITTER_NAME: 'FuseQA',
      GIT_COMMITTER_EMAIL: 'fuseqa@example.invalid',
    };
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('prints the opsx line verbatim, emits no notice, and really generates the commands', () => {
    const r = spawnSync(process.execPath, [DIST, 'ready-app', '--yes'], {
      encoding: 'utf-8',
      cwd: dir,
      env,
    });
    const out = stripAnsi(r.stdout ?? '');

    expect(r.status).toBe(0);
    expect(out).toContain('/opsx:propose   # start your first change');
    expect(out).not.toMatch(/Note: OpenSpec/i);
    expect(out).not.toContain('unavailable yet');

    // The condition the notice would have reported: absent here, so its silence
    // is correct rather than merely coincidental.
    const opsx = path.join(dir, 'ready-app', '.claude', 'commands', 'opsx');
    expect(existsSync(opsx)).toBe(true);
    expect(readdirSync(opsx).length).toBeGreaterThan(0);
  }, 60_000);

  it('confines the real openspec init and the trust write to the scratch HOME', () => {
    spawnSync(process.execPath, [DIST, 'confined-app', '--yes'], {
      encoding: 'utf-8',
      cwd: dir,
      env,
    });

    // The scaffold writes a trust entry; proving it landed here is what shows the
    // isolation held while a real openspec init ran.
    const claudeJson = path.join(dir, 'home', '.claude.json');
    expect(existsSync(claudeJson)).toBe(true);
  }, 60_000);
});
