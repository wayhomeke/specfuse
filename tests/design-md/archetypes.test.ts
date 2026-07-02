import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const TEMPLATES_DIR = path.resolve('src/design-md/templates');
const SCHEMA_PATH = path.join(TEMPLATES_DIR, '_schema.yaml');

function loadSchema() {
  return YAML.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
}

function getArchetypeFiles(): string[] {
  return readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith('.yaml') && !f.startsWith('_'))
    .sort();
}

function loadArchetype(filename: string) {
  return YAML.parse(readFileSync(path.join(TEMPLATES_DIR, filename), 'utf-8'));
}

describe('archetype YAML files validate against v2 schema', () => {
  const schema = loadSchema();
  const files = getArchetypeFiles();

  it('has exactly 16 archetype files', () => {
    expect(files).toHaveLength(16);
  });

  it('covers all category enum values at least once', () => {
    const categories = new Set(files.map((f) => loadArchetype(f).category));
    for (const cat of schema.properties.category.enum) {
      expect(categories).toContain(cat);
    }
  });

  it('all archetypes have unique kebab-case ids', () => {
    const ids = files.map((f) => loadArchetype(f).id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
    }
  });

  describe.each(getArchetypeFiles())('%s', (filename) => {
    const archetype = loadArchetype(filename);

    it('has all v2 required top-level keys', () => {
      for (const key of schema.required) {
        expect(archetype).toHaveProperty(key);
      }
    });

    it('intent has mood, density, philosophy as strings', () => {
      expect(typeof archetype.intent.mood).toBe('string');
      expect(typeof archetype.intent.density).toBe('string');
      expect(typeof archetype.intent.philosophy).toBe('string');
    });

    it('dimensions are integers 1-5', () => {
      for (const key of ['colorTemp', 'lightness', 'density', 'borderRadius', 'tone']) {
        const val = archetype.dimensions[key];
        expect(val).toBeGreaterThanOrEqual(1);
        expect(val).toBeLessThanOrEqual(5);
        expect(Number.isInteger(val)).toBe(true);
      }
    });

    it('anchors.colors.primary is valid hex', () => {
      expect(archetype.anchors.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('anchors.colors.auxiliary is array of 1-2 valid hex', () => {
      const aux = archetype.anchors.colors.auxiliary;
      expect(aux.length).toBeGreaterThanOrEqual(1);
      expect(aux.length).toBeLessThanOrEqual(2);
      for (const color of aux) {
        expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    });

    it('anchors.typography.baseSize is valid px', () => {
      expect(archetype.anchors.typography.baseSize).toMatch(/^\d+px$/);
    });

    it('anchors.typography.scale is between 1.0 and 2.0 exclusive', () => {
      const scale = archetype.anchors.typography.scale;
      expect(scale).toBeGreaterThan(1.0);
      expect(scale).toBeLessThan(2.0);
    });

    it('anchors.spacing.unit is valid px', () => {
      expect(archetype.anchors.spacing.unit).toMatch(/^\d+px$/);
    });

    it('anchors.radius.base is valid px', () => {
      expect(archetype.anchors.radius.base).toMatch(/^\d+px$/);
    });

    it('structure has requiredSections and componentTokens arrays', () => {
      expect(Array.isArray(archetype.structure.requiredSections)).toBe(true);
      expect(archetype.structure.requiredSections.length).toBeGreaterThan(0);
      expect(Array.isArray(archetype.structure.componentTokens)).toBe(true);
      expect(archetype.structure.componentTokens.length).toBeGreaterThan(0);
    });
  });
});
