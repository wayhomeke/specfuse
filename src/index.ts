#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { collectProjectConfig } from './prompts.js';
import { scaffold } from './scaffolder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

export const program = new Command();

program
  .name('create-specfuse')
  .description('SpecFuse — AI engineering pipeline scaffolder.\n\nInjects OpenSpec workflow + Superpowers discipline into any project.\nThink → Do → FuseReview → FuseQA → Verify, one command at a time.')
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
// npm/npx invoke this file through a symlink (node_modules/.bin/create-specfuse),
// so argv[1] must be realpath'd before comparison — comparing the raw path makes
// every symlinked invocation look like an import and the CLI silently no-ops.
function isEntrypoint(): boolean {
  const invoked = process.argv[1];
  if (!invoked) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(resolve(invoked));
  } catch {
    return false;
  }
}

if (isEntrypoint()) {
  program.parse();
}
