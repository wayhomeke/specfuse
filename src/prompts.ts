import path from 'node:path';
import { confirm } from '@inquirer/prompts';
import type { ProjectConfig } from './types.js';

export async function collectProjectConfig(
  projectNameArg?: string,
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

  const initGit = isExisting
    ? false
    : (skipPrompts ? true : await confirm({ message: 'Initialize git repository?', default: true }));

  const initOpenspec = skipPrompts ? true : await confirm({ message: 'Initialize OpenSpec?', default: true });

  return { projectName, initGit, initOpenspec, targetDir, isExisting };
}
