import { describe, it, expect } from 'vitest';
import { composeClaudeSettings } from '../../src/templates/claude-settings.js';
import { composeOpenspecConfig } from '../../src/templates/openspec-config.js';
import { composeGitignore } from '../../src/templates/gitignore.js';
import { getBuiltinStacks } from '../../src/stacks/index.js';

describe('claude-settings template', () => {
  for (const stack of getBuiltinStacks()) {
    it(`${stack.id}: produces valid permissions structure`, () => {
      const settings = composeClaudeSettings(stack) as { permissions: { allow: string[] } };
      expect(settings.permissions).toBeDefined();
      expect(settings.permissions.allow).toBeInstanceOf(Array);
      expect(settings.permissions.allow.length).toBeGreaterThan(5);
    });

    it(`${stack.id}: includes shared git permissions`, () => {
      const settings = composeClaudeSettings(stack) as { permissions: { allow: string[] } };
      expect(settings.permissions.allow).toContain('Bash(git status *)');
      expect(settings.permissions.allow).toContain('Bash(openspec *)');
    });

    it(`${stack.id}: includes stack-specific permissions`, () => {
      const settings = composeClaudeSettings(stack) as { permissions: { allow: string[] } };
      for (const perm of stack.permissions) {
        expect(settings.permissions.allow).toContain(perm);
      }
    });
  }
});

describe('openspec-config template', () => {
  for (const stack of getBuiltinStacks()) {
    it(`${stack.id}: produces valid config structure`, () => {
      const config = composeOpenspecConfig({ projectName: 'test', stack }) as Record<string, unknown>;
      expect(config.schema).toBe('spec-driven');
      expect(config.context).toBeTruthy();
      expect(config.rules).toBeTruthy();
    });
  }
});

describe('gitignore template', () => {
  for (const stack of getBuiltinStacks()) {
    it(`${stack.id}: includes stack-specific and shared patterns`, () => {
      const output = composeGitignore(stack);
      expect(output).toContain('.DS_Store');
      expect(output).toContain('.env');
      for (const pattern of stack.gitignorePatterns) {
        expect(output).toContain(pattern);
      }
    });
  }
});
