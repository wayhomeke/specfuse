import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const dir = path.resolve(import.meta.dirname, '..', '..', 'src', 'fuseqa', 'templates');
const read = (f: string) => readFileSync(path.join(dir, f), 'utf-8');

// spec: fuseqa-skill-generation
describe('FuseQA templates exist', () => {
  it('ships exactly the four expected templates', () => {
    expect(existsSync(dir)).toBe(true);
    const files = readdirSync(dir).sort();
    expect(files).toEqual([
      '_case-schema.yaml',
      'derivation-checklist.md',
      'entry-recipes.md',
      'ledger.md',
    ]);
  });
});

describe('_case-schema.yaml is a parseable five-field contract', () => {
  it('parses as YAML', () => {
    expect(() => parse(read('_case-schema.yaml'))).not.toThrow();
  });

  it('requires the five case fields', () => {
    const schema = parse(read('_case-schema.yaml')) as any;
    expect(schema.required).toEqual(
      expect.arrayContaining(['artifact', 'entry', 'isolation', 'observable', 'traces-to']),
    );
  });

  it('constrains entry away from function names and artifact away from source paths', () => {
    const raw = read('_case-schema.yaml');
    expect(raw).toMatch(/not a function name/i);
    expect(raw).toMatch(/not a source path/i);
  });
});

describe('entry-recipes.md covers the five shapes with the two specific gotchas', () => {
  const raw = read('entry-recipes.md');

  it('covers all five artifact shapes', () => {
    for (const shape of ['CLI', 'HTTP API', 'WebUI', 'Library', 'Data artifact']) {
      expect(raw).toContain(shape);
    }
  });

  it('names the bin shim and the exports contract', () => {
    expect(raw).toMatch(/bin shim/i);
    expect(raw).toContain('exports');
  });
});

describe('ledger.md records the three lifecycle events', () => {
  const raw = read('ledger.md');

  it('covers addition, correction and removal', () => {
    expect(raw).toMatch(/addition/i);
    expect(raw).toMatch(/correction/i);
    expect(raw).toMatch(/removal/i);
  });

  it('gives removal a reason field inside the Removal section', () => {
    // Scoped to the section: "reason" also appears twice in surrounding prose,
    // so an unscoped match survives deleting the Reason row.
    const section = raw.slice(raw.indexOf('## Removal'));
    expect(section).toMatch(/\|\s*Reason no longer valid\s*\|/);
  });
});

describe('derivation-checklist.md carries the QA techniques', () => {
  const raw = read('derivation-checklist.md');

  it('covers the five derivation techniques', () => {
    expect(raw).toMatch(/boundary/i);
    expect(raw).toMatch(/idempoten/i);
    expect(raw).toMatch(/concurren|race/i);
    expect(raw).toMatch(/error injection/i);
    expect(raw).toMatch(/re-entry|interrupt/i);
  });

  it('names Non-goals as the out-of-scope boundary', () => {
    expect(raw).toMatch(/non-goals/i);
  });
});

describe('templates are framework-neutral', () => {
  it('never mandates a specific test framework', () => {
    for (const f of readdirSync(dir)) {
      const raw = read(f);
      // A framework may appear as an example, never as a requirement.
      expect(raw).not.toMatch(/(MUST|must|必须)\s+use\s+(vitest|bats|playwright|jest)/i);
    }
  });
});
