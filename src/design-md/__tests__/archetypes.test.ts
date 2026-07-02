import { describe, it, expect } from 'vitest';
import { loadArchetypes } from '../archetypes.js';
import type { Archetype } from '../types.js';

describe('loadArchetypes()', () => {
  it('returns exactly 15 archetypes', () => {
    const archetypes = loadArchetypes();
    expect(archetypes).toHaveLength(15);
  });

  it('each archetype has valid structure', () => {
    const archetypes = loadArchetypes();
    for (const a of archetypes) {
      expect(a.id).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(a.name).toBeTruthy();
      expect(a.dimensions.colorTemp).toBeGreaterThanOrEqual(1);
      expect(a.dimensions.colorTemp).toBeLessThanOrEqual(5);
      expect(a.anchors.primary).toBeTruthy();
      expect(a.anchors.auxiliary.length).toBeGreaterThanOrEqual(1);
      expect(a.anchors.auxiliary.length).toBeLessThanOrEqual(2);
      expect(a.template).toBeTruthy();
    }
  });

  it('covers all 9 categories', () => {
    const archetypes = loadArchetypes();
    const categories = new Set(archetypes.map((a) => a.category));
    expect(categories).toContain('internal-tool');
    expect(categories).toContain('dashboard');
    expect(categories).toContain('consumer');
    expect(categories).toContain('developer');
    expect(categories).toContain('mobile');
    expect(categories).toContain('e-commerce');
    expect(categories).toContain('marketing');
    expect(categories).toContain('form-heavy');
    expect(categories).toContain('content');
  });

  it('all archetype ids are unique', () => {
    const archetypes = loadArchetypes();
    const ids = archetypes.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('returns typed Archetype objects', () => {
    const archetypes = loadArchetypes();
    const first: Archetype = archetypes[0];
    expect(first).toBeDefined();
  });
});
