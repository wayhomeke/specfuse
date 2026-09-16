import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { composeDesignMdSkill } from '../../src/templates/design-md-skill.js';
import { composeFuseDocSkill } from '../../src/templates/fusedoc-skill.js';
import { composeFuseReviewSkill } from '../../src/templates/fusereview-skill.js';
import { composeFuseQASkill } from '../../src/templates/fuseqa-skill.js';

/**
 * This repository is scaffolded by its own tool, so .claude/skills/ holds
 * generated files. The template is the owner; the installed file is derived.
 * Edits belong on the owner, followed by regeneration — a hand-edited copy
 * silently diverges, and the divergence is invisible until someone compares.
 *
 * Contract: openspec/specs/pipeline-description-consistency/
 */
const REPO = path.resolve(import.meta.dirname, '..', '..');

const DERIVED = [
  { skill: 'design-md', compose: composeDesignMdSkill },
  { skill: 'fusedoc', compose: composeFuseDocSkill },
  { skill: 'fusereview', compose: () => composeFuseReviewSkill({ projectName: 'specfuse' }) },
  { skill: 'fuseqa', compose: () => composeFuseQASkill({ projectName: 'specfuse' }) },
] as const;

describe('installed skills equal their rendered output', () => {
  for (const { skill, compose } of DERIVED) {
    it(`.claude/skills/${skill}/SKILL.md matches compose output`, () => {
      const installed = path.join(REPO, '.claude', 'skills', skill, 'SKILL.md');
      expect(existsSync(installed), `${installed} is missing`).toBe(true);
      expect(readFileSync(installed, 'utf-8')).toBe(compose());
    });
  }
});
