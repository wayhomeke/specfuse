export const javaGradleStack = {
    id: 'java-gradle',
    label: 'Java (Gradle)',
    languages: ['Java'],
    architecture: 'Clean Architecture / Layered (Controller -> Service -> Repository)',
    commands: {
        build: 'gradle build -x test',
        test: 'gradle test',
        lint: 'gradle checkstyleMain',
        format: 'gradle spotlessApply',
    },
    errorHandling: 'Java checked/unchecked exceptions + custom exception hierarchy',
    concurrency: 'Java virtual threads (Project Loom) + CompletableFuture',
    permissions: [
        'Bash(gradle *)',
        'Bash(gradlew *)',
        'Bash(java *)',
    ],
    gitignorePatterns: [
        '/build/',
        '.gradle/',
        '*.class',
        '*.jar',
        '.idea/',
        '*.iml',
    ],
    openspecContext: `Tech stack: Java (Gradle) backend services
Build: gradle build
Testing: gradle test
Code style: checkstyle + spotless
Architecture: Clean Architecture / Layered (Controller -> Service -> Repository)
Error handling: Java checked/unchecked exceptions + custom exception hierarchy
Concurrency: Java virtual threads (Project Loom) + CompletableFuture`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected modules/packages by name',
            'Keep proposals under 800 words',
        ],
        design: [
            'Must include a dependency diagram (ASCII or mermaid) showing module relationships',
            'Must specify public API surface (interfaces, class signatures, endpoint contracts)',
            'Must address error handling strategy for the change',
            'Must address concurrency implications if applicable',
        ],
        specs: [
            'Each spec must be independently testable',
            'Specs must define both success and failure behaviors',
            'Include boundary conditions and edge cases',
            'Reference specific classes/interfaces, not vague descriptions',
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
export const javaGradleDetectionConfig = {
    stackId: 'java-gradle',
    markerFiles: ['build.gradle', 'build.gradle.kts', 'gradlew'],
    markerDirs: [],
    fileExtensions: ['.java'],
    priority: 10,
};
//# sourceMappingURL=java-gradle.js.map