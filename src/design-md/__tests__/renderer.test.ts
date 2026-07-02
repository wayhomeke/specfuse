import { describe, it, expect } from 'vitest';
import { renderDesignMd } from '../renderer.js';
import { loadArchetypes } from '../archetypes.js';
import type { DimensionVector } from '../types.js';
import { parse as parseYaml } from 'yaml';

const archetypes = loadArchetypes();
const testArchetype = archetypes[0];
const testVector: DimensionVector = { colorTemp: 2, lightness: 3, density: 2, borderRadius: 3, tone: 2 };

describe('renderDesignMd()', () => {
  it('output starts and ends YAML front matter with --- delimiters', () => {
    const output = renderDesignMd(testArchetype, testVector);
    const lines = output.split('\n');
    expect(lines[0]).toBe('---');
    const secondDelimiter = lines.indexOf('---', 1);
    expect(secondDelimiter).toBeGreaterThan(1);
  });

  it('YAML front matter contains tokens key', () => {
    const output = renderDesignMd(testArchetype, testVector);
    const yamlBlock = output.split('---')[1];
    const parsed = parseYaml(yamlBlock);
    expect(parsed).toHaveProperty('tokens');
  });

  it('YAML front matter contains archetype metadata', () => {
    const output = renderDesignMd(testArchetype, testVector);
    const yamlBlock = output.split('---')[1];
    const parsed = parseYaml(yamlBlock);
    expect(parsed).toHaveProperty('archetype');
    expect(parsed.archetype).toBe(testArchetype.id);
  });

  it('YAML front matter contains dimensions', () => {
    const output = renderDesignMd(testArchetype, testVector);
    const yamlBlock = output.split('---')[1];
    const parsed = parseYaml(yamlBlock);
    expect(parsed).toHaveProperty('dimensions');
    expect(parsed.dimensions).toEqual(testVector);
  });

  it('markdown body contains required sections', () => {
    const output = renderDesignMd(testArchetype, testVector);
    const parts = output.split('---');
    const markdown = parts.slice(2).join('---');
    expect(markdown).toContain('# Style Direction');
    expect(markdown).toContain('## Color Palette');
    expect(markdown).toContain('## Typography');
    expect(markdown).toContain('## Spacing');
    expect(markdown).toContain('## Components');
  });

  it('output is valid non-empty string', () => {
    const output = renderDesignMd(testArchetype, testVector);
    expect(output.length).toBeGreaterThan(100);
  });
});
