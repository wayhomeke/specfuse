export const swiftStack = {
    id: 'swift',
    label: 'Swift (SPM)',
    languages: ['Swift'],
    architecture: 'Protocol-oriented / MVVM',
    commands: {
        build: 'swift build',
        test: 'swift test',
        lint: 'swiftlint',
        format: 'swift-format format -r Sources/',
    },
    errorHandling: 'Swift Error protocol + Result type + do-try-catch',
    concurrency: 'Swift structured concurrency (async/await + TaskGroup + actors)',
    permissions: [
        'Bash(swift *)',
        'Bash(swiftlint *)',
        'Bash(swift-format *)',
        'Bash(xcodebuild *)',
    ],
    gitignorePatterns: [
        '.build/',
        '*.xcodeproj/',
        '*.xcworkspace/',
        'DerivedData/',
        'Package.resolved',
    ],
    openspecContext: `Tech stack: Swift (Swift Package Manager)
Build: swift build
Testing: swift test
Code style: swiftlint + swift-format
Architecture: Protocol-oriented / MVVM
Error handling: Swift Error protocol + Result type + do-try-catch
Concurrency: Swift structured concurrency (async/await + TaskGroup + actors)`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected modules/targets by name',
            'Keep proposals under 800 words',
        ],
        design: [
            'Must include a dependency diagram (ASCII or mermaid) showing module relationships',
            'Must specify public API surface (protocols, struct/class signatures)',
            'Must address error handling strategy for the change',
            'Must address concurrency implications if applicable',
        ],
        specs: [
            'Each spec must be independently testable',
            'Specs must define both success and failure behaviors',
            'Include boundary conditions and edge cases',
            'Reference specific types/protocols, not vague descriptions',
        ],
        tasks: [
            'Break tasks into chunks of max 2 hours of work',
            'Each task must have a clear "done" definition verifiable by running a command',
            'Tasks must follow TDD order - write test first, then implement, then refactor',
            'Every task must include a verification command (swift test / specific test target)',
            'Mark blocking dependencies explicitly between tasks',
        ],
    },
};
export const swiftDetectionConfig = {
    stackId: 'swift',
    markerFiles: ['Package.swift'],
    markerDirs: [],
    fileExtensions: ['.swift'],
    priority: 10,
};
//# sourceMappingURL=swift.js.map