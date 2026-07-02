import { describe, it, expect } from 'vitest';
import {
  QUESTIONS,
  type QuestionDefinition,
} from '../questionnaire.js';

describe('questionnaire definitions', () => {
  it('exports exactly 5 questions (Q1-Q5)', () => {
    expect(QUESTIONS).toHaveLength(5);
  });

  it('Q1 is multi-select product type', () => {
    const q1 = QUESTIONS[0];
    expect(q1.id).toBe('productType');
    expect(q1.type).toBe('checkbox');
    expect(q1.choices.length).toBeGreaterThanOrEqual(9);
  });

  it('Q2 is single-select audience', () => {
    const q2 = QUESTIONS[1];
    expect(q2.id).toBe('audience');
    expect(q2.type).toBe('select');
    expect(q2.choices.length).toBeGreaterThanOrEqual(3);
  });

  it('Q3 is multi-select mood keywords', () => {
    const q3 = QUESTIONS[2];
    expect(q3.id).toBe('mood');
    expect(q3.type).toBe('checkbox');
    expect(q3.choices.length).toBeGreaterThanOrEqual(4);
  });

  it('Q4 is single-select density preference', () => {
    const q4 = QUESTIONS[3];
    expect(q4.id).toBe('density');
    expect(q4.type).toBe('select');
    expect(q4.choices.length).toBeGreaterThanOrEqual(3);
  });

  it('Q5 is optional text input for reference product', () => {
    const q5 = QUESTIONS[4];
    expect(q5.id).toBe('reference');
    expect(q5.type).toBe('input');
    expect(q5.required).toBe(false);
  });

  it('all questions have message and id', () => {
    for (const q of QUESTIONS) {
      expect(q.id).toBeTruthy();
      expect(q.message).toBeTruthy();
    }
  });

  it('Q1 choices cover all archetype categories', () => {
    const q1 = QUESTIONS[0];
    const values = q1.choices.map((c: { value: string }) => c.value);
    expect(values).toContain('internal-tool');
    expect(values).toContain('dashboard');
    expect(values).toContain('consumer');
    expect(values).toContain('developer');
    expect(values).toContain('mobile');
    expect(values).toContain('e-commerce');
    expect(values).toContain('marketing');
    expect(values).toContain('form-heavy');
    expect(values).toContain('content');
  });
});
