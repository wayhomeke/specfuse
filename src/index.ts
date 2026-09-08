#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { collectProjectConfig } from './prompts.js';
import { scaffold } from './scaffolder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

export const program = new Command();

program
  .name('create-specfuse')
  .description('SpecFuse — AI engineering pipeline scaffolder.\n\nInjects OpenSpec workflow + Superpowers discipline into any project.\nThink → Do → FuseReview → Verify, one command at a time.')
  .version(pkg.version)
  .argument('[project-name]', 'Target directory (omit or use "." to init in current directory)')
  .option('-y, --yes', 'Non-interactive mode (use defaults, CI-friendly)')
  .action(async (projectName: string | undefined, opts: { yes?: boolean }) => {
    try {
      const config = await collectProjectConfig(projectName, opts.yes);
      await scaffold(config);
    } catch (err) {
      console.error(`\nError: ${(err as Error).message}\n`);
      process.exit(1);
    }
  });

// Only parse when run as the CLI entrypoint, so tests can import `program`.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMain) {
  program.parse();
}
