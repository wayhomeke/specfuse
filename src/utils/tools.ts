import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const execShell = promisify(execCb);

/**
 * Scaffolding runs these tools as non-interactive children: stdin is a pipe
 * nobody ever writes to. A child that stops to ask a question would wait on
 * that pipe forever, and the prompt itself is swallowed by exec's buffering —
 * the user sees a frozen terminal with no explanation.
 *
 * Two layers guard against that:
 *  - `stdio: ['ignore', ...]` hands the child a closed stdin (EOF) rather than
 *    an open pipe, so well-behaved prompts abort instead of blocking.
 *  - `timeout` + SIGKILL bounds anything that ignores EOF anyway (clack does),
 *    turning a permanent hang into a recoverable failure the caller reports.
 */
const NONINTERACTIVE = {
  stdio: ['ignore', 'pipe', 'pipe'] as const,
  killSignal: 'SIGKILL' as const,
};

const PROBE_TIMEOUT_MS = 15_000;
const INSTALL_TIMEOUT_MS = 300_000;
const INIT_TIMEOUT_MS = 600_000;

function opts(timeout: number, extra: Record<string, unknown> = {}) {
  return { ...NONINTERACTIVE, timeout, ...extra };
}

export async function detectOpenspec(): Promise<boolean> {
  try {
    await execShell('openspec --version', opts(PROBE_TIMEOUT_MS));
    return true;
  } catch {
    return false;
  }
}

export async function installOpenspec(): Promise<boolean> {
  try {
    await execShell('npm install -g @fission-ai/openspec', opts(INSTALL_TIMEOUT_MS));
    return true;
  } catch {
    return false;
  }
}

export async function initOpenspec(cwd: string): Promise<boolean> {
  try {
    await execShell('openspec init --tools claude --force', opts(INIT_TIMEOUT_MS, { cwd }));
    await configureOpenspecProfile();
    return true;
  } catch {
    return false;
  }
}

async function configureOpenspecProfile(): Promise<void> {
  try {
    await execShell('openspec config set profile custom', opts(PROBE_TIMEOUT_MS));
    const workflows = ['propose', 'explore', 'new', 'continue', 'apply', 'ff', 'sync', 'archive', 'bulk-archive', 'verify', 'onboard'];
    const { readFileSync, writeFileSync } = await import('node:fs');
    const { execSync } = await import('node:child_process');
    const configPath = execSync('openspec config path', { encoding: 'utf-8' }).trim();
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    config.workflows = workflows;
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  } catch {
    // non-fatal
  }
}
