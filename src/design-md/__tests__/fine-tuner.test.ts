import { describe, it, expect } from 'vitest';
import { applyOverrides } from '../fine-tuner.js';
import type { DimensionVector } from '../types.js';

const baseVector: DimensionVector = {
  colorTemp: 2,
  lightness: 3,
  density: 2,
  borderRadius: 3,
  tone: 2,
};

describe('applyOverrides()', () => {
  it('returns original vector when no overrides', () => {
    const result = applyOverrides(baseVector, {});
    expect(result).toEqual(baseVector);
  });

  it('applies single dimension override', () => {
    const result = applyOverrides(baseVector, { borderRadius: 1 });
    expect(result).toEqual({ ...baseVector, borderRadius: 1 });
  });

  it('applies multiple dimension overrides', () => {
    const result = applyOverrides(baseVector, { colorTemp: 5, tone: 4 });
    expect(result).toEqual({ ...baseVector, colorTemp: 5, tone: 4 });
  });

  it('rejects values below 1', () => {
    expect(() => applyOverrides(baseVector, { colorTemp: 0 as any })).toThrow();
  });

  it('rejects values above 5', () => {
    expect(() => applyOverrides(baseVector, { density: 6 as any })).toThrow();
  });

  it('rejects non-integer values', () => {
    expect(() => applyOverrides(baseVector, { tone: 2.5 as any })).toThrow();
  });

  it('does not mutate the original vector', () => {
    const original = { ...baseVector };
    applyOverrides(baseVector, { colorTemp: 5 });
    expect(baseVector).toEqual(original);
  });
});
