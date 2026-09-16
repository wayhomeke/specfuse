import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// spec: fusedoc-skill-generation
//   "Rendered skill contains no vendor or foreign-host references"
// The assets ship verbatim into arbitrary user projects, so a vendor name or a
// path that only exists in the authoring repository must not survive the port.

const ASSET_DIR = path.join(import.meta.dirname, '../../src/fusedoc/templates');

const files = readdirSync(ASSET_DIR).filter((f) => f.endsWith('.md'));

/** Vendor identifiers: product names, package scopes, environment variables. */
const VENDOR_PATTERNS: Array<[string, RegExp]> = [
  ['vendor product name', /deepseek/i],
  ['vendor package scope', /@deepseek-ai/i],
  ['vendor environment variable', /DEEPSEEK_API_KEY/i],
  ['vendor plugin runtime', /cordis/i],
  ['vendor sandbox module', /landlock/i],
  ['vendor CLI shorthand', /\bdsh\b/i],
];

/** Paths that exist in the authoring repository but not in a scaffolded project. */
const FOREIGN_HOST_PATTERNS: Array<[string, RegExp]> = [
  ['authoring-only skill tree', /\.agents\/skills/],
  ['authoring-only workspace layout', /packages\/[a-z-]+\/[a-z-]+\//],
  ['authoring-only package manager invocation', /\bpnpm\s+run\b/],
  ['authoring-only doc layer', /docs\/(architecture|cordis-primer|testing|rescope)\.md/],
];

describe('FuseDoc assets carry no vendor or foreign-host references', () => {
  it('finds all three reference files', () => {
    expect(files.sort()).toEqual(['examples.md', 'probes.md', 'recall-batteries.md']);
  });

  for (const file of files) {
    it(`${file} names no vendor identifier`, () => {
      const body = readFileSync(path.join(ASSET_DIR, file), 'utf8');
      const hits = VENDOR_PATTERNS.filter(([, re]) => re.test(body)).map(([label]) => label);
      expect(hits).toEqual([]);
    });

    it(`${file} references no authoring-repository path`, () => {
      const body = readFileSync(path.join(ASSET_DIR, file), 'utf8');
      const hits = FOREIGN_HOST_PATTERNS.filter(([, re]) => re.test(body)).map(([label]) => label);
      expect(hits).toEqual([]);
    });
  }
});

// spec: fusedoc-skill-generation — the three "distributed" Scenarios say more
// than "the file exists": each names content the reference must carry. An
// existence check alone passes on an empty or truncated file, which is what a
// broken copy step would leave behind.
describe('FuseDoc references carry the content their Scenarios name', () => {
  const read = (name: string) => readFileSync(path.join(ASSET_DIR, name), 'utf8');

  it('examples.md pairs over-trimmed against balanced versions', () => {
    const body = read('examples.md');
    expect(body).toMatch(/over-trimmed/i);
    expect(body).toMatch(/balanced/i);
    // The pair form is the calibration method, not decoration: a file with only
    // one side teaches nothing about where the line sits.
    const pairs = body.match(/\*\*Over-trimmed:\*\*/g) ?? [];
    const balanced = body.match(/\*\*Balanced:\*\*/g) ?? [];
    expect(pairs.length).toBeGreaterThanOrEqual(5);
    expect(balanced.length).toBeGreaterThanOrEqual(5);
  });

  it('recall-batteries.md carries both the patterns and the false-positive families', () => {
    const body = read('recall-batteries.md');
    expect(body).toMatch(/rg -n/);
    expect(body).toMatch(/false-positive/i);
    // Over-matching patterns are only usable if the keeps travel with them.
    expect(body).toMatch(/judge|keep/i);
  });

  it('probes.md states detection reads configuration rather than running a command', () => {
    const body = read('probes.md');
    expect(body).toMatch(/never runs a command/i);
    expect(body).toMatch(/uncovered/i);
  });
});
