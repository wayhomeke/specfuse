import type { StackProfile } from '../types.js';

export const typescriptReactStack: StackProfile = {
  id: 'typescript-react',
  label: 'TypeScript + React',
  languages: ['TypeScript'],
  framework: 'React',
  architecture: 'Component-based / Feature-sliced',
  commands: {
    build: 'npm run build',
    test: 'npx vitest run',
    lint: 'npx eslint .',
    format: 'npx prettier --write .',
    typecheck: 'npx tsc --noEmit',
  },
  errorHandling: 'TypeScript strict mode + Error boundaries + React Suspense',
  concurrency: 'React concurrent features + async/await',
  permissions: [
    'Bash(npm test *)',
    'Bash(npm run *)',
    'Bash(npx vitest *)',
    'Bash(npx tsc *)',
    'Bash(npx eslint *)',
    'Bash(npx prettier *)',
  ],
  gitignorePatterns: [
    'node_modules/',
    '/dist/',
    '/build/',
    '.next/',
    '*.tsbuildinfo',
  ],
  openspecContext: `Tech stack: TypeScript + React frontend / full-stack
Build: npm run build
Testing: vitest
Code style: ESLint + Prettier
Architecture: Component-based / Feature-sliced
Error handling: TypeScript strict mode + Error boundaries
Concurrency: React concurrent features + async/await`,
  openspecRules: {
    proposal: [
      'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
      'Include "Trade-offs" section with at least 2 alternative approaches considered',
      'Must reference affected components/modules by name',
      'Keep proposals under 800 words',
    ],
    design: [
      'Must include a component hierarchy diagram',
      'Must specify public API surface (props interfaces, hook signatures)',
      'Must address state management strategy',
      'Must address accessibility (a11y) implications',
    ],
    specs: [
      'Each spec must be independently testable',
      'Specs must define both success and failure behaviors',
      'Include boundary conditions and edge cases',
      'Reference specific component/hook names, not vague descriptions',
    ],
    tasks: [
      'Break tasks into chunks of max 2 hours of work',
      'Each task must have a clear "done" definition verifiable by running a command',
      'Tasks must follow TDD order - write test first, then implement, then refactor',
      'Every task must include a verification command (npx vitest run / specific test)',
      'Mark blocking dependencies explicitly between tasks',
    ],
  },
};
