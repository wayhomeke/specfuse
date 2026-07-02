import type { DimensionValue, DimensionVector } from './types.js';

export type DimensionOverrides = Partial<Record<keyof DimensionVector, number>>;

export function applyOverrides(base: DimensionVector, overrides: DimensionOverrides): DimensionVector {
  const result = { ...base };

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) continue;
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(`Invalid dimension value for ${key}: ${value} (must be integer 1-5)`);
    }
    result[key as keyof DimensionVector] = value as DimensionValue;
  }

  return result;
}
