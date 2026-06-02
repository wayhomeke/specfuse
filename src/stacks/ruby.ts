import type { StackProfile } from '../types.js';
import type { DetectionConfig } from './detect.js';

export const rubyStack: StackProfile = {
  id: 'ruby',
  label: 'Ruby',
  languages: ['Ruby'],
  architecture: 'MVC / Service-oriented',
  commands: {
    build: 'bundle install',
    test: 'bundle exec rspec',
    lint: 'bundle exec rubocop',
    format: 'bundle exec rubocop -A',
  },
  errorHandling: 'Ruby exceptions + custom error classes',
  concurrency: 'Ruby threads + Ractor (Ruby 3+)',
  permissions: [
    'Bash(bundle *)',
    'Bash(ruby *)',
    'Bash(rake *)',
    'Bash(rspec *)',
  ],
  gitignorePatterns: [
    '/vendor/bundle/',
    '*.gem',
    '.bundle/',
    '/coverage/',
    '/tmp/',
  ],
  openspecContext: `Tech stack: Ruby
Build: bundle install
Testing: bundle exec rspec
Code style: rubocop
Architecture: MVC / Service-oriented
Error handling: Ruby exceptions + custom error classes
Concurrency: Ruby threads + Ractor (Ruby 3+)`,
  openspecRules: {
    proposal: [
      'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
      'Include "Trade-offs" section with at least 2 alternative approaches considered',
      'Must reference affected gems/modules by name',
      'Keep proposals under 800 words',
    ],
    design: [
      'Must include a dependency diagram (ASCII or mermaid) showing module relationships',
      'Must specify public API surface (classes, modules, method signatures)',
      'Must address error handling strategy for the change',
      'Must address concurrency implications if applicable',
    ],
    specs: [
      'Each spec must be independently testable',
      'Specs must define both success and failure behaviors',
      'Include boundary conditions and edge cases',
      'Reference specific classes/modules/methods, not vague descriptions',
    ],
    tasks: [
      'Break tasks into chunks of max 2 hours of work',
      'Each task must have a clear "done" definition verifiable by running a command',
      'Tasks must follow TDD order - write test first, then implement, then refactor',
      'Every task must include a verification command (bundle exec rspec / specific spec file)',
      'Mark blocking dependencies explicitly between tasks',
    ],
  },
};

export const rubyDetectionConfig: DetectionConfig = {
  stackId: 'ruby',
  markerFiles: ['Gemfile', 'Rakefile', '.ruby-version'],
  markerDirs: [],
  fileExtensions: ['.rb'],
  priority: 10,
};
