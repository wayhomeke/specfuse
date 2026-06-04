import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);

export async function detectCodegraph(): Promise<boolean> {
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    await exec(cmd, ['codegraph']);
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
    await exec('codegraph', ['install'], { cwd });
    return true;
  } catch {
    return false;
  }
}

export async function detectOpenspec(): Promise<boolean> {
  try {
    const cmd = process.platform === 'win32' ? 'where' : 'which';
    await exec(cmd, ['openspec']);
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
    return true;
  } catch {
    return false;
  }
}
