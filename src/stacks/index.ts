import { readFile } from 'node:fs/promises';
import { parse as parseYAML } from 'yaml';
import { stackProfileSchema } from './schema.js';
import { rustStack, rustDetectionConfig } from './rust.js';
import { goStack, goDetectionConfig } from './go.js';
import { typescriptReactStack, typescriptReactDetectionConfig } from './typescript-react.js';
import { pythonFastapiStack, pythonFastapiDetectionConfig } from './python-fastapi.js';
import { bashStack, bashDetectionConfig } from './bash.js';
import { javaMavenStack, javaMavenDetectionConfig } from './java-maven.js';
import { javaGradleStack, javaGradleDetectionConfig } from './java-gradle.js';
import { cppCmakeStack, cppCmakeDetectionConfig } from './cpp-cmake.js';
import { rubyStack, rubyDetectionConfig } from './ruby.js';
import { phpStack, phpDetectionConfig } from './php.js';
import { kotlinStack, kotlinDetectionConfig } from './kotlin.js';
import { swiftStack, swiftDetectionConfig } from './swift.js';
import { elixirStack, elixirDetectionConfig } from './elixir.js';
import { scalaSbtStack, scalaSbtDetectionConfig } from './scala-sbt.js';
import { dotnetStack, dotnetDetectionConfig } from './dotnet.js';
import type { StackProfile } from '../types.js';
import { registerDetectionConfigs } from './detect.js';
import type { DetectionConfig } from './detect.js';

const BUILTIN_STACKS: StackProfile[] = [
  rustStack,
  goStack,
  typescriptReactStack,
  pythonFastapiStack,
  bashStack,
  javaMavenStack,
  javaGradleStack,
  cppCmakeStack,
  rubyStack,
  phpStack,
  kotlinStack,
  swiftStack,
  elixirStack,
  scalaSbtStack,
  dotnetStack,
];

const DETECTION_CONFIGS: DetectionConfig[] = [
  rustDetectionConfig,
  goDetectionConfig,
  typescriptReactDetectionConfig,
  pythonFastapiDetectionConfig,
  bashDetectionConfig,
  javaMavenDetectionConfig,
  javaGradleDetectionConfig,
  cppCmakeDetectionConfig,
  rubyDetectionConfig,
  phpDetectionConfig,
  kotlinDetectionConfig,
  swiftDetectionConfig,
  elixirDetectionConfig,
  scalaSbtDetectionConfig,
  dotnetDetectionConfig,
];

// Register detection configs at module load time
registerDetectionConfigs(DETECTION_CONFIGS);

export function getBuiltinStacks(): StackProfile[] {
  return BUILTIN_STACKS;
}

export function getStack(id: string): StackProfile | undefined {
  return BUILTIN_STACKS.find((s) => s.id === id);
}

export function getDetectionConfigs(): DetectionConfig[] {
  return DETECTION_CONFIGS;
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
