import type { StackProfile } from '../types.js';
import type { DetectionConfig } from './detect.js';

export const scalaSbtStack: StackProfile = {
  id: 'scala-sbt',
  label: 'Scala (sbt)',
  languages: ['Scala'],
  architecture: 'Functional / Layered (ZIO / Cats Effect)',
  commands: {
    build: 'sbt compile',
    test: 'sbt test',
    lint: 'sbt scalafmtCheck',
    format: 'sbt scalafmt',
  },
  errorHandling: 'Scala Either/Option + ZIO error channel + custom ADTs',
  concurrency: 'Scala Future + ZIO fibers + Cats Effect IO',
  permissions: [
    'Bash(sbt *)',
    'Bash(scala *)',
    'Bash(scalac *)',
  ],
  gitignorePatterns: [
    '/target/',
    '/project/target/',
    '.bsp/',
    '.metals/',
    '.bloop/',
  ],
  openspecContext: `Tech stack: Scala (sbt)
Build: sbt compile
Testing: sbt test
Code style: scalafmt + scalafmtCheck
Architecture: Functional / Layered (ZIO / Cats Effect)
Error handling: Scala Either/Option + ZIO error channel + custom ADTs
Concurrency: Scala Future + ZIO fibers + Cats Effect IO`,
  openspecRules: {
    proposal: [
      'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
      'Include "Trade-offs" section with at least 2 alternative approaches considered',
      'Must reference affected subprojects/packages by name',
      'Keep proposals under 800 words',
    ],
    design: [
      'Must include a dependency diagram (ASCII or mermaid) showing module relationships',
      'Must specify public API surface (traits, case classes, type signatures)',
      'Must address error handling strategy for the change',
      'Must address concurrency implications if applicable',
    ],
    specs: [
      'Each spec must be independently testable',
      'Specs must define both success and failure behaviors',
      'Include boundary conditions and edge cases',
      'Reference specific types/traits, not vague descriptions',
    ],
    tasks: [
      'Break tasks into chunks of max 2 hours of work',
      'Each task must have a clear "done" definition verifiable by running a command',
      'Tasks must follow TDD order - write test first, then implement, then refactor',
      'Every task must include a verification command (sbt test / specific test suite)',
      'Mark blocking dependencies explicitly between tasks',
    ],
  },
};

export const scalaSbtDetectionConfig: DetectionConfig = {
  stackId: 'scala-sbt',
  markerFiles: ['build.sbt'],
  markerDirs: ['project/'],
  fileExtensions: ['.scala', '.sc'],
  priority: 10,
};
