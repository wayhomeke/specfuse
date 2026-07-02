import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ArchetypeSchema } from '../schema.js';

const TEMPLATES_DIR = join(import.meta.dirname, '..', 'templates');

function loadArchetypeFiles(): { name: string; content: unknown }[] {
  const files = readdirSync(TEMPLATES_DIR).filter(
    (f) => f.endsWith('.yaml') && !f.startsWith('_'),
  );
  return files.map((f) => ({
    name: f,
    content: parseYaml(readFileSync(join(TEMPLATES_DIR, f), 'utf-8')),
  }));
}

describe('archetype schema validation', () => {
  it('_schema.yaml exists and is valid YAML', () => {
    const raw = readFileSync(join(TEMPLATES_DIR, '_schema.yaml'), 'utf-8');
    const schema = parseYaml(raw);
    expect(schema).toHaveProperty('type', 'object');
    expect(schema).toHaveProperty('required');
  });

  it('all archetype YAML files pass schema validation', () => {
    const archetypes = loadArchetypeFiles();
    for (const { name, content } of archetypes) {
      const result = ArchetypeSchema.safeParse(content);
      if (!result.success) {
        throw new Error(
          `${name} failed validation: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
        );
      }
    }
  });

  it('rejects archetype with missing required field', () => {
    const invalid = { id: 'test', name: 'Test' };
    const result = ArchetypeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects dimension value out of range', () => {
    const invalid = {
      id: 'test',
      name: 'Test',
      category: 'dashboard',
      dimensions: { colorTemp: 6, lightness: 1, density: 1, borderRadius: 1, tone: 1 },
      anchors: { primary: 'X', auxiliary: ['Y'] },
      template: 'x',
    };
    const result = ArchetypeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const invalid = {
      id: 'test',
      name: 'Test',
      category: 'unknown-category',
      dimensions: { colorTemp: 1, lightness: 1, density: 1, borderRadius: 1, tone: 1 },
      anchors: { primary: 'X', auxiliary: ['Y'] },
      template: 'x',
    };
    const result = ArchetypeSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
