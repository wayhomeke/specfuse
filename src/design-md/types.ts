export type DimensionValue = 1 | 2 | 3 | 4 | 5;

export interface DimensionVector {
  colorTemp: DimensionValue;
  lightness: DimensionValue;
  density: DimensionValue;
  borderRadius: DimensionValue;
  tone: DimensionValue;
}

export type ArchetypeCategory =
  | 'internal-tool'
  | 'dashboard'
  | 'consumer'
  | 'developer'
  | 'mobile'
  | 'e-commerce'
  | 'marketing'
  | 'form-heavy'
  | 'content';

export interface Archetype {
  id: string;
  name: string;
  category: ArchetypeCategory;
  dimensions: DimensionVector;
  anchors: { primary: string; auxiliary: string[] };
  template: string;
}

export interface QuestionnaireAnswers {
  productType: string[];
  audience: string;
  mood: string;
  density: string;
  reference: string | null;
}

export interface DesignMdConfig {
  archetype: Archetype;
  finalVector: DimensionVector;
  answers: QuestionnaireAnswers;
}
