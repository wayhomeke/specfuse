import { readFile } from 'node:fs/promises';
import { parse as parseYAML } from 'yaml';
import { stackProfileSchema } from './schema.js';
import { rustStack } from './rust.js';
import { goStack } from './go.js';
import { typescriptReactStack } from './typescript-react.js';
import { pythonFastapiStack } from './python-fastapi.js';
import type { StackProfile } from '../types.js';

const BUILTIN_STACKS: StackProfile[] = [
  rustStack,
  goStack,
  typescriptReactStack,
  pythonFastapiStack,
];

export function getBuiltinStacks(): StackProfile[] {
  return BUILTIN_STACKS;
}

export function getStack(id: string): StackProfile | undefined {
  return BUILTIN_STACKS.find((s) => s.id === id);
}

export async function loadCustomStack(filePath: string): Promise<StackProfile> {
  const raw = await readFile(filePath, 'utf-8');
  const ext = filePath.toLowerCase();

  let data: unknown;
  if (ext.endsWith('.json')) {
    data = JSON.parse(raw);
  } else {
    data = parseYAML(raw);
  }

  const result = stackProfileSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid stack profile in ${filePath}:\n${issues}`);
  }

  return result.data as StackProfile;
}
