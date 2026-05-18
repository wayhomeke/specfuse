import path from 'node:path';
import { input, select, confirm } from '@inquirer/prompts';
import { getBuiltinStacks } from './stacks/index.js';
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
  } else {
    const stacks = getBuiltinStacks();
    const stackId = await select({
      message: 'Tech stack:',
      choices: stacks.map((s) => ({ name: s.label, value: s.id })),
    });
    stack = stacks.find((s) => s.id === stackId)!;
  }

  const initGit = isExisting
    ? false
    : (skipPrompts ? true : await confirm({ message: 'Initialize git repository?', default: true }));

  const initOpenspec = skipPrompts ? true : await confirm({ message: 'Initialize OpenSpec?', default: true });

  return { projectName, stack, initGit, initOpenspec, targetDir, isExisting };
}
