import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { QuestionnaireAnswers, DimensionVector } from '../types.js';

vi.mock('@inquirer/prompts', () => ({
  checkbox: vi.fn(),
  select: vi.fn(),
  input: vi.fn(),
  confirm: vi.fn(),
  number: vi.fn(),
}));

describe('generateDesignMd()', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'design-md-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('writes DESIGN.md to target directory', async () => {
    const { checkbox, select, input, confirm } = await import('@inquirer/prompts');
    (checkbox as any).mockResolvedValue(['dashboard', 'internal-tool']);
    (select as any).mockResolvedValueOnce('developers'); // audience
    (select as any).mockResolvedValueOnce('dark'); // mood
    (select as any).mockResolvedValueOnce('compact'); // density
    (input as any).mockResolvedValue(''); // reference
    (confirm as any).mockResolvedValue(true); // confirm match
    (select as any).mockResolvedValueOnce('accept'); // fine-tune action

    const { generateDesignMd } = await import('../index.js');
    const result = await generateDesignMd(tempDir);

    expect(result).toBe(join(tempDir, 'DESIGN.md'));
    expect(existsSync(join(tempDir, 'DESIGN.md'))).toBe(true);
    const content = readFileSync(join(tempDir, 'DESIGN.md'), 'utf-8');
    expect(content).toContain('---');
    expect(content).toContain('tokens');
  });

  it('returns null when user declines overwrite', async () => {
    writeFileSync(join(tempDir, 'DESIGN.md'), 'existing content');

    const { checkbox, select, input, confirm } = await import('@inquirer/prompts');
    (confirm as any).mockResolvedValue(false); // decline overwrite

    const { generateDesignMd } = await import('../index.js');
    const result = await generateDesignMd(tempDir);

    expect(result).toBeNull();
    expect(readFileSync(join(tempDir, 'DESIGN.md'), 'utf-8')).toBe('existing content');
  });

  it('creates backup when overwriting existing DESIGN.md', async () => {
    writeFileSync(join(tempDir, 'DESIGN.md'), 'old content');

    const { checkbox, select, input, confirm } = await import('@inquirer/prompts');
    (confirm as any).mockResolvedValueOnce(true); // confirm overwrite
    (checkbox as any).mockResolvedValue(['consumer']);
    (select as any).mockResolvedValueOnce('general'); // audience
    (select as any).mockResolvedValueOnce('playful'); // mood
    (select as any).mockResolvedValueOnce('spacious'); // density
    (input as any).mockResolvedValue(''); // reference
    (confirm as any).mockResolvedValueOnce(true); // confirm match
    (select as any).mockResolvedValueOnce('accept'); // fine-tune action

    const { generateDesignMd } = await import('../index.js');
    const result = await generateDesignMd(tempDir);

    expect(result).toBe(join(tempDir, 'DESIGN.md'));
    expect(existsSync(join(tempDir, 'DESIGN.md.bak'))).toBe(true);
    expect(readFileSync(join(tempDir, 'DESIGN.md.bak'), 'utf-8')).toBe('old content');
  });
});
