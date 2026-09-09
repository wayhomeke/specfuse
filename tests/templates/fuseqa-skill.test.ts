import { describe, it, expect } from 'vitest';
import { composeFuseQASkill } from '../../src/templates/fuseqa-skill.js';

const skill = composeFuseQASkill({ projectName: 'test' });

// spec: fuseqa-skill-generation
describe('FuseQA skill frontmatter', () => {
  it('declares name fuseqa and the in-flow trigger', () => {
    expect(skill.startsWith('---\n')).toBe(true);
    const fm = skill.slice(4, skill.indexOf('\n---', 4));
    expect(fm).toContain('name: fuseqa');
    expect(fm).toMatch(/post-apply/i);
    expect(fm).toMatch(/end-to-end|E2E/i);
  });

  it('carries at least two colloquial trigger phrases', () => {
    const fm = skill.slice(4, skill.indexOf('\n---', 4));
    const colloquial = [/write e2e tests?/i, /end-to-end tests?/i, /QA acceptance/i, /add test cases?/i];
    expect(colloquial.filter((r) => r.test(fm)).length).toBeGreaterThanOrEqual(2);
  });

  it('states it authors cases and does not run the existing regression suite', () => {
    expect(skill).toMatch(/does not (execute|run) the existing/i);
  });
});

describe('FuseQA skill: artifact-shape decision tree', () => {
  it('asks how the artifact is obtained, triggered and observed', () => {
    expect(skill).toMatch(/How does the user obtain/i);
    expect(skill).toMatch(/How is the artifact triggered/i);
    expect(skill).toMatch(/What is externally observable/i);
  });

  it('routes artifacts with no executable entry to their real consumer', () => {
    expect(skill).toMatch(/read by another program/i);
    expect(skill).toMatch(/verified through their real consumer/i);
  });

  it('requires unknown shapes to be derived, not declared untestable', () => {
    expect(skill).toMatch(/never declared untestable/i);
    expect(skill).toMatch(/record the conclusion in the case's `entry` field/i);
  });
});

describe('FuseQA skill: case contract', () => {
  it('forbids importing project source and says it is grep-checkable', () => {
    expect(skill).toMatch(/No importing project source/i);
    expect(skill).toContain('../src/');
    expect(skill).toMatch(/grep-checkable/i);
  });

  it('puts the built artifact under test, citing the bin shim defect', () => {
    expect(skill).toMatch(/build output, not the source/i);
    expect(skill).toMatch(/symlinked bin shim/i);
  });

  it('requires the five declared fields as table rows', () => {
    // Matching the table row shape, not bare words: four of the five names also
    // occur in surrounding prose, so toContain() would stay green even if the
    // whole contract table were deleted.
    for (const f of ['artifact', 'entry', 'isolation', 'observable', 'traces-to']) {
      expect(skill).toMatch(new RegExp('\\|\\s*`' + f + '`\\s*\\|'));
    }
  });
});

describe('FuseQA skill: entry recipes', () => {
  it('CLI recipe requires a real subprocess and the bin shim path', () => {
    expect(skill).toMatch(/spawn a real subprocess with argv/i);
    expect(skill).toMatch(/Must cover invocation through a symlinked bin shim/i);
  });

  it('API forbids direct handler calls, WebUI forbids prop assertions', () => {
    expect(skill).toMatch(/Calling the handler function directly is forbidden/i);
    expect(skill).toMatch(/Asserting on mounted component props is forbidden/i);
  });

  it('library recipe tests the published exports contract', () => {
    expect(skill).toMatch(/`exports`/);
    expect(skill).toMatch(/never internal source paths/i);
  });

  it('defers tool choice to the project', () => {
    expect(skill).toMatch(/fix the \*\*contract\*\*, not the tool/i);
    expect(skill).toMatch(/do not introduce a second test framework/i);
  });
});

describe('FuseQA skill: browser self-check', () => {
  it('skips rather than fails when the browser binary is missing', () => {
    expect(skill).toMatch(/skip rather than fail/i);
  });

  it('keeps the skip visible and the gate green', () => {
    expect(skill).toMatch(/Print the reason/i);
    expect(skill).toMatch(/MUST NOT turn the regression gate red/i);
  });
});

describe('FuseQA skill: derivation checklist', () => {
  it('covers the five derivation techniques', () => {
    expect(skill).toMatch(/Equivalence partitioning with boundary values/i);
    expect(skill).toMatch(/idempotence on repeat/i);
    expect(skill).toMatch(/Concurrency and races/i);
    expect(skill).toMatch(/Error injection/i);
    expect(skill).toMatch(/Re-entry after interruption/i);
  });

  it('reads the proposal Non-goals as an out-of-scope boundary', () => {
    expect(skill).toMatch(/Non-goals as an out-of-scope boundary/i);
    expect(skill).toMatch(/manufactures a false failure/i);
  });
});
