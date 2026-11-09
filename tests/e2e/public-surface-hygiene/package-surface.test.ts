import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { scanText } from '../../public-surface-hygiene.js';

/**
 * FuseQA case — authored per .claude/skills/fuseqa/templates contracts.
 *
 *   artifact:   the npm package file list and the files it ships
 *   entry:      `npm pack --dry-run --json`, the package manager's real path
 *   isolation:  read-only pack dry run in the repository
 *   observable: the shipped file list and the shipped README/docs contents
 *   traces-to:  spec public-surface-hygiene / Scenarios "Scanned surfaces" and
 *               "No credential values are committed"
 *
 * Why this cannot be a unit test: the repository scan reads files from disk,
 * but only the package manager applies the `files` allowlist. A missing
 * `docs/dsh.md` or a stale README in the tarball is invisible to a repo scan.
 */
const REPO = path.resolve(import.meta.dirname, '..', '..', '..');

describe('the shipped npm package carries clean public docs', () => {
  it('ships README and the dsh guide, and scans them clean', () => {
    const result = spawnSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: REPO,
      encoding: 'utf-8',
      timeout: 60_000,
    });
    expect(result.status, result.stderr).toBe(0);

    const packs = JSON.parse(result.stdout) as Array<{
      files: Array<{ path: string }>;
    }>;
    const pack = packs[0];
    if (!pack) throw new Error(`npm pack returned no package entry:\n${result.stdout}`);
    const shipped = new Set(pack.files.map((file) => file.path));

    expect(shipped.has('README.md'), 'README.md is not shipped').toBe(true);
    expect(shipped.has('docs/dsh.md'), 'docs/dsh.md is not shipped').toBe(true);
    expect(shipped.has('dist/index.js'), 'dist/index.js is not shipped').toBe(true);

    const findings: string[] = [];
    for (const relative of ['README.md', 'docs/dsh.md']) {
      const hits = scanText(readFileSync(path.join(REPO, relative), 'utf-8'));
      if (hits.length > 0) findings.push(`${relative}: ${hits.join(', ')}`);
    }
    expect(findings).toEqual([]);
  }, 60_000);
});
