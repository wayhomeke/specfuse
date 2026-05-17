import { describe, it, expect } from 'vitest';
import { getBuiltinStacks } from '../../src/stacks/index.js';

describe('StackProfile validation', () => {
  const stacks = getBuiltinStacks();

  it('has at least 4 built-in stacks', () => {
    expect(stacks.length).toBeGreaterThanOrEqual(4);
  });

  for (const stack of stacks) {
    describe(stack.id, () => {
      it('has unique kebab-case id', () => {
        expect(stack.id).toMatch(/^[a-z0-9-]+$/);
      });

      it('has non-empty label', () => {
        expect(stack.label.length).toBeGreaterThan(0);
      });

      it('has at least one language', () => {
        expect(stack.languages.length).toBeGreaterThanOrEqual(1);
      });

      it('has all required commands', () => {
        expect(stack.commands.build).toBeTruthy();
        expect(stack.commands.test).toBeTruthy();
        expect(stack.commands.lint).toBeTruthy();
      });

      it('has at least 1 permission', () => {
        expect(stack.permissions.length).toBeGreaterThanOrEqual(1);
      });

      it('has at least 1 gitignore pattern', () => {
        expect(stack.gitignorePatterns.length).toBeGreaterThanOrEqual(1);
      });

      it('has non-empty openspec context', () => {
        expect(stack.openspecContext.length).toBeGreaterThan(0);
      });

      it('has tasks rules with TDD requirement', () => {
        const tasksRules = stack.openspecRules['tasks'];
        expect(tasksRules).toBeDefined();
        expect(tasksRules.some((r) => r.toLowerCase().includes('tdd'))).toBe(true);
      });
    });
  }

  it('has no duplicate ids', () => {
    const ids = stacks.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
