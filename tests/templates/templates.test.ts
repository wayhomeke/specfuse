import { describe, it, expect } from 'vitest';
import { composeClaudeSettings } from '../../src/templates/claude-settings.js';
import { composeOpenspecConfig } from '../../src/templates/openspec-config.js';
import { composeGitignore } from '../../src/templates/gitignore.js';

describe('claude-settings template', () => {
  it('produces valid permissions structure', () => {
    const settings = composeClaudeSettings() as { permissions: { allow: string[] } };
    expect(settings.permissions).toBeDefined();
    expect(settings.permissions.allow).toBeInstanceOf(Array);
    expect(settings.permissions.allow.length).toBeGreaterThan(5);
  });

  it('includes shared git permissions', () => {
    const settings = composeClaudeSettings() as { permissions: { allow: string[] } };
    expect(settings.permissions.allow).toContain('Bash(git status *)');
    expect(settings.permissions.allow).toContain('Bash(openspec *)');
  });
});

describe('openspec-config template', () => {
  it('produces valid config structure', () => {
    const config = composeOpenspecConfig() as Record<string, unknown>;
    expect(config.schema).toBe('spec-driven');
    expect(config.context).toBeTruthy();
    expect(config.rules).toBeTruthy();
    const rules = (config as any).rules as Record<string, string[]>;
    expect(Array.isArray(rules.proposal)).toBe(true);
    expect(rules.proposal.some((r) => r.toLowerCase().includes('non-goals'))).toBe(true);
    expect(Array.isArray(rules.tasks)).toBe(true);
    expect(rules.tasks.some((r) => r.toLowerCase().includes('tdd'))).toBe(true);
  });
});

describe('gitignore template', () => {
  it('includes shared patterns', () => {
    const output = composeGitignore();
    expect(output).toContain('.DS_Store');
    expect(output).toContain('.env');
  });

  it('does not include .codegraph/ (integration removed)', () => {
    const output = composeGitignore();
    expect(output).not.toContain('.codegraph/');
  });

  it('emits no stack-derived build patterns', () => {
    const output = composeGitignore();
    expect(output).not.toContain('/target/');
    expect(output).not.toContain('node_modules/');
    expect(output).not.toContain('/dist/');
  });

  it('preserves surrounding shared patterns', () => {
    const output = composeGitignore();
    expect(output).toContain('.idea/');
    expect(output).toContain('.DS_Store');
    expect(output).toContain('.env');
    expect(output).toContain('*.log');
  });

  it('does not include .grill-backup/ (phase removed)', () => {
    const output = composeGitignore();
    expect(output).not.toContain('.grill-backup/');
  });
});

describe('claude settings: FuseQA E2E permissions are stack-free', () => {
  const allow = (composeClaudeSettings() as any).permissions.allow as string[];

  it('permits isolated scratch-environment construction', () => {
    expect(allow).toContain('Bash(mktemp *)');
    expect(allow).toContain('Bash(mkdir *)');
  });

  it('mandates no test framework', () => {
    for (const p of allow) {
      expect(p).not.toMatch(/vitest|bats|playwright|jest/i);
    }
  });
});
