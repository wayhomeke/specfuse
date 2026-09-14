import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync, readdirSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs';
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
 *   traces-to:  spec fuseqa-skill-generation / "Scaffolder distributes the skill
 *               without overwriting" + "Templates ship in the build output"
 *
 * Isolation covers ambient state, not just the target directory. `--yes` sets
 * initOpenspec, which makes the CLI install a global npm package, rewrite
 * ~/.config/openspec/config.json and append to ~/.claude.json. A scratch HOME
 * and XDG_CONFIG_HOME confine all of it; without them these cases mutate the
 * developer's machine and cost ~4.2s each instead of ~0.3s.
 *
 * Why this cannot be a unit test: tests/scaffolder.test.ts imports scaffold()
 * and mocks utils/tools.js, so it exercises source, in-process, with the
 * OpenSpec calls stubbed. It cannot observe whether the BUILT artifact resolves
 * its own template directory — dist/fuseqa/templates is produced by the build
 * script, not by tsc, so a build-script regression is invisible to it.
 */
const DIST = path.resolve(import.meta.dirname, '..', '..', '..', 'dist', 'index.js');
const ANSI = new RegExp(String.fromCharCode(27) + '\\[[0-9;]*m', 'g');
const EXPECTED_TEMPLATES = [
  '_case-schema.yaml',
  'derivation-checklist.md',
  'entry-recipes.md',
  'ledger.md',
];

