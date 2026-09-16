import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { composeFuseDocSkill } from '../../src/templates/fusedoc-skill.js';

const skill = composeFuseDocSkill();
const frontmatter = skill.slice(4, skill.indexOf('\n---', 4));
const ASSET_DIR = path.join(import.meta.dirname, '../../src/fusedoc/templates');

// spec: fusedoc-skill-generation
describe('FuseDoc skill frontmatter', () => {
  it('declares the name and a trigger covering write, review, audit and relocate', () => {
    expect(skill.startsWith('---\n')).toBe(true);
    expect(frontmatter).toContain('name: fusedoc');
    expect(frontmatter).toMatch(/review/i);
    expect(frontmatter).toMatch(/audit/i);
    expect(frontmatter).toMatch(/relocat/i);
  });

  it('carries colloquial trigger phrases a user would actually type', () => {
    const colloquial = [
      /improve the docs/i,
      /audit the docs/i,
      /where should this be documented/i,
      /too long/i,
      /notes-to-self/i,
    ];
    expect(colloquial.filter((r) => r.test(frontmatter)).length).toBeGreaterThanOrEqual(2);
  });
});

describe('FuseDoc skill: three axes carry substance', () => {
  it('has a heading for each of the three axes', () => {
    expect(skill).toMatch(/^## 2\. Axis — proposition judgment/m);
    expect(skill).toMatch(/^## 3\. Axis — vantage correction/m);
    expect(skill).toMatch(/^## 4\. Axis — structural placement/m);
  });

  it('states the resolvability test on the vantage axis', () => {
    expect(skill).toMatch(/a reader at the current commit/i);
    expect(skill).toMatch(/session transcript/i);
    expect(skill).toMatch(/resolve every reference/i);
  });

  it('enumerates all eight leakage classes', () => {
    const classes = [
      /Dead design-session citations/,
      /Stack and review-thread vantage/,
      /Change narration and version stamps/,
      /Review choreography/,
      /Reviewer-addressed justification/,
      /Restatement and derivation transcripts/,
      /Hedges and planning residue/,
      /Authoring-language slips/,
    ];
    expect(classes.filter((re) => !re.test(skill))).toEqual([]);
  });

  it('states all four overcorrection traps', () => {
    expect(skill).toMatch(/Flipping an obligation into an endorsement/);
    expect(skill).toMatch(/Promoting a hypothetical to a shipped feature/);
    expect(skill).toMatch(/Deleting a true fact with the transcript/);
    expect(skill).toMatch(/Dropping provenance while keeping the number/);
  });

  it('requires scope as an input and forbids inferring it', () => {
    expect(skill).toMatch(/`scope` is required/);
    expect(skill).toMatch(/do not infer a repository-wide scope/i);
  });
});

describe('FuseDoc skill: host capabilities are pre-wired', () => {
  it('names the decision-record convention as present', () => {
    expect(skill).toContain('openspec/changes/<name>/');
    expect(skill).toMatch(/Decision-record convention/);
    expect(skill).toMatch(/present by construction/i);
  });

  it('names the frozen-archive convention as present', () => {
    expect(skill).toContain('openspec/changes/archive/');
    expect(skill).toMatch(/Frozen-archive convention/);
  });

  it('excludes the skill own directory from audit', () => {
    expect(skill).toContain('.claude/skills/fusedoc/');
    expect(skill).toMatch(/this skill's own directory/i);
  });

  it('requires uncovered dimensions to be reported, never assumed', () => {
    expect(skill).toMatch(/uncovered/i);
    expect(skill).toMatch(/never claim a check passed when none was detected or executed/i);
  });
});

describe('FuseDoc skill: reference links resolve', () => {
  it('links only to reference files that exist on disk', () => {
    const linked = [...skill.matchAll(/references\/([a-z-]+\.md)/g)].map((m) => m[1]);
    expect(linked.length).toBeGreaterThanOrEqual(3);
    const onDisk = readdirSync(ASSET_DIR).filter((f) => f.endsWith('.md'));
    for (const name of new Set(linked)) {
      expect(onDisk).toContain(name);
    }
  });

  it('ships every asset it references and references every asset it ships', () => {
    const linked = new Set([...skill.matchAll(/references\/([a-z-]+\.md)/g)].map((m) => m[1]));
    const onDisk = new Set(readdirSync(ASSET_DIR).filter((f) => f.endsWith('.md')));
    // A renamed asset or a renamed link breaks the skill: one side goes orphan.
    expect([...onDisk].filter((f) => !linked.has(f))).toEqual([]);
    expect([...linked].filter((f) => !onDisk.has(f))).toEqual([]);
  });

  it('carries no escaped backticks', () => {
    expect(skill).not.toContain('\\`');
  });
});

// spec: fusedoc-skill-generation / "No vendor identifiers in the rendered skill"
// The assets scan covers references/*.md; this covers the SKILL.md the user gets,
// which is the file that actually ships. Both are reachable regressions — the
// ported-in vendor name that had to be cleaned out of a sibling skill lived in
// prose, not in an asset.
describe('FuseDoc rendered skill carries no vendor or foreign-host references', () => {
  const VENDOR = [
    [/deepseek/i, 'vendor product name'],
    [/@deepseek-ai/i, 'vendor package scope'],
    [/DEEPSEEK_API_KEY/i, 'vendor environment variable'],
    [/cordis/i, 'vendor plugin runtime'],
    [/landlock/i, 'vendor sandbox module'],
    [/\bdsh\b/i, 'vendor CLI shorthand'],
  ] as const;

  const FOREIGN = [
    [/\.agents\/skills/, 'authoring-only skill tree'],
    [/\bpnpm\s+run\b/, 'authoring-only package manager invocation'],
    [/docs\/(architecture|cordis-primer|testing|rescope)\.md/, 'authoring-only doc layer'],
  ] as const;

  it('names no vendor identifier', () => {
    const hits = VENDOR.filter(([re]) => re.test(skill)).map(([, label]) => label);
    expect(hits).toEqual([]);
  });

  it('references no authoring-repository path', () => {
    const hits = FOREIGN.filter(([re]) => re.test(skill)).map(([, label]) => label);
    expect(hits).toEqual([]);
  });
});
