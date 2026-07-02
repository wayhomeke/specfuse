import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ArchetypeSchema } from './schema.js';
import type { Archetype } from './types.js';

const TEMPLATES_DIR = join(import.meta.dirname, 'templates');

export function loadArchetypes(): Archetype[] {
  const files = readdirSync(TEMPLATES_DIR).filter(
    (f) => f.endsWith('.yaml') && !f.startsWith('_'),
  );

  return files.map((f) => {
    const raw = readFileSync(join(TEMPLATES_DIR, f), 'utf-8');
    const parsed = parseYaml(raw);
    const result = ArchetypeSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid archetype ${f}: ${result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      );
    }
    return result.data as Archetype;
  });
}
