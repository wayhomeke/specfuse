import { describe, it, expect } from 'vitest';
import { composeCLAUDEmd } from '../../src/templates/claude-md.js';
import { composeFuseReviewSkill } from '../../src/templates/fusereview-skill.js';
import { composeFuseQASkill } from '../../src/templates/fuseqa-skill.js';
import { composeFuseDocSkill } from '../../src/templates/fusedoc-skill.js';

// spec: pipeline-description-consistency
// The pipeline is four beats. Every shipped description of it must say so, and
// none may label a beat by its position: an ordinal is derived state that has
// to be recomputed by hand whenever a beat is added or removed, which is how
// these descriptions came to be a beat behind.

const BEATS = ['Think', 'Do', 'FuseReview', 'Verify'] as const;

/** The list, in order, with arbitrary prose allowed between names. */
const IN_ORDER = new RegExp(BEATS.map((b) => `\\b${b}\\b`).join('[\\s\\S]*?'));

/**
 * An ordinal applied to a beat. Deliberately narrow: `first` and `second` are
 * ordinary words ("the first time"), so only the forms that actually label a
 * pipeline position match.
 */
const ORDINAL_BEAT = /\b(first|second|third|fourth|fifth|sixth|1st|2nd|3rd|4th|5th|6th)\s+(pipeline\s+)?beat\b/i;

const SURFACES = [
  { name: 'generated CLAUDE.md', text: () => composeCLAUDEmd({ projectName: 'test' }) },
  { name: 'FuseReview skill', text: () => composeFuseReviewSkill({ projectName: 'test' }) },
] as const;

describe('the ordinal pattern detects what it claims to detect', () => {
  // A zero-hit assertion proves nothing until the pattern has been seen to
  // match. These are the exact strings this change removes.
  it.each([
    'Fourth beat of the pipeline',
    'FuseQA is the fifth beat',
    '(FuseReview, the fourth pipeline beat)',
    '4th beat',
  ])('matches %j', (sample) => {
    expect(ORDINAL_BEAT.test(sample)).toBe(true);
  });

  it('does not fire on ordinary uses of the same words', () => {
    expect(ORDINAL_BEAT.test('the first time this runs')).toBe(false);
    expect(ORDINAL_BEAT.test('second-guessing the reviewer')).toBe(false);
    expect(ORDINAL_BEAT.test('verify the beat is correct')).toBe(false);
  });
});

/**
 * The pipeline enumeration, as it appears in an opening sentence.
 *
 * Matching the whole document instead would be vacuous: CLAUDE.md names FuseQA
 * in a section heading and in prose outside the enumeration, so a document-wide
 * pattern still matches after the enumeration drops a beat. Reviewed and
 * confirmed — deleting FuseQA from the FuseQA opening sentence left a
 * document-wide assertion green.
 */
const ENUMERATION = /Think reviews direction[^.]*\./g;

describe('every shipped pipeline description enumerates all four beats', () => {
  for (const { name, text } of SURFACES) {
    it(`${name} enumerates them, in order, in every enumeration it contains`, () => {
      const enumerations = text().match(ENUMERATION) ?? [];
      expect(enumerations.length, `${name} contains no pipeline enumeration`).toBeGreaterThan(0);

      for (const sentence of enumerations) {
        const missing = BEATS.filter((b) => !new RegExp(`\\b${b}\\b`).test(sentence));
        expect(missing, `dropped from: ${sentence.slice(0, 80)}`).toEqual([]);
        expect(sentence).toMatch(IN_ORDER);
        expect(sentence).not.toMatch(/\bFuseQA\b/);
      }
    });
  }
});

describe('FuseQA is not a pipeline beat', () => {
  const skill = composeFuseQASkill({ projectName: 'test' });

  it('does not enumerate itself among the beats', () => {
    for (const sentence of skill.match(ENUMERATION) ?? []) {
      expect(sentence).not.toMatch(/\bFuseQA\b/);
    }
  });

  it('states that it is outside the default pipeline and named by the full variant', () => {
    expect(skill).toMatch(/not part of the default .*pipeline/i);
    expect(skill).toMatch(/never invokes it/i);
    expect(skill).toMatch(/specfuse:full/i);
  });
});

describe('no shipped pipeline description labels a beat by its position', () => {
  for (const { name, text } of SURFACES) {
    it(`${name} carries no ordinal beat label`, () => {
      const hit = text().match(ORDINAL_BEAT);
      expect(hit?.[0] ?? null).toBe(null);
    });
  }
});

describe('skill frontmatter identifies its capability by what it does', () => {
  const fm = (skill: string) => skill.slice(4, skill.indexOf('\n---', 4));

  it('FuseReview frontmatter names the post-apply review, not a position', () => {
    const front = fm(composeFuseReviewSkill({ projectName: 'test' }));
    expect(front).toMatch(/post-apply/i);
    expect(front).toMatch(/review/i);
    expect(front).not.toMatch(ORDINAL_BEAT);
  });

  it('FuseQA frontmatter names on-demand E2E verification, not a beat', () => {
    const front = fm(composeFuseQASkill({ projectName: 'test' }));
    expect(front).toMatch(/on[- ]demand|explicitly|when you ask/i);
    expect(front).toMatch(/end-to-end|E2E/i);
    expect(front).not.toMatch(/\bbeat\b/i);
    expect(front).not.toMatch(ORDINAL_BEAT);
  });
});

describe('FuseDoc is not swept into the pipeline listing', () => {
  // FuseDoc is a cross-pipeline standard, not a beat. Adding it to the five-beat
  // listing would make the description advertise a pipeline that does not exist
  // — the same defect, in the other direction.
  it('its own output does not claim a position among the beats', () => {
    expect(composeFuseDocSkill()).not.toMatch(ORDINAL_BEAT);
  });
});
