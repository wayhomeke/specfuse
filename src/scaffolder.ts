import path from 'node:path';
import { access } from 'node:fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import type { ProjectConfig } from './types.js';
import { composeGitignore } from './templates/gitignore.js';
import { composeClaudeSettings } from './templates/claude-settings.js';
import { composeOpenspecConfig } from './templates/openspec-config.js';
import { composeCLAUDEmd } from './templates/claude-md.js';
import { createDir, writeText, writeJSON, writeYAML } from './utils/fs.js';
import { gitInit, gitInitialCommit, tryOpenspecInit } from './utils/git.js';

async function dirExists(dir: string): Promise<boolean> {
  try {
    await access(dir);
    return true;
  } catch {
    return false;
  }
}

export async function scaffold(config: ProjectConfig): Promise<void> {
  const { targetDir, stack, projectName } = config;
  const ctx = { projectName, stack };

  if (await dirExists(targetDir)) {
    throw new Error(`Directory "${targetDir}" already exists.`);
  }

  const spinner = ora('Scaffolding project...').start();

  await createDir(targetDir);

  spinner.text = 'Writing .gitignore...';
  await writeText(path.join(targetDir, '.gitignore'), composeGitignore(stack));

  spinner.text = 'Writing CLAUDE.md...';
  await writeText(path.join(targetDir, 'CLAUDE.md'), composeCLAUDEmd(ctx));

  spinner.text = 'Writing .claude/settings.local.json...';
  await writeJSON(
    path.join(targetDir, '.claude', 'settings.local.json'),
    composeClaudeSettings(stack),
  );

  if (config.initOpenspec) {
    spinner.text = 'Setting up OpenSpec...';
    await createDir(path.join(targetDir, 'openspec', 'specs'));
    await createDir(path.join(targetDir, 'openspec', 'changes', 'archive'));
    await writeYAML(
      path.join(targetDir, 'openspec', 'config.yaml'),
      composeOpenspecConfig(ctx),
    );
  }

  if (config.initGit) {
    spinner.text = 'Initializing git...';
    await gitInit(targetDir);
    await gitInitialCommit(targetDir);
  }

  if (config.initOpenspec) {
    spinner.text = 'Installing OpenSpec skills...';
    const ok = await tryOpenspecInit(targetDir);
    if (!ok) {
      spinner.warn(
        'OpenSpec CLI not found. Install it to enable skills: npm i -g @fission-ai/openspec && cd ' +
          projectName +
          ' && openspec init',
      );
    }
  }

  spinner.succeed('Project scaffolded!');

  console.log('');
  console.log(chalk.bold(`  ${projectName}/`));
  console.log(`    CLAUDE.md                         ${chalk.dim('Bridge declaration')}`);
  console.log(`    .gitignore                        ${chalk.dim(stack.label + ' patterns')}`);
  console.log(`    .claude/settings.local.json       ${chalk.dim('Permissions')}`);
  if (config.initOpenspec) {
    console.log(`    openspec/config.yaml              ${chalk.dim('Spec-driven config')}`);
  }
  console.log('');
  console.log(chalk.bold('  Next steps:'));
  console.log(`    cd ${projectName}`);
  console.log('    claude');
  console.log('    /opsx:propose   # start your first change');
  console.log('');
}
