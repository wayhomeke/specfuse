import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { scanText } from './public-surface-hygiene.js';

/**
 * The repository is public and the npm package ships README plus docs/dsh.md.
 * A personal environment file name, a vendor credential variable, an absolute
 * home path, or a concrete versioned model id in any of these surfaces cannot
 * be used by a consumer and points at private infrastructure.
 *
 * The archive under openspec/changes/archive/ is excluded: archived decisions
 * are frozen records, and the project edits them only through a history
 * rewrite, not a normal change.
 */
const REPO = path.resolve(import.meta.dirname, '..');

const PUBLIC_SURFACES = [
  'README.md',
  'docs',
  'tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts',
  'tests/e2e/LEDGER.md',
  'openspec/specs/dsh-harness-compatibility/spec.md',
];

function filesUnder(relative: string): string[] {
  const absolute = path.join(REPO, relative);
  const stat = statSync(absolute);
  if (stat.isFile()) return [absolute];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? filesUnder(path.join(relative, entry.name))
      : [path.join(absolute, entry.name)],
  );
}

describe('public surfaces carry no personal environment identifiers', () => {
  it('scans every shipped surface and reports no prohibited marker', () => {
    const findings: string[] = [];
    for (const surface of PUBLIC_SURFACES) {
      for (const file of filesUnder(surface)) {
        const hits = scanText(readFileSync(file, 'utf-8'));
        if (hits.length > 0) {
          findings.push(`${path.relative(REPO, file)}: ${hits.join(', ')}`);
        }
      }
    }
    expect(findings).toEqual([]);
  });

  it('detects every prohibited marker in a fixture', () => {
    const fixture = [
      'env file: ~/private.env',
      'generated: path.join(homedir(), "private.env")',
      'credential: VENDOR_BASE_URL',
      'token: API_KEY=abcdefghijklmnop',
      'path: /home/example/project',
      'windows: C:\\Users\\example\\project',
      'model: vendor-1.0-preview',
    ].join('\n');

    expect(scanText(fixture).sort()).toEqual([
      'absolute home path',
      'concrete versioned model id',
      'literal credential value',
      'personal environment file',
      'vendor credential variable',
    ]);
  });

  it('does not flag public dsh variables or tool defaults', () => {
    const allowed = [
      'DEEPSEEK_BASE_URL',
      'DEEPSEEK_API_KEY',
      'SPECFUSE_DSH_MODEL',
      '~/.dsh',
      '~/.claude.json',
    ].join('\n');

    expect(scanText(allowed)).toEqual([]);
  });

  it('keeps the generic endpoint contract present in the shipped docs', () => {
    const surfaces = [
      ['README.md', readFileSync(path.join(REPO, 'README.md'), 'utf-8')],
      ['docs/dsh.md', readFileSync(path.join(REPO, 'docs', 'dsh.md'), 'utf-8')],
    ] as const;

    for (const [name, text] of surfaces) {
      for (const variable of [
        'DEEPSEEK_BASE_URL',
        'DEEPSEEK_API_KEY',
        'SPECFUSE_DSH_MODEL',
      ]) {
        expect(text, `${name} is missing ${variable}`).toContain(variable);
      }
    }
    expect(surfaces[1][1]).toContain('your-model-id');
  });

  it('keeps the real-model E2E reading the generic variables', () => {
    const source = readFileSync(
      path.join(REPO, 'tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts'),
      'utf-8',
    );
    for (const variable of ['DEEPSEEK_BASE_URL', 'DEEPSEEK_API_KEY', 'SPECFUSE_DSH_MODEL']) {
      expect(source, `real-model E2E is missing ${variable}`).toContain(variable);
    }
  });

  it('keeps the real dsh E2E skipped and green when the gate is closed', () => {
    const env = { ...process.env };
    delete env.SPECFUSE_DSH_E2E;
    delete env.DEEPSEEK_BASE_URL;
    delete env.DEEPSEEK_API_KEY;
    delete env.SPECFUSE_DSH_MODEL;

    const result = spawnSync(
      process.execPath,
      [
        path.join(REPO, 'node_modules', 'vitest', 'vitest.mjs'),
        'run',
        'tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts',
      ],
      { cwd: REPO, env, encoding: 'utf-8', timeout: 60_000 },
    );

    expect(result.status, result.stderr).toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain('[fuseqa] skipping real dsh E2E:');
  }, 60_000);
});
