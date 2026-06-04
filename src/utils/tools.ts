import { exec as execCb } from 'node:child_process';
import { promisify } from 'node:util';

const execShell = promisify(execCb);

const homedir = process.env.HOME || process.env.USERPROFILE || '';
const LOCAL_BIN = `${homedir}/.local/bin`;
const ENV_WITH_LOCAL_BIN = { ...process.env, PATH: `${LOCAL_BIN}:${process.env.PATH}` };

export async function detectCodegraph(): Promise<boolean> {
  try {
    await execShell('codegraph --version', { env: ENV_WITH_LOCAL_BIN });
    return true;
  } catch {
    return false;
  }
}

export async function installCodegraph(): Promise<boolean> {
  if (process.platform === 'win32') {
    return false;
  }
  try {
    await execShell('curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh');
    return true;
  } catch {
    return false;
  }
}

export async function initCodegraph(cwd: string): Promise<boolean> {
  try {
    const env = { ...ENV_WITH_LOCAL_BIN, CI: 'true' };
    await execShell('codegraph init -i', { cwd, env });
    await execShell('codegraph install -y', { cwd, env });
    return true;
  } catch {
    return false;
  }
}

export async function detectOpenspec(): Promise<boolean> {
  try {
    await execShell('openspec --version');
    return true;
  } catch {
    return false;
  }
}

export async function installOpenspec(): Promise<boolean> {
  try {
    await execShell('npm install -g @fission-ai/openspec');
    return true;
  } catch {
    return false;
  }
}

export async function initOpenspec(cwd: string): Promise<boolean> {
  try {
    await execShell('openspec init --tools claude --force', { cwd });
    await configureOpenspecProfile();
    return true;
  } catch {
    return false;
  }
}

async function configureOpenspecProfile(): Promise<void> {
  try {
    await execShell('openspec config set profile custom');
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
