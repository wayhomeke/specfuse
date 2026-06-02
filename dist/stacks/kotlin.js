export const kotlinStack = {
    id: 'kotlin',
    label: 'Kotlin',
    languages: ['Kotlin'],
    architecture: 'Clean Architecture / MVVM',
    commands: {
        build: 'gradle build -x test',
        test: 'gradle test',
        lint: 'ktlint',
        format: 'ktlint -F',
    },
    errorHandling: 'Kotlin exceptions + sealed classes + Result type',
    concurrency: 'Kotlin coroutines + Flow',
    permissions: [
        'Bash(gradle *)',
        'Bash(gradlew *)',
        'Bash(ktlint *)',
        'Bash(kotlin *)',
    ],
    gitignorePatterns: [
        '/build/',
        '.gradle/',
        '*.class',
        '.idea/',
        '*.iml',
    ],
    openspecContext: `Tech stack: Kotlin
Build: gradle build -x test
Testing: gradle test
Code style: ktlint
Architecture: Clean Architecture / MVVM
Error handling: Kotlin exceptions + sealed classes + Result type
Concurrency: Kotlin coroutines + Flow`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected modules/packages by name',
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
            'Reference specific types/classes, not vague descriptions',
        ],
        tasks: [
            'Break tasks into chunks of max 2 hours of work',
            'Each task must have a clear "done" definition verifiable by running a command',
            'Tasks must follow TDD order - write test first, then implement, then refactor',
            'Every task must include a verification command (gradle test / specific test class)',
            'Mark blocking dependencies explicitly between tasks',
        ],
    },
};
export const kotlinDetectionConfig = {
    stackId: 'kotlin',
    markerFiles: [],
    markerDirs: [],
    fileExtensions: ['.kt', '.kts'],
    priority: 10,
};
//# sourceMappingURL=kotlin.js.map