import type { QuestionnaireAnswers } from './types.js';

export interface QuestionChoice {
  value: string;
  name: string;
}

export interface QuestionDefinition {
  id: keyof QuestionnaireAnswers | 'productType' | 'audience' | 'mood' | 'density' | 'reference';
  type: 'checkbox' | 'select' | 'input';
  message: string;
  choices: QuestionChoice[];
  required: boolean;
}

export const QUESTIONS: QuestionDefinition[] = [
  {
    id: 'productType',
    type: 'checkbox',
    message: 'What type of product are you building? (first = primary, rest = secondary)',
    required: true,
    choices: [
      { value: 'internal-tool', name: 'Internal Tool' },
      { value: 'dashboard', name: 'Dashboard / Analytics' },
      { value: 'consumer', name: 'Consumer App' },
      { value: 'developer', name: 'Developer Tool / API' },
      { value: 'mobile', name: 'Mobile App' },
      { value: 'e-commerce', name: 'E-Commerce' },
      { value: 'marketing', name: 'Marketing / Landing' },
      { value: 'form-heavy', name: 'Form-Heavy / Workflow' },
      { value: 'content', name: 'Content / Documentation' },
    ],
  },
  {
    id: 'audience',
    type: 'select',
    message: 'Who is the primary audience?',
    required: true,
    choices: [
      { value: 'developers', name: 'Developers / Engineers' },
      { value: 'business', name: 'Business Users / Analysts' },
      { value: 'general', name: 'General Public' },
      { value: 'designers', name: 'Designers / Creatives' },
      { value: 'enterprise', name: 'Enterprise / Compliance-sensitive' },
    ],
  },
  {
    id: 'mood',
    type: 'checkbox',
    message: 'Select mood keywords that describe the feel you want:',
    required: true,
    choices: [
      { value: 'clean', name: 'Clean / Minimal' },
      { value: 'playful', name: 'Playful / Fun' },
      { value: 'serious', name: 'Serious / Professional' },
      { value: 'warm', name: 'Warm / Friendly' },
      { value: 'bold', name: 'Bold / Energetic' },
      { value: 'calm', name: 'Calm / Neutral' },
      { value: 'dark', name: 'Dark / Techy' },
      { value: 'luxurious', name: 'Luxurious / Premium' },
    ],
  },
  {
    id: 'density',
    type: 'select',
    message: 'How dense should the interface be?',
    required: true,
    choices: [
      { value: 'compact', name: 'Compact — dense tables, small spacing' },
      { value: 'balanced', name: 'Balanced — moderate spacing' },
      { value: 'spacious', name: 'Spacious — generous whitespace' },
    ],
  },
  {
    id: 'reference',
    type: 'input',
    message: 'Any reference product or site for style inspiration? (optional, press Enter to skip)',
    required: false,
    choices: [],
  },
];

export async function runQuestionnaire(): Promise<QuestionnaireAnswers> {
  const { checkbox, select, input } = await import('@inquirer/prompts');

  const productType = await checkbox({
    message: QUESTIONS[0].message,
    choices: QUESTIONS[0].choices,
  });

  const audience = await select({
    message: QUESTIONS[1].message,
    choices: QUESTIONS[1].choices,
  });

  const mood = await select({
    message: QUESTIONS[2].message,
    choices: QUESTIONS[2].choices,
  });

  const density = await select({
    message: QUESTIONS[3].message,
    choices: QUESTIONS[3].choices,
  });

  const reference = await input({
    message: QUESTIONS[4].message,
  });

  return {
    productType,
    audience,
    mood,
    density,
    reference: reference || null,
  };
}
