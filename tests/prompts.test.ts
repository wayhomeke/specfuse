import { describe, it, expect, vi, beforeEach } from 'vitest';

const confirmMock = vi.fn();
const selectMock = vi.fn();
const inputMock = vi.fn();

vi.mock('@inquirer/prompts', () => ({
  confirm: (...args: any[]) => confirmMock(...args),
  select: (...args: any[]) => selectMock(...args),
  input: (...args: any[]) => inputMock(...args),
}));

describe('collectProjectConfig — setup questionnaire', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    confirmMock.mockResolvedValue(true);
    selectMock.mockResolvedValue('rust');
  });

  it('never presents a CodeGraph prompt', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    await collectProjectConfig('test-project', 'rust');

    const messages = [
      ...confirmMock.mock.calls.map((c: any) => String(c[0]?.message ?? '')),
      ...selectMock.mock.calls.map((c: any) => String(c[0]?.message ?? '')),
    ];
    for (const m of messages) {
      expect(m).not.toContain('CodeGraph');
    }
  });

  it('asks only git and OpenSpec for a new project with an explicit stack', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    await collectProjectConfig('test-project', 'rust');
    expect(confirmMock).toHaveBeenCalledTimes(2);
  });

  it('skips the git prompt for existing-directory init and resolves initGit false', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    const config = await collectProjectConfig('.', 'rust');

    expect(config.initGit).toBe(false);
    // Only the OpenSpec confirm may fire: no git prompt, no CodeGraph prompt.
    expect(confirmMock).toHaveBeenCalledTimes(1);
    const messages = confirmMock.mock.calls.map((c: any) => String(c[0]?.message ?? ''));
    for (const m of messages) {
      expect(m).not.toContain('git');
      expect(m).not.toContain('CodeGraph');
    }
  });

  it('presents no prompt in --yes mode and enables OpenSpec', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    const config = await collectProjectConfig('test-project', 'rust', undefined, true);

    expect(confirmMock).not.toHaveBeenCalled();
    expect(selectMock).not.toHaveBeenCalled();
    expect(config.initOpenspec).toBe(true);
  });

  it('rejects --yes without an explicit stack', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    await expect(
      collectProjectConfig('test-project', undefined, undefined, true),
    ).rejects.toThrow(/--stack is required with --yes/);
  });
});
