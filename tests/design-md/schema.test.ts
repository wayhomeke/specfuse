import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const SCHEMA_PATH = path.resolve('src/design-md/templates/_schema.yaml');

function loadSchema() {
  return YAML.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
}

describe('_schema.yaml v2 hybrid seed format', () => {
  it('defines all v2 required top-level properties', () => {
    const schema = loadSchema();
    expect(schema.required).toEqual(
      expect.arrayContaining(['id', 'name', 'category', 'intent', 'dimensions', 'anchors', 'structure']),
    );
  });

  it('defines intent section with mood, density, philosophy', () => {
    const schema = loadSchema();
    const intent = schema.properties.intent;
    expect(intent.type).toBe('object');
    expect(intent.required).toEqual(expect.arrayContaining(['mood', 'density', 'philosophy']));
    expect(intent.properties.mood.type).toBe('string');
    expect(intent.properties.density.type).toBe('string');
    expect(intent.properties.philosophy.type).toBe('string');
  });

  it('defines dimensions with 1-5 integer scale for all 5 axes', () => {
    const schema = loadSchema();
    const dims = schema.properties.dimensions;
    expect(dims.required).toEqual(
      expect.arrayContaining(['colorTemp', 'lightness', 'density', 'borderRadius', 'tone']),
    );
    for (const key of ['colorTemp', 'lightness', 'density', 'borderRadius', 'tone']) {
      expect(dims.properties[key].type).toBe('integer');
      expect(dims.properties[key].minimum).toBe(1);
      expect(dims.properties[key].maximum).toBe(5);
    }
  });

  it('defines expanded anchors with colors, typography, spacing, radius', () => {
    const schema = loadSchema();
    const anchors = schema.properties.anchors;
    expect(anchors.type).toBe('object');
    expect(anchors.required).toEqual(
      expect.arrayContaining(['colors', 'typography', 'spacing', 'radius']),
    );

    const colors = anchors.properties.colors;
    expect(colors.properties.primary).toBeDefined();
    expect(colors.properties.auxiliary).toBeDefined();

    const typo = anchors.properties.typography;
    expect(typo.properties.baseSize).toBeDefined();
    expect(typo.properties.scale).toBeDefined();

    const spacing = anchors.properties.spacing;
    expect(spacing.properties.unit).toBeDefined();

    const radius = anchors.properties.radius;
    expect(radius.properties.base).toBeDefined();
  });

  it('defines colors.primary as hex pattern and auxiliary as array of hex', () => {
    const schema = loadSchema();
    const colors = schema.properties.anchors.properties.colors;
    expect(colors.properties.primary.pattern).toMatch(/\^#/);
    expect(colors.properties.auxiliary.items.pattern).toMatch(/\^#/);
  });

  it('defines typography.scale as number between 1.0 and 2.0', () => {
    const schema = loadSchema();
    const scale = schema.properties.anchors.properties.typography.properties.scale;
    expect(scale.type).toBe('number');
    expect(scale.exclusiveMinimum).toBe(1.0);
    expect(scale.exclusiveMaximum).toBe(2.0);
  });

  it('defines structure section with requiredSections and componentTokens', () => {
    const schema = loadSchema();
    const structure = schema.properties.structure;
    expect(structure.type).toBe('object');
    expect(structure.required).toEqual(
      expect.arrayContaining(['requiredSections', 'componentTokens']),
    );
    expect(structure.properties.requiredSections.type).toBe('array');
    expect(structure.properties.componentTokens.type).toBe('array');
  });

  it('no longer requires template field (v1 legacy removed)', () => {
    const schema = loadSchema();
    expect(schema.required).not.toContain('template');
    expect(schema.properties.template).toBeUndefined();
  });
});
