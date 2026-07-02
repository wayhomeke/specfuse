import { describe, it, expect } from 'vitest';
import { deriveVector, matchArchetype } from '../matcher.js';
import type { QuestionnaireAnswers, DimensionVector } from '../types.js';

const sampleAnswers: QuestionnaireAnswers = {
  productType: ['dashboard', 'internal-tool'],
  audience: 'developers',
  mood: 'dark',
  density: 'compact',
  reference: null,
};

describe('deriveVector()', () => {
  it('returns a valid DimensionVector with values 1-5', () => {
    const vec = deriveVector(sampleAnswers);
    for (const key of ['colorTemp', 'lightness', 'density', 'borderRadius', 'tone'] as const) {
      expect(vec[key]).toBeGreaterThanOrEqual(1);
      expect(vec[key]).toBeLessThanOrEqual(5);
      expect(Number.isInteger(vec[key])).toBe(true);
    }
  });

  it('same input produces same output (deterministic)', () => {
    const a = deriveVector(sampleAnswers);
    const b = deriveVector(sampleAnswers);
    expect(a).toEqual(b);
  });

  it('different inputs produce different vectors', () => {
    const other: QuestionnaireAnswers = {
      productType: ['marketing'],
      audience: 'general',
      mood: 'playful',
      density: 'spacious',
      reference: null,
    };
    const a = deriveVector(sampleAnswers);
    const b = deriveVector(other);
    expect(a).not.toEqual(b);
  });
});

describe('matchArchetype()', () => {
  it('returns all 15 archetypes ranked', () => {
    const results = matchArchetype(sampleAnswers);
    expect(results).toHaveLength(15);
  });

  it('results are sorted by ascending distance (best first)', () => {
    const results = matchArchetype(sampleAnswers);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distance).toBeGreaterThanOrEqual(results[i - 1].distance);
    }
  });

  it('category bonus applied to matching categories', () => {
    const dashboardAnswers: QuestionnaireAnswers = {
      productType: ['dashboard'],
      audience: 'business',
      mood: 'serious',
      density: 'compact',
      reference: null,
    };
    const results = matchArchetype(dashboardAnswers);
    const dashboardResults = results.filter((r) => r.archetype.category === 'dashboard');
    expect(dashboardResults.length).toBeGreaterThan(0);
    // dashboard archetypes should rank highly for dashboard-focused answers
    const topIds = results.slice(0, 5).map((r) => r.archetype.id);
    const hasDashboard = topIds.some(
      (id) => id.includes('dashboard') || id.includes('monitoring') || id.includes('analytics'),
    );
    expect(hasDashboard).toBe(true);
  });

  it('each result has archetype and distance', () => {
    const results = matchArchetype(sampleAnswers);
    for (const r of results) {
      expect(r.archetype).toBeDefined();
      expect(r.archetype.id).toBeTruthy();
      expect(typeof r.distance).toBe('number');
      expect(r.distance).toBeGreaterThanOrEqual(0);
    }
  });
});
