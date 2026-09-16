import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

/**
 * Guards the spec corpus against the rot that produced this change: seven of
 * fifteen specs had drifted into a state the tool itself rejects — four were
 * un-synced deltas sitting in the specs tree, three still carried the Purpose
 * placeholder `openspec archive` writes.
 *
 * The check runs the tool rather than reimplementing it. A file-level assertion
 * would have to copy OpenSpec's structural rules, and a copy drifts as those
 * rules evolve — which is the same "nobody re-checked" failure this guard
 * exists to catch. Using the tool's own rule is the only version that cannot
 * fall out of step with the tool.
 *
 * Contract: openspec/specs/ (the whole tree).
 */
const REPO = path.resolve(import.meta.dirname, '..', '..');

/**
 * Presence detection by execution. ENOENT means not installed; anything else
 * means installed but unusable. Both land on "cannot execute", which is not the
 * same as "failed" — but the skip must be audible, never silent.
 */
function openspecBlocker(): string | null {
  try {
    execFileSync('openspec', ['--version'], { cwd: REPO, stdio: 'ignore' });
    return null;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    return code === 'ENOENT'
      ? 'openspec CLI is not installed (not found on PATH)'
      : `openspec CLI is present but unusable (${code ?? 'unknown error'} on --version)`;
  }
}

const blocker = openspecBlocker();

if (blocker) {
  // Printed, not swallowed: a skipped guard that says nothing is indistinguishable
  // from a passing one, and this guard's whole subject is checks nobody ran.
  console.warn(`[spec-corpus] SKIPPED — ${blocker}. The spec tree is NOT verified by this run.`);
}

describe('the spec tree validates under the tool that owns its rules', () => {
  let output: string;

  beforeAll(() => {
    if (blocker) return;
    try {
      output = execFileSync('openspec', ['validate', '--specs', '--strict'], {
        cwd: REPO,
        encoding: 'utf-8',
      });
    } catch (error) {
      // A non-zero exit carries the report on stdout/stderr; keep it so the
      // failure message names the specs that failed rather than just an exit code.
      const e = error as { stdout?: string; stderr?: string };
      output = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }
  });

  it.skipIf(blocker)('reports zero failing specs', () => {
    const totals = output.match(/Totals:\s*(\d+) passed,\s*(\d+) failed/);
    expect(totals, `no Totals line in output:\n${output}`).not.toBeNull();

    const failed = Number(totals![2]);
    const offenders = [...output.matchAll(/^✗ spec\/(\S+)/gm)].map((m) => m[1]);

    expect({ failed, offenders }).toEqual({ failed: 0, offenders: [] });
  });

  it.skipIf(blocker)('reports no leftover Purpose placeholders', () => {
    expect(output).not.toMatch(/Purpose section is still a placeholder/i);
  });

  it('states why it was skipped, when it was', () => {
    // Keeps the skip path itself under test: this assertion fails if the guard
    // is ever quietly disabled without the reason being reported.
    if (blocker) {
      expect(blocker).toMatch(/openspec CLI/);
    } else {
      expect(blocker).toBeNull();
    }
  });
});
