import { describe, it, expect } from 'vitest';
import { composeCLAUDEmd } from '../../src/templates/claude-md.js';
import { getBuiltinStacks } from '../../src/stacks/index.js';

describe('CLAUDE.md template', () => {
  const stacks = getBuiltinStacks();

  for (const stack of stacks) {
    describe(stack.id, () => {
      const output = composeCLAUDEmd({ projectName: 'test', stack });

      it('contains FUSION markers', () => {
        expect(output).toContain('<!-- FUSION:START -->');
        expect(output).toContain('<!-- FUSION:END -->');
      });

      it('contains methodology invariant: Never skip TDD', () => {
        expect(output).toContain('Never skip TDD');
      });

      it('contains methodology invariant: verification evidence', () => {
        expect(output).toContain('NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE');
      });

      it('contains Path A and Path B', () => {
        expect(output).toContain('Path A: One-Shot Proposal');
        expect(output).toContain('Path B: Step-by-Step Change');
      });

      it('contains stack-specific test command', () => {
        expect(output).toContain(stack.commands.test);
      });

      it('contains stack-specific lint command', () => {
        expect(output).toContain(stack.commands.lint);
      });

      it('contains exploration section', () => {
        expect(output).toContain('Exploration');
        expect(output).toContain('brainstorming');
      });

      it('contains commit convention', () => {
        expect(output).toContain('conventional commits');
      });
    });
  }
});