describe('scaffolded project receives the FuseQA skill from the built artifact', () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error('run `npm run build` before this suite');
    dir = mkdtempSync(path.join(tmpdir(), 'fuseqa-e2e-'));
    const home = path.join(dir, 'home');
    mkdirSync(path.join(home, '.config'), { recursive: true });
    // A scratch HOME has no git identity; real user machines do. Supply one via
    // env so `git commit` inside the scaffold behaves as it does for a user.
    //
    // PATH is narrowed to exclude the OpenSpec CLI: `--yes` implies
    // initOpenspec, and letting it run costs ~5s per case rebuilding 11 skill
    // directories — work these cases do not assert on. With openspec absent the
    // scaffold takes its documented "not installed" branch (a warning) and the
    // subject under test, template distribution, is unaffected. npm install -g
    // is likewise kept out of reach, which is the point of the guard below.
    const narrowPath = (process.env.PATH ?? '')
      .split(path.delimiter)
      .filter((p) => !existsSync(path.join(p, 'openspec')))
      .join(path.delimiter);

    // With openspec absent the scaffold tries `npm install -g` next. A stub npm
    // that exits non-zero makes that attempt fail instantly instead of reaching
    // the network — and proves no case can install a global package.
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

  // Guard, not a happy-path case: an E2E suite that edits the developer's
  // machine is a defect regardless of whether its assertions pass. The scaffold
  // writes ~/.claude.json (trust list) and, with OpenSpec reachable, rewrites
  // ~/.config/openspec/config.json and installs a global npm package. Asserting
  // those land inside the scratch HOME is what keeps this suite from mutating
  // the developer's machine.
  it('confines home-directory writes to the scratch HOME', () => {
    scaffold(dir, 'app-guard');

    // Proof the scaffold really did try to write a home-dir file, so a broken
    // override surfaces here instead of passing vacuously.
    expect(existsSync(path.join(dir, 'home', '.claude.json'))).toBe(true);

    const trusted = JSON.parse(
      readFileSync(path.join(dir, 'home', '.claude.json'), 'utf-8'),
    ).projects as Record<string, unknown>;
    const outside = Object.keys(trusted).filter((p) => !p.startsWith(dir));
    expect(outside).toEqual([]);
  });

  it('installs the skill and all four templates', () => {
    const out = scaffold(dir, 'app-a');
    expect(out).toContain('app-a');

    const skill = path.join(dir, 'app-a', '.claude', 'skills', 'fuseqa', 'SKILL.md');
    expect(existsSync(skill)).toBe(true);
    expect(readFileSync(skill, 'utf-8')).toContain('name: fuseqa');

    const tdir = path.join(dir, 'app-a', '.claude', 'skills', 'fuseqa', 'templates');
    expect(readdirSync(tdir).sort()).toEqual(EXPECTED_TEMPLATES);
  });

  it('emits CLAUDE.md with FuseQA ordered between FuseReview and Verify', () => {
    scaffold(dir, 'app-b');
    const md = readFileSync(path.join(dir, 'app-b', 'CLAUDE.md'), 'utf-8');

    const fr = md.indexOf('Phase 2.5: FuseReview');
    const fq = md.indexOf('Phase 2.6: FuseQA');
    const vp = md.indexOf('Phase 3: Verify');
    expect(fr).toBeGreaterThan(-1);
    expect(fq).toBeGreaterThan(fr);
    expect(vp).toBeGreaterThan(fq);
  });

  it('emits markdown with no escaped backticks in either file', () => {
    scaffold(dir, 'app-c');
    const base = path.join(dir, 'app-c');
    const md = readFileSync(path.join(base, 'CLAUDE.md'), 'utf-8');
    const skill = readFileSync(
      path.join(base, '.claude', 'skills', 'fuseqa', 'SKILL.md'),
      'utf-8',
    );
    // Template-literal over-escaping produced `\`entry\`` instead of `entry`
    // in an earlier build; it is invisible to any assertion that only checks
    // for substring presence.
    expect(md).not.toContain('\\`');
    expect(skill).not.toContain('\\`');
  });

  it('preserves a user-authored skill file while still copying templates', () => {
    const base = path.join(dir, 'app-d');
    mkdirSync(path.join(base, '.claude', 'skills', 'fuseqa'), { recursive: true });
    const skill = path.join(base, '.claude', 'skills', 'fuseqa', 'SKILL.md');
    writeFileSync(skill, 'USER CONTENT');

    execFileSync(process.execPath, [DIST, '.', '--yes'], { encoding: 'utf-8', cwd: base, env });

    expect(readFileSync(skill, 'utf-8')).toBe('USER CONTENT');
    const tdir = path.join(base, '.claude', 'skills', 'fuseqa', 'templates');
    expect(readdirSync(tdir).sort()).toEqual(EXPECTED_TEMPLATES);
  });

  it('runs through a symlinked bin shim, the path npm and npx use', () => {
    const base = path.join(dir, 'shim-host');
    const binDir = path.join(base, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    const shim = path.join(binDir, 'create-specfuse');
    symlinkSync(DIST, shim);

    execFileSync(process.execPath, [shim, 'app-e', '--yes'], { encoding: 'utf-8', cwd: base, env });

    expect(
      existsSync(path.join(base, 'app-e', '.claude', 'skills', 'fuseqa', 'SKILL.md')),
    ).toBe(true);
  });

  // spec: openspec-readiness-reporting / "Built CLI exits zero on the failure path"
  // OpenSpec is unreachable here (narrowed PATH, stubbed npm), so this run takes
  // the install-failed path. Exit code 0 is the change's central non-goal:
  // reporting the failure must not turn scaffolding into a failure.
  it('exits zero even though OpenSpec could not be installed', () => {
    const r = spawnSync(process.execPath, [DIST, 'app-exit', '--yes'], {
      encoding: 'utf-8',
      cwd: dir,
      env,
    });

    expect(r.status).toBe(0);
    // The control character in the pattern is the point: it is the ANSI
    // escape chalk emits for colour, which these comparisons must strip.
    // eslint-disable-next-line no-control-regex
    const clean = (r.stdout ?? '').replace(/\u001b\[[0-9;]*m/g, '');
    expect(clean).toMatch(/Note: OpenSpec/i);
    expect(clean).not.toContain('# start your first change');
  });

  // spec: openspec-readiness-reporting / "Superpowers notice is unaffected"
  // Only reachable through a subprocess: hasSuperpowersPlugin() reads
  // $HOME/.claude/plugins, and the scratch HOME here has no plugins, so the
  // notice is live. In-process unit tests read the developer's real HOME, where
  // the plugin IS installed and the block never runs.
  it('prints the Superpowers notice alongside the OpenSpec one, unchanged', () => {
    const r = spawnSync(process.execPath, [DIST, 'app-notices', '--yes'], {
      encoding: 'utf-8',
      cwd: dir,
      env,
    });
    const clean = (r.stdout ?? '').replace(ANSI, '');

    expect(clean).toContain('Note: Superpowers plugin not detected.');
    expect(clean).toContain('/plugins add obra/superpowers');
    // Both notices coexist: reporting OpenSpec did not displace the other.
    expect(clean).toMatch(/Note: OpenSpec/i);
    expect(clean.indexOf('Note: OpenSpec')).toBeLessThan(
      clean.indexOf('Note: Superpowers'),
    );
  });
});
