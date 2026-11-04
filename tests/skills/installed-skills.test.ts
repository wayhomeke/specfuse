import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { composeDesignMdSkill } from '../../src/templates/design-md-skill.js';
import { composeFuseDocSkill } from '../../src/templates/fusedoc-skill.js';
import { composeFuseReviewSkill } from '../../src/templates/fusereview-skill.js';
import { composeFuseQASkill } from '../../src/templates/fuseqa-skill.js';
import { composeSpecfuseDshSkill } from '../../src/templates/specfuse-command.js';

/**
 * This repository is scaffolded by its own tool, so .claude/skills/ and
 * .agents/skills/ hold generated files. The template is the owner; each
 * installed file is derived. Edits belong on the owner, followed by
 * regeneration — a hand-edited copy silently diverges, and the divergence is
 * invisible until someone compares.
 *
 * Contract: openspec/specs/pipeline-description-consistency/ and
 * openspec/specs/dsh-harness-compatibility/
 */
const REPO = path.resolve(import.meta.dirname, '..', '..');
const ROOTS = ['.claude/skills', '.agents/skills'] as const;

const DERIVED = [
  { skill: 'design-md', compose: composeDesignMdSkill },
  { skill: 'fusedoc', compose: composeFuseDocSkill },
  { skill: 'fusereview', compose: () => composeFuseReviewSkill({ projectName: 'specfuse' }) },
  { skill: 'fuseqa', compose: () => composeFuseQASkill({ projectName: 'specfuse' }) },
] as const;

describe('installed skills equal their rendered output', () => {
  for (const root of ROOTS) {
    for (const { skill, compose } of DERIVED) {
      it(`${root}/${skill}/SKILL.md matches compose output`, () => {
        const installed = path.join(REPO, root, skill, 'SKILL.md');
        expect(existsSync(installed), `${installed} is missing`).toBe(true);
        expect(readFileSync(installed, 'utf-8')).toBe(compose());
      });
    }
  }
});

/**
 * The two dsh entry points exist only under the shared-agents root. They are
 * generated files with no Claude command counterpart, so they need their own
 * comparison against the composer.
 */
describe('installed dsh entry skills equal their rendered output', () => {
  const ENTRY = [
    { skill: 'specfuse', compose: () => composeSpecfuseDshSkill('default') },
    { skill: 'specfuse-full', compose: () => composeSpecfuseDshSkill('full') },
  ] as const;

  for (const { skill, compose } of ENTRY) {
    it(`.agents/skills/${skill}/SKILL.md matches compose output`, () => {
      const installed = path.join(REPO, '.agents', 'skills', skill, 'SKILL.md');
      expect(existsSync(installed), `${installed} is missing`).toBe(true);
      expect(readFileSync(installed, 'utf-8')).toBe(compose());
    });
  }
});
