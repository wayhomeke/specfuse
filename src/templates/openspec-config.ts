// Stack-agnostic rule set. These are process constraints that hold for any
// project, not stack-specific hints (crates, hooks, etc. were dropped with
// the stack layer).
const CONTEXT = `Tech stack: project-owned (SpecFuse is a process, not a stack selector)
The project's own CLAUDE.md declares its build/test/lint commands.`;

const RULES: Record<string, string[]> = {
  proposal: [
    'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
    'Include "Trade-offs" section with at least 2 alternative approaches considered',
    'Must reference affected modules/files by name',
    'Keep proposals under 800 words',
  ],
  design: [
    'Must include a dependency diagram showing module relationships',
    'Must specify public API surface',
    'Must address error-handling strategy for the change',
  ],
  specs: [
    'Each spec must be independently testable',
    'Specs must define both success and failure behaviors',
    'Include boundary conditions and edge cases',
    'Reference concrete symbols, not vague descriptions',
  ],
  tasks: [
    'Break tasks into chunks of max 2 hours of work',
    'Each task must have a clear "done" definition verifiable by running a command',
    'Tasks must follow TDD order - write test first, then implement, then refactor',
    'Every task must include a verification command',
    'Mark blocking dependencies explicitly between tasks',
  ],
};

export function composeOpenspecConfig(): object {
  return {
    schema: 'spec-driven',
    context: CONTEXT,
    rules: RULES,
  };
}
