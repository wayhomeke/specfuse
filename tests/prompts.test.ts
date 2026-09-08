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
  });

  it('never presents a CodeGraph prompt', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    await collectProjectConfig('test-project');

    const messages = [
      ...confirmMock.mock.calls.map((c: any) => String(c[0]?.message ?? '')),
      ...selectMock.mock.calls.map((c: any) => String(c[0]?.message ?? '')),
      ...inputMock.mock.calls.map((c: any) => String(c[0]?.message ?? '')),
    ];
    expect(messages.length).toBeGreaterThan(0);
    for (const m of messages) {
      expect(m).not.toContain('CodeGraph');
    }
  });

  it('asks only git and OpenSpec for a new project', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    await collectProjectConfig('test-project');
    expect(confirmMock).toHaveBeenCalledTimes(2);
    expect(selectMock).not.toHaveBeenCalled();
    expect(inputMock).not.toHaveBeenCalled();
  });

  it('asks no tech-stack question (stack layer removed)', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    await collectProjectConfig('test-project');

    expect(selectMock).not.toHaveBeenCalled();
    const messages = [
      ...confirmMock.mock.calls.map((c: any) => String(c[0]?.message ?? '')),
      ...selectMock.mock.calls.map((c: any) => String(c[0]?.message ?? '')),
      ...inputMock.mock.calls.map((c: any) => String(c[0]?.message ?? '')),
    ];
    for (const m of messages) {
      expect(m.toLowerCase()).not.toContain('stack');
      expect(m.toLowerCase()).not.toContain('tech stack');
    }
  });

  it('skips the git prompt for existing-directory init and resolves initGit false', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    const config = await collectProjectConfig('.');

    expect(config.initGit).toBe(false);
    // Only the OpenSpec confirm may fire: no git prompt, no CodeGraph prompt.
    expect(confirmMock).toHaveBeenCalledTimes(1);
    const messages = confirmMock.mock.calls.map((c: any) => String(c[0]?.message ?? ''));
    for (const m of messages) {
      expect(m).not.toContain('git');
      expect(m).not.toContain('CodeGraph');
    }
  });

  it('presents no prompt in --yes mode and enables OpenSpec, with no stack needed', async () => {
    const { collectProjectConfig } = await import('../src/prompts.js');
    const config = await collectProjectConfig('test-project', true);

    expect(confirmMock).not.toHaveBeenCalled();
    expect(config.initOpenspec).toBe(true);
    expect(config).not.toHaveProperty('stack');
  });
});
