#!/usr/bin/env node
import { Command } from 'commander';
import { collectProjectConfig } from './prompts.js';
import { scaffold } from './scaffolder.js';
import { loadCustomStack } from './stacks/index.js';

const program = new Command();

program
  .name('create-specfuse')
  .description('Scaffold a project with OpenSpec + Superpowers specfuse methodology')
  .version('0.1.0')
  .argument('[project-name]', 'Project directory name (omit to init in current directory)')
  .option('--stack <id>', 'Use a built-in stack (rust, go, typescript-react, python-fastapi)')
  .option('--stack-from <path>', 'Load a custom stack profile from YAML/JSON file')
  .option('-y, --yes', 'Skip confirmation prompts (use defaults)')
  .action(async (projectName: string | undefined, opts: { stack?: string; stackFrom?: string; yes?: boolean }) => {
    try {
      let customStack;
      if (opts.stackFrom) {
        customStack = await loadCustomStack(opts.stackFrom);
      }
      const config = await collectProjectConfig(projectName, opts.stack, customStack, opts.yes);
      await scaffold(config);
    } catch (err) {
      console.error(`\nError: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

program.parse();
