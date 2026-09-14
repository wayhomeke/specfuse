import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync, rmSync, existsSync, readFileSync, mkdirSync, writeFileSync, symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

/**
 * FuseQA case — authored per src/fuseqa/templates contracts.
 *
 *   artifact:   dist/index.js (the build output), invoked as a real process
 *   entry:      subprocess with argv, through a symlinked bin shim (the npm/npx
 *               path). The product under test is a generated file, so the
 *               observable is the file the CLI writes — the CLI recipe sanctions
 *               "files written", it is not the data-artifact recipe's forbidden
 *               "assert on the artifact's own text". The deeper consumer of that
 *               file is a coding agent, which cannot be driven here; that limit
 *               is why the derivation is recorded rather than silently assumed.
 *   isolation:  temp tree per file, fresh subdirectory per case, scratch
 *               HOME/XDG_CONFIG_HOME, OpenSpec off PATH, stub npm that fails
 *   observable: the CLAUDE.md written into the target project, process exit status
 *   traces-to:  spec model-switch-checkpoint — Scenarios "At least two options
 *               are named", "Switch and Other share one behavior", "The 2–4
 *               bound is asserted in the rendered text"; plus the proposal's
 *               Impact statement that already-initialized projects update by
 *               re-running the scaffolder (the merge path).
 *
 * Why this cannot be a unit test: tests/templates/claude-md.test.ts asserts
 * `renderApplyPhase()` from src/. It cannot observe what tsc and the build
 * script's template-copy loop actually ship, nor whether `mergeFusionIntoCLAUDEmd`
 * lets the fixed section reach a project that already has a CLAUDE.md. Both
 * gaps are build/merge-shaped — the same class as the v0.9.0 escaped-backtick
 * defect that passed 272 unit tests.
 *
 * Isolation is not optional here: `--yes` implies initOpenspec, which makes the
 * CLI install a global package, rewrite ~/.config/openspec/config.json and
 * append ~/.claude.json. See tests/e2e/LEDGER.md.
 */
const DIST = path.resolve(import.meta.dirname, '..', '..', '..', 'dist', 'index.js');
const CHECKPOINT_START = '0. **Model Switch Checkpoint';
const APPLY_STEP_END = '1. **MUST activate Superpowers';

/** The checkpoint section as it actually shipped, or '' if the marker is absent. */
function shippedCheckpoint(projectDir: string): string {
  const md = readFileSync(path.join(projectDir, 'CLAUDE.md'), 'utf-8');
  const start = md.indexOf(CHECKPOINT_START);
  if (start < 0) return '';
  const end = md.indexOf(APPLY_STEP_END, start);
  return end < 0 ? md.slice(start) : md.slice(start, end);
}

/** Option labels declared by the section, anchored on `选项 N: "label"`. */
function optionLabels(section: string): string[] {
  return [...section.matchAll(/选项 \d+:\s*"([^"]+)"/g)].map((m) => m[1]);
}

