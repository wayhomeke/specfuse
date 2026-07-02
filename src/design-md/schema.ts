import { z } from 'zod';

const DimensionValueSchema = z.number().int().min(1).max(5);

export const ArchetypeSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  category: z.enum([
    'internal-tool',
    'dashboard',
    'consumer',
    'developer',
    'mobile',
    'e-commerce',
    'marketing',
    'form-heavy',
    'content',
  ]),
  dimensions: z.object({
    colorTemp: DimensionValueSchema,
    lightness: DimensionValueSchema,
    density: DimensionValueSchema,
    borderRadius: DimensionValueSchema,
    tone: DimensionValueSchema,
  }),
  anchors: z.object({
    primary: z.string().min(1),
    auxiliary: z.array(z.string().min(1)).min(1).max(2),
  }),
  template: z.string().min(1),
});
