import type { StackProfile } from '../types.js';
import type { DetectionConfig } from './detect.js';

export const dotnetStack: StackProfile = {
  id: 'dotnet',
  label: '.NET (C#)',
  languages: ['C#'],
  architecture: 'Clean Architecture / Onion',
  commands: {
    build: 'dotnet build',
    test: 'dotnet test',
    lint: 'dotnet format --verify-no-changes',
    format: 'dotnet format',
  },
  errorHandling: 'C# exceptions + Result pattern + FluentValidation',
  concurrency: 'C# async/await + Task + Channel + Parallel.ForEachAsync',
  permissions: [
    'Bash(dotnet *)',
    'Bash(nuget *)',
  ],
  gitignorePatterns: [
    '/bin/',
    '/obj/',
    '*.user',
    '*.suo',
    '.vs/',
    '*.nupkg',
  ],
  openspecContext: `Tech stack: .NET (C#)
Build: dotnet build
Testing: dotnet test
Code style: dotnet format
Architecture: Clean Architecture / Onion
Error handling: C# exceptions + Result pattern + FluentValidation
Concurrency: C# async/await + Task + Channel + Parallel.ForEachAsync`,
  openspecRules: {
    proposal: [
      'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
      'Include "Trade-offs" section with at least 2 alternative approaches considered',
      'Must reference affected projects/namespaces by name',
      'Keep proposals under 800 words',
    ],
    design: [
      'Must include a dependency diagram (ASCII or mermaid) showing module relationships',
      'Must specify public API surface (interfaces, class signatures)',
      'Must address error handling strategy for the change',
      'Must address concurrency implications if applicable',
    ],
    specs: [
      'Each spec must be independently testable',
      'Specs must define both success and failure behaviors',
      'Include boundary conditions and edge cases',
      'Reference specific types/interfaces, not vague descriptions',
    ],
    tasks: [
      'Break tasks into chunks of max 2 hours of work',
      'Each task must have a clear "done" definition verifiable by running a command',
      'Tasks must follow TDD order - write test first, then implement, then refactor',
      'Every task must include a verification command (dotnet test / specific test project)',
      'Mark blocking dependencies explicitly between tasks',
    ],
  },
};

export const dotnetDetectionConfig: DetectionConfig = {
  stackId: 'dotnet',
  markerFiles: ['*.csproj', '*.sln', '*.fsproj'],
  markerDirs: [],
  fileExtensions: ['.cs', '.fs'],
  priority: 10,
};