describe('the model switch checkpoint survives to the shipped CLAUDE.md', () => {
  let dir: string;
  let env: NodeJS.ProcessEnv;
  let shim: string;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error('run `npm run build` before this suite');
    dir = mkdtempSync(path.join(tmpdir(), 'checkpoint-e2e-'));
    const home = path.join(dir, 'home');
    mkdirSync(path.join(home, '.config'), { recursive: true });

    const narrowPath = (process.env.PATH ?? '')
      .split(path.delimiter)
      .filter((p) => !existsSync(path.join(p, 'openspec')))
      .join(path.delimiter);

    const stubBin = path.join(dir, 'stub-bin');
    mkdirSync(stubBin, { recursive: true });
    writeFileSync(path.join(stubBin, 'npm'), '#!/bin/sh\nexit 1\n', { mode: 0o755 });

    // The shim is how npm and npx actually invoke a bin — a path with its own
    // failure mode that invoking DIST directly would miss.
    const binDir = path.join(dir, 'node_modules', '.bin');
    mkdirSync(binDir, { recursive: true });
    shim = path.join(binDir, 'create-specfuse');
    symlinkSync(DIST, shim);

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

  it('ships a two-option checkpoint with merged switch/Other branches, via the bin shim', () => {
    const cwd = path.join(dir, 'fresh');
    mkdirSync(cwd, { recursive: true });
    execFileSync(process.execPath, [shim, 'app', '--yes'], { encoding: 'utf-8', cwd, env });

    const section = shippedCheckpoint(path.join(cwd, 'app'));
    expect(section).not.toBe('');

    const labels = optionLabels(section);
    // The lower bound is the tool's own `options` minItems — the defect this
    // change fixes was a one-element payload.
    expect(labels.length).toBeGreaterThanOrEqual(2);
    expect(labels).toContain('继续使用当前模型');
    expect(labels).toContain('切换模型');

    // The declared bound, which the unit suite cannot see reaching the artifact.
    expect(section).toMatch(/MUST 提供 2–4 项/);

    // Branch merging: the switch option and the Other field must share one
    // continuation, not carry two divergent descriptions.
    expect(section).toMatch(/如果用户选择 "切换模型" 或通过 Other 输入了模型名称/);
  });

  it('replaces an already-initialized project\'s stale checkpoint and preserves surrounding text', () => {
    // Brownfield is a first-class documented path (`npm create specfuse@latest .`).
    // A project initialized before the fix carries the one-option block; the
    // merge must let the corrected section through. No other case covers merge.
    const cwd = path.join(dir, 'brownfield');
    mkdirSync(cwd, { recursive: true });
    const userPreamble = '# My project rules\n\nDo not touch the frobnicator.\n';
    const userEpilogue = '\n## My own trailing section\n\nKeep me.\n';
    const staleBlock = [
      '<!-- FUSION:START -->',
      '### Phase 2: Apply / Implement',
      '',
      '0. **Model Switch Checkpoint (模型切换节拍)**',
      '   - 选项设置：',
      '     - 选项 1: "继续使用当前模型"（描述：不切换，直接开始实施）',
      '<!-- FUSION:END -->',
    ].join('\n');
    writeFileSync(
      path.join(cwd, 'CLAUDE.md'),
      `${userPreamble}\n---\n\n${staleBlock}${userEpilogue}`,
    );

    execFileSync(process.execPath, [DIST, '.', '--yes'], { encoding: 'utf-8', cwd, env });

    const md = readFileSync(path.join(cwd, 'CLAUDE.md'), 'utf-8');
    const labels = optionLabels(shippedCheckpoint(cwd));
    expect(labels).toContain('继续使用当前模型');
    expect(labels).toContain('切换模型');

    // Merge semantics: everything outside the markers survives untouched.
    expect(md).toContain('Do not touch the frobnicator.');
    expect(md).toContain('Keep me.');
  });

  it('is idempotent on repeat: a second run does not duplicate or regress the section', () => {
    // "Run the same command twice" is the checklist's most-skipped case, and the
    // merge slices by marker index — a second pass is where duplication shows up.
    const cwd = path.join(dir, 'repeat');
    mkdirSync(cwd, { recursive: true });
    execFileSync(process.execPath, [shim, 'app', '--yes'], { encoding: 'utf-8', cwd, env });
    const target = path.join(cwd, 'app');

    execFileSync(process.execPath, [DIST, '.', '--yes'], { encoding: 'utf-8', cwd: target, env });

    const md = readFileSync(path.join(target, 'CLAUDE.md'), 'utf-8');
    expect(md.split(CHECKPOINT_START).length - 1).toBe(1);

    const labels = optionLabels(shippedCheckpoint(target));
    expect(labels.length).toBeGreaterThanOrEqual(2);
    expect(labels).toContain('切换模型');
  });
});
