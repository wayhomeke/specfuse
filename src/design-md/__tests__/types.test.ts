import { describe, it, expectTypeOf } from 'vitest';
import type {
  DimensionVector,
  Archetype,
  QuestionnaireAnswers,
  DesignMdConfig,
  ArchetypeCategory,
} from '../types.js';

describe('DimensionVector type constraints', () => {
  it('accepts valid dimension values (1-5)', () => {
    const v: DimensionVector = {
      colorTemp: 1,
      lightness: 2,
      density: 3,
      borderRadius: 4,
      tone: 5,
    };
    expectTypeOf(v.colorTemp).toEqualTypeOf<1 | 2 | 3 | 4 | 5>();
    expectTypeOf(v.lightness).toEqualTypeOf<1 | 2 | 3 | 4 | 5>();
    expectTypeOf(v.density).toEqualTypeOf<1 | 2 | 3 | 4 | 5>();
    expectTypeOf(v.borderRadius).toEqualTypeOf<1 | 2 | 3 | 4 | 5>();
    expectTypeOf(v.tone).toEqualTypeOf<1 | 2 | 3 | 4 | 5>();
  });

  it('has exactly 5 dimension keys', () => {
    expectTypeOf<keyof DimensionVector>().toEqualTypeOf<
      'colorTemp' | 'lightness' | 'density' | 'borderRadius' | 'tone'
    >();
  });
});

describe('ArchetypeCategory type constraints', () => {
  it('is an exhaustive union of 9 categories', () => {
    expectTypeOf<ArchetypeCategory>().toEqualTypeOf<
      | 'internal-tool'
      | 'dashboard'
      | 'consumer'
      | 'developer'
      | 'mobile'
      | 'e-commerce'
      | 'marketing'
      | 'form-heavy'
      | 'content'
    >();
  });
});

describe('Archetype type structure', () => {
  it('has required fields with correct types', () => {
    expectTypeOf<Archetype>().toHaveProperty('id');
    expectTypeOf<Archetype>().toHaveProperty('name');
    expectTypeOf<Archetype>().toHaveProperty('category');
    expectTypeOf<Archetype>().toHaveProperty('dimensions');
    expectTypeOf<Archetype>().toHaveProperty('anchors');
    expectTypeOf<Archetype>().toHaveProperty('template');

    expectTypeOf<Archetype['id']>().toBeString();
    expectTypeOf<Archetype['name']>().toBeString();
    expectTypeOf<Archetype['category']>().toEqualTypeOf<ArchetypeCategory>();
    expectTypeOf<Archetype['dimensions']>().toEqualTypeOf<DimensionVector>();
    expectTypeOf<Archetype['template']>().toBeString();
  });

  it('anchors has primary and auxiliary fields', () => {
    expectTypeOf<Archetype['anchors']>().toEqualTypeOf<{
      primary: string;
      auxiliary: string[];
    }>();
  });
});

describe('QuestionnaireAnswers type structure', () => {
  it('has correct field types', () => {
    expectTypeOf<QuestionnaireAnswers['productType']>().toEqualTypeOf<string[]>();
    expectTypeOf<QuestionnaireAnswers['audience']>().toBeString();
    expectTypeOf<QuestionnaireAnswers['mood']>().toBeString();
    expectTypeOf<QuestionnaireAnswers['density']>().toBeString();
    expectTypeOf<QuestionnaireAnswers['reference']>().toEqualTypeOf<string | null>();
  });
});

describe('DesignMdConfig type structure', () => {
  it('has archetype and vector fields', () => {
    expectTypeOf<DesignMdConfig>().toHaveProperty('archetype');
    expectTypeOf<DesignMdConfig>().toHaveProperty('finalVector');
    expectTypeOf<DesignMdConfig>().toHaveProperty('answers');

    expectTypeOf<DesignMdConfig['archetype']>().toEqualTypeOf<Archetype>();
    expectTypeOf<DesignMdConfig['finalVector']>().toEqualTypeOf<DimensionVector>();
    expectTypeOf<DesignMdConfig['answers']>().toEqualTypeOf<QuestionnaireAnswers>();
  });
});
