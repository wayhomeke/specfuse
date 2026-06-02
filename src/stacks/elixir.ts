import type { StackProfile } from '../types.js';
import type { DetectionConfig } from './detect.js';

export const elixirStack: StackProfile = {
  id: 'elixir',
  label: 'Elixir (Mix)',
  languages: ['Elixir'],
  architecture: 'OTP / Supervision tree / GenServer',
  commands: {
    build: 'mix compile',
    test: 'mix test',
    lint: 'mix credo --strict',
    format: 'mix format',
  },
  errorHandling: 'Elixir pattern matching + {:ok, _}/{:error, _} tuples + supervisors',
  concurrency: 'Elixir processes + GenServer + Task + OTP supervision trees',
  permissions: [
    'Bash(mix *)',
    'Bash(iex *)',
    'Bash(elixir *)',
  ],
  gitignorePatterns: [
    '/_build/',
    '/deps/',
    '/cover/',
    '*.ez',
    '.elixir_ls/',
  ],
  openspecContext: `Tech stack: Elixir (Mix)
Build: mix compile
Testing: mix test
Code style: mix credo --strict + mix format
Architecture: OTP / Supervision tree / GenServer
Error handling: Elixir pattern matching + {:ok, _}/{:error, _} tuples + supervisors
Concurrency: Elixir processes + GenServer + Task + OTP supervision trees`,
  openspecRules: {
    proposal: [
      'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
      'Include "Trade-offs" section with at least 2 alternative approaches considered',
      'Must reference affected applications/modules by name',
      'Keep proposals under 800 words',
    ],
    design: [
      'Must include a dependency diagram (ASCII or mermaid) showing module relationships',
      'Must specify public API surface (module functions, GenServer callbacks)',
      'Must address error handling strategy for the change',
      'Must address supervision tree implications if applicable',
    ],
    specs: [
      'Each spec must be independently testable',
      'Specs must define both success and failure behaviors',
      'Include boundary conditions and edge cases',
      'Reference specific modules/functions, not vague descriptions',
    ],
    tasks: [
      'Break tasks into chunks of max 2 hours of work',
      'Each task must have a clear "done" definition verifiable by running a command',
      'Tasks must follow TDD order - write test first, then implement, then refactor',
      'Every task must include a verification command (mix test / specific test module)',
      'Mark blocking dependencies explicitly between tasks',
    ],
  },
};

export const elixirDetectionConfig: DetectionConfig = {
  stackId: 'elixir',
  markerFiles: ['mix.exs', 'mix.lock'],
  markerDirs: [],
  fileExtensions: ['.ex', '.exs'],
  priority: 10,
};
