#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { collectProjectConfig } from './prompts.js';
import { scaffold } from './scaffolder.js';
import { loadCustomStack } from './stacks/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

const program = new Command();

program
  .name('create-specfuse')
  .description('SpecFuse — AI engineering pipeline scaffolder.\n\nInjects OpenSpec workflow + Superpowers discipline into any project.\nThink → Grill → Do → Verify, one command at a time.')
  .version(pkg.version)
  .argument('[project-name]', 'Target directory (omit or use "." to init in current directory)')
  .option('--stack <id>', 'Built-in stack: rust, go, typescript-react, python-fastapi, bash, java-maven, java-gradle, cpp-cmake, ruby, php, kotlin, swift, elixir, scala-sbt, dotnet')
  .option('--stack-from <path>', 'Custom stack profile (YAML/JSON)')
  .option('-y, --yes', 'Non-interactive mode (use defaults, CI-friendly)')
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
