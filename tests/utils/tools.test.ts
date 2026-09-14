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

describe('subprocess guards — non-interactive hardening', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  function capturedOpts() {
    return mockExec.mock.calls.map((c: any) => c[1]);
  }

  it('closes stdin so a child waiting on input gets EOF instead of an open pipe', async () => {
    mockExecSuccess();
    const { initOpenspec } = await import('../../src/utils/tools.js');
    await initOpenspec('/tmp/test-project');
    expect(capturedOpts().length).toBeGreaterThan(0);
    for (const opts of capturedOpts()) {
      expect(opts.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    }
  });

  it('bounds every openspec call with a timeout and SIGKILL so a hang cannot be indefinite', async () => {
    mockExecSuccess();
    const { initOpenspec } = await import('../../src/utils/tools.js');
    await initOpenspec('/tmp/test-project');
    expect(capturedOpts().length).toBeGreaterThan(0);
    for (const opts of capturedOpts()) {
      expect(opts.timeout).toBeGreaterThan(0);
      expect(opts.killSignal).toBe('SIGKILL');
    }
  });

  it('guards the detect probe', async () => {
    mockExecSuccess('1.2.3');
    const { detectOpenspec } = await import('../../src/utils/tools.js');
    await detectOpenspec();
    const opts = mockExec.mock.calls[0][1] as any;
    expect(opts.timeout).toBeGreaterThan(0);
    expect(opts.killSignal).toBe('SIGKILL');
    expect(opts.stdio).toEqual(['ignore', 'pipe', 'pipe']);
  });

  it('guards the install call, the longest and most hang-prone of the three', async () => {
    mockExecSuccess();
    const { installOpenspec } = await import('../../src/utils/tools.js');
    await installOpenspec();
    expect(capturedOpts().length).toBeGreaterThan(0);
    for (const opts of capturedOpts()) {
      expect(opts.stdio).toEqual(['ignore', 'pipe', 'pipe']);
      expect(opts.timeout).toBeGreaterThan(0);
      expect(opts.killSignal).toBe('SIGKILL');
    }
  });

  it('orders the timeout tiers probe < install < init', async () => {
    const tools = await import('../../src/utils/tools.js');

    mockExecSuccess('1.2.3');
    await tools.detectOpenspec();
    const probeTimeout = (mockExec.mock.calls[0][1] as any).timeout;

    vi.resetAllMocks();
    mockExecSuccess();
    await tools.installOpenspec();
    const installTimeout = (mockExec.mock.calls[0][1] as any).timeout;

    vi.resetAllMocks();
    mockExecSuccess();
    await tools.initOpenspec('/tmp/test-project');
    const initTimeout = (mockExec.mock.calls[0][1] as any).timeout;

    expect(probeTimeout).toBeGreaterThan(0);
    expect(probeTimeout).toBeLessThan(installTimeout);
    expect(installTimeout).toBeLessThan(initTimeout);
  });

  it('returns false instead of hanging when an openspec call is killed by timeout', async () => {
    mockExec.mockImplementation((_cmd: any, _opts: any, cb?: any) => {
      const callback = cb || _opts;
      const err: any = new Error('timeout');
      err.killed = true;
      err.signal = 'SIGKILL';
      if (typeof callback === 'function') callback(err, '', '');
      return {} as any;
    });
    const { initOpenspec } = await import('../../src/utils/tools.js');
    expect(await initOpenspec('/tmp/test-project')).toBe(false);
  });

  it('never sets CODEGRAPH_NO_WATCH, which would outrank FORCE_WATCH and re-trigger the prompt', async () => {
    mockExecSuccess();
    const { initOpenspec } = await import('../../src/utils/tools.js');
    await initOpenspec('/tmp/test-project');
    expect(capturedOpts().length).toBeGreaterThan(0);
    for (const opts of capturedOpts()) {
      expect(opts.env?.CODEGRAPH_NO_WATCH).toBeUndefined();
    }
  });

  it('treats a profile-configuration failure as non-fatal', async () => {
    let call = 0;
    mockExec.mockImplementation((_cmd: any, _opts: any, cb?: any) => {
      const callback = cb || _opts;
      call += 1;
      // First call is `openspec init`; later calls are profile configuration.
      if (call === 1) {
        if (typeof callback === 'function') callback(null, '', '');
      } else if (typeof callback === 'function') {
        callback(new Error('profile set failed'), '', '');
      }
      return {} as any;
    });
    const { initOpenspec } = await import('../../src/utils/tools.js');
    expect(await initOpenspec('/tmp/test-project')).toBe(true);
  });
});

describe('module surface', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('exports the OpenSpec lifecycle and none of the CodeGraph lifecycle', async () => {
    const tools = await import('../../src/utils/tools.js');
    expect(typeof tools.detectOpenspec).toBe('function');
    expect(typeof tools.installOpenspec).toBe('function');
    expect(typeof tools.initOpenspec).toBe('function');
    expect('detectCodegraph' in tools).toBe(false);
    expect('installCodegraph' in tools).toBe(false);
    expect('initCodegraph' in tools).toBe(false);
  });
});
