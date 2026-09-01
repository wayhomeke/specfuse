import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { execFile } from 'node:child_process';
import { getBuiltinStacks } from '../src/stacks/index.js';
import type { ProjectConfig } from '../src/types.js';

// Mock the subprocess layer itself — NOT src/utils/tools.js — so the spawned
// command strings are observable. Mocking tools.js would make any assertion
// about CodeGraph vacuous: it would restate the mock, never the real module.
vi.mock('node:child_process', () => ({
  exec: vi.fn((_cmd: any, _opts: any, cb?: any) => {
    const callback = cb || _opts;
    if (typeof callback === 'function') callback(new Error('not installed'), '', '');
    return {} as any;
  }),
  execFile: vi.fn((_cmd: any, _args: any, _opts: any, cb?: any) => {
    const callback = cb || _opts || _args;
    if (typeof callback === 'function') callback(null, '', '');
    return {} as any;
  }),
  execSync: vi.fn().mockReturnValue('/tmp/fake-config.json'),
}));

describe('scaffold spawns no CodeGraph subprocess', () => {
  let tmpDir: string;

  beforeEach(() => {
    vi.clearAllMocks();
    tmpDir = path.join(os.tmpdir(), `fusion-nocg-${Date.now()}`);
  });

  afterEach(() => {
    if (existsSync(tmpDir)) rmSync(tmpDir, { recursive: true, force: true });
  });

  it('never spawns codegraph and never contacts the install URL', async () => {
    const { scaffold } = await import('../src/scaffolder.js');

    const config: ProjectConfig = {
      projectName: 'test-project',
      stack: getBuiltinStacks()[0],
      initGit: true,
      initOpenspec: true,
      targetDir: tmpDir,
      isExisting: false,
    } as ProjectConfig;

    await scaffold(config);

    const spawned = [
      ...vi.mocked(exec).mock.calls.map((c: any) => String(c[0])),
      ...vi.mocked(execFile).mock.calls.map((c: any) => `${c[0]} ${(c[1] ?? []).join(' ')}`),
    ];

    // The scaffold must actually have spawned something, or this proves nothing.
    expect(spawned.length).toBeGreaterThan(0);
    for (const cmd of spawned) {
      expect(cmd).not.toContain('codegraph');
      expect(cmd).not.toContain('raw.githubusercontent.com/colbymchenry/codegraph');
    }
  });
});
