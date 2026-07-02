import { loadArchetypes } from './archetypes.js';
import type { Archetype, DimensionVector, DimensionValue, QuestionnaireAnswers } from './types.js';

export interface MatchResult {
  archetype: Archetype;
  distance: number;
}

const MOOD_MAP: Record<string, Partial<DimensionVector>> = {
  clean: { lightness: 4, tone: 2 },
  playful: { colorTemp: 4, tone: 5, borderRadius: 4 },
  serious: { colorTemp: 2, tone: 1, borderRadius: 2 },
  warm: { colorTemp: 4, lightness: 3, tone: 3 },
  bold: { colorTemp: 3, tone: 4, lightness: 2 },
  calm: { colorTemp: 3, lightness: 4, tone: 2 },
  dark: { colorTemp: 1, lightness: 1, tone: 1 },
  luxurious: { colorTemp: 3, lightness: 2, borderRadius: 3, tone: 3 },
};

const AUDIENCE_MAP: Record<string, Partial<DimensionVector>> = {
  developers: { density: 1, borderRadius: 2, tone: 1 },
  business: { density: 2, tone: 2, lightness: 3 },
  general: { density: 3, borderRadius: 4, tone: 4 },
  designers: { lightness: 4, borderRadius: 4, tone: 3 },
  enterprise: { density: 2, tone: 1, borderRadius: 2 },
};

const DENSITY_MAP: Record<string, DimensionValue> = {
  compact: 1,
  balanced: 3,
  spacious: 5,
};

const CATEGORY_MAP: Record<string, Partial<DimensionVector>> = {
  'internal-tool': { colorTemp: 2, lightness: 3, density: 1, borderRadius: 2, tone: 1 },
  dashboard: { colorTemp: 1, lightness: 1, density: 1, borderRadius: 2, tone: 1 },
  consumer: { colorTemp: 4, lightness: 4, density: 3, borderRadius: 4, tone: 4 },
  developer: { colorTemp: 2, lightness: 2, density: 2, borderRadius: 2, tone: 1 },
  mobile: { colorTemp: 3, lightness: 4, density: 3, borderRadius: 5, tone: 4 },
  'e-commerce': { colorTemp: 3, lightness: 4, density: 2, borderRadius: 3, tone: 3 },
  marketing: { colorTemp: 4, lightness: 4, density: 4, borderRadius: 4, tone: 5 },
  'form-heavy': { colorTemp: 2, lightness: 3, density: 2, borderRadius: 2, tone: 2 },
  content: { colorTemp: 3, lightness: 4, density: 3, borderRadius: 3, tone: 3 },
};

function clamp(val: number): DimensionValue {
  return Math.max(1, Math.min(5, Math.round(val))) as DimensionValue;
}

export function deriveVector(answers: QuestionnaireAnswers): DimensionVector {
  const accumulator = { colorTemp: 0, lightness: 0, density: 0, borderRadius: 0, tone: 0 };
  const weights = { colorTemp: 0, lightness: 0, density: 0, borderRadius: 0, tone: 0 };

  // Q1: product type (primary 0.7, secondary 0.3)
  const primary = answers.productType[0];
  const secondaries = answers.productType.slice(1);
  const primaryVec = CATEGORY_MAP[primary];
  if (primaryVec) {
    for (const [k, v] of Object.entries(primaryVec)) {
      const key = k as keyof DimensionVector;
      accumulator[key] += (v as number) * 0.7;
      weights[key] += 0.7;
    }
  }
  const secWeight = secondaries.length > 0 ? 0.3 / secondaries.length : 0;
  for (const sec of secondaries) {
    const secVec = CATEGORY_MAP[sec];
    if (secVec) {
      for (const [k, v] of Object.entries(secVec)) {
        const key = k as keyof DimensionVector;
        accumulator[key] += (v as number) * secWeight;
        weights[key] += secWeight;
      }
    }
  }

  // Q2: audience
  const audienceVec = AUDIENCE_MAP[answers.audience];
  if (audienceVec) {
    for (const [k, v] of Object.entries(audienceVec)) {
      const key = k as keyof DimensionVector;
      accumulator[key] += (v as number) * 0.5;
      weights[key] += 0.5;
    }
  }

  // Q3: mood
  const moodVec = MOOD_MAP[answers.mood];
  if (moodVec) {
    for (const [k, v] of Object.entries(moodVec)) {
      const key = k as keyof DimensionVector;
      accumulator[key] += (v as number) * 0.6;
      weights[key] += 0.6;
    }
  }

  // Q4: density (direct mapping)
  const densityVal = DENSITY_MAP[answers.density] ?? 3;
  accumulator.density += densityVal * 0.8;
  weights.density += 0.8;

  // Compute weighted average for each dimension
  return {
    colorTemp: clamp(weights.colorTemp > 0 ? accumulator.colorTemp / weights.colorTemp : 3),
    lightness: clamp(weights.lightness > 0 ? accumulator.lightness / weights.lightness : 3),
    density: clamp(weights.density > 0 ? accumulator.density / weights.density : 3),
    borderRadius: clamp(weights.borderRadius > 0 ? accumulator.borderRadius / weights.borderRadius : 3),
    tone: clamp(weights.tone > 0 ? accumulator.tone / weights.tone : 3),
  };
}

function euclideanDistance(a: DimensionVector, b: DimensionVector): number {
  return Math.sqrt(
    (a.colorTemp - b.colorTemp) ** 2 +
      (a.lightness - b.lightness) ** 2 +
      (a.density - b.density) ** 2 +
      (a.borderRadius - b.borderRadius) ** 2 +
      (a.tone - b.tone) ** 2,
  );
}

export function matchArchetype(answers: QuestionnaireAnswers): MatchResult[] {
  const targetVector = deriveVector(answers);
  const archetypes = loadArchetypes();
  const primaryCategory = answers.productType[0];
  const CATEGORY_BONUS = 0.2;

  return archetypes
    .map((archetype) => {
      let distance = euclideanDistance(targetVector, archetype.dimensions);
      if (archetype.category === primaryCategory) {
        distance *= 1 - CATEGORY_BONUS;
      }
      return { archetype, distance };
    })
    .sort((a, b) => a.distance - b.distance);
}
