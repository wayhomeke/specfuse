import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exec } from 'node:child_process';

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn().mockReturnValue('/tmp/fake-config.json'),
}));

const mockExec = vi.mocked(exec);

function mockExecSuccess(stdout = '') {
  mockExec.mockImplementation((_cmd: any, _opts: any, cb?: any) => {
    const callback = cb || _opts;
    if (typeof callback === 'function') {
      callback(null, stdout, '');
    }
    return {} as any;
  });
}

function mockExecFailure(message = 'not found') {
  mockExec.mockImplementation((_cmd: any, _opts: any, cb?: any) => {
    const callback = cb || _opts;
    if (typeof callback === 'function') {
      callback(new Error(message), '', '');
    }
    return {} as any;
  });
}

describe('detectCodegraph', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('returns true when codegraph is available', async () => {
    mockExecSuccess('0.9.9');
    const { detectCodegraph } = await import('../../src/utils/tools.js');
    const result = await detectCodegraph();
    expect(result).toBe(true);
  });

  it('returns false when codegraph is not available', async () => {
    mockExecFailure('not found');
    const { detectCodegraph } = await import('../../src/utils/tools.js');
    const result = await detectCodegraph();
    expect(result).toBe(false);
  });

  it('returns false when codegraph execution fails', async () => {
    mockExecFailure('command not found');
    const { detectCodegraph } = await import('../../src/utils/tools.js');
    const result = await detectCodegraph();
    expect(result).toBe(false);
  });
});

describe('installCodegraph', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('returns false on Windows without executing', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const { installCodegraph } = await import('../../src/utils/tools.js');
    const result = await installCodegraph();
    expect(result).toBe(false);
    expect(mockExec).not.toHaveBeenCalled();
    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('executes install script on Linux and returns true on success', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    mockExecSuccess();
    const { installCodegraph } = await import('../../src/utils/tools.js');
    const result = await installCodegraph();
    expect(result).toBe(true);
    Object.defineProperty(process, 'platform', { value: 'linux' });
  });

  it('returns false when install script fails', async () => {
    Object.defineProperty(process, 'platform', { value: 'linux' });
    mockExecFailure('curl failed');
    const { installCodegraph } = await import('../../src/utils/tools.js');
    const result = await installCodegraph();
    expect(result).toBe(false);
    Object.defineProperty(process, 'platform', { value: 'linux' });
  });
});

describe('initCodegraph', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('runs codegraph init and install, returns true on success', async () => {
    mockExecSuccess();
    const { initCodegraph } = await import('../../src/utils/tools.js');
    const result = await initCodegraph('/tmp/test-project');
    expect(result).toBe(true);
  });

  it('returns false when codegraph init fails', async () => {
    mockExecFailure('init failed');
    const { initCodegraph } = await import('../../src/utils/tools.js');
    const result = await initCodegraph('/tmp/test-project');
    expect(result).toBe(false);
  });
});
