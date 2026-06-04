import path from 'node:path';
import { input, select, confirm } from '@inquirer/prompts';
import { getBuiltinStacks } from './stacks/index.js';
import { detectStacks } from './stacks/detect.js';
import type { StackProfile, ProjectConfig } from './types.js';

export async function collectProjectConfig(
  projectNameArg?: string,
  stackArg?: string,
  customStack?: StackProfile,
  skipPrompts?: boolean,
): Promise<ProjectConfig> {
  const isExisting = projectNameArg === undefined || projectNameArg === '.';

  let projectName: string;
  let targetDir: string;

  if (isExisting) {
    targetDir = process.cwd();
    projectName = path.basename(targetDir);
  } else {
    projectName = projectNameArg;
    if (!/^[a-zA-Z0-9_-]+$/.test(projectName)) {
      throw new Error('Project name can only contain letters, digits, hyphens, underscores');
    }
    targetDir = path.join(process.cwd(), projectName);
  }

  let stack: StackProfile;
  if (customStack) {
    stack = customStack;
  } else if (stackArg) {
    const found = getBuiltinStacks().find((s) => s.id === stackArg);
    if (!found) {
      const ids = getBuiltinStacks().map((s) => s.id).join(', ');
      throw new Error(`Unknown stack "${stackArg}". Available: ${ids}`);
    }
    stack = found;
  } else if (skipPrompts) {
    throw new Error('--stack is required with --yes');
  } else if (isExisting) {
    stack = await detectAndSelect(targetDir);
  } else {
    stack = await promptFullStackList();
  }

  const initGit = isExisting
    ? false
    : (skipPrompts ? true : await confirm({ message: 'Initialize git repository?', default: true }));

  const initOpenspec = skipPrompts ? true : await confirm({ message: 'Initialize OpenSpec?', default: true });

  const initCodegraph = skipPrompts ? true : await confirm({ message: 'Enable CodeGraph code knowledge graph?', default: true });

  return { projectName, stack, initGit, initOpenspec, initCodegraph, targetDir, isExisting };
}

async function detectAndSelect(targetDir: string): Promise<StackProfile> {
  const detected = await detectStacks(targetDir);
  const stacks = getBuiltinStacks();

  if (detected.length === 1) {
    const found = stacks.find((s) => s.id === detected[0]);
    if (found) {
      const useDetected = await confirm({ message: `Detected stack: ${found.label}. Use it?`, default: true });
      if (useDetected) return found;
      return promptFullStackList();
    }
  }

  if (detected.length > 1) {
    const detectedStacks = detected
      .map((id) => stacks.find((s) => s.id === id))
      .filter((s): s is StackProfile => !!s);

    const choices = [
      ...detectedStacks.map((s) => ({ name: `${s.label} (detected)`, value: s.id })),
      { name: 'Other...', value: '__other__' },
    ];

    const stackId = await select({ message: 'Detected multiple stacks. Select primary:', choices });

    if (stackId === '__other__') {
      return promptFullStackList();
    }
    return stacks.find((s) => s.id === stackId)!;
  }

  return promptFullStackList();
}

async function promptFullStackList(): Promise<StackProfile> {
  const stacks = getBuiltinStacks();
  const stackId = await select({
    message: 'Tech stack:',
    choices: stacks.map((s) => ({ name: s.label, value: s.id })),
  });
  return stacks.find((s) => s.id === stackId)!;
}
