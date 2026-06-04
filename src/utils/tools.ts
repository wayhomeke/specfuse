import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export async function detectCodegraph(): Promise<boolean> {
  try {
    await exec('codegraph', ['--version']);
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
    await exec('sh', ['-c', 'curl -fsSL https://raw.githubusercontent.com/colbymchenry/codegraph/main/install.sh | sh']);
    return true;
  } catch {
    return false;
  }
}

export async function initCodegraph(cwd: string): Promise<boolean> {
  try {
    await exec('codegraph', ['init', '-i'], { cwd });
    await exec('codegraph', ['install', '-y'], { cwd });
    return true;
  } catch {
    return false;
  }
}

export async function detectOpenspec(): Promise<boolean> {
  try {
    await exec('openspec', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function installOpenspec(): Promise<boolean> {
  try {
    await exec('npm', ['install', '-g', '@fission-ai/openspec']);
    return true;
  } catch {
    return false;
  }
}

export async function initOpenspec(cwd: string): Promise<boolean> {
  try {
    await exec('openspec', ['init', '--tools', 'claude', '--force'], { cwd });
    await configureOpenspecProfile();
    return true;
  } catch {
    return false;
  }
}

async function configureOpenspecProfile(): Promise<void> {
  try {
    await exec('openspec', ['config', 'set', 'profile', 'custom']);
    const workflows = ['propose', 'explore', 'new', 'continue', 'apply', 'ff', 'sync', 'archive', 'bulk-archive', 'verify', 'onboard'];
    const { readFileSync, writeFileSync } = await import('node:fs');
    const { execSync } = await import('node:child_process');
    const configPath = execSync('openspec config path', { encoding: 'utf-8' }).trim();
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    config.workflows = workflows;
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  } catch {
    // non-fatal: profile config is a convenience, not a requirement
  }
}
