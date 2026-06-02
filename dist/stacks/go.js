export const goStack = {
    id: 'go',
    label: 'Go',
    languages: ['Go'],
    architecture: 'Clean Architecture / Hexagonal (Ports & Adapters)',
    commands: {
        build: 'go build ./...',
        test: 'go test ./...',
        lint: 'golangci-lint run',
        format: 'gofmt -w .',
    },
    errorHandling: 'Go explicit error returns (if err != nil)',
    concurrency: 'Go goroutines + channels',
    permissions: [
        'Bash(go test *)',
        'Bash(go build *)',
        'Bash(go vet *)',
        'Bash(golangci-lint *)',
        'Bash(gofmt *)',
    ],
    gitignorePatterns: [
        '/bin/',
        '/dist/',
        '/vendor/',
    ],
    openspecContext: `Tech stack: Go backend services
Build: go build
Testing: go test
Code style: gofmt + golangci-lint
Architecture: Clean Architecture / Hexagonal (ports & adapters)
Error handling: Go explicit error returns
Concurrency: Go goroutines + channels`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected packages by name',
            'Keep proposals under 800 words',
        ],
        design: [
            'Must include a dependency diagram (ASCII or mermaid) showing package relationships',
            'Must specify public API surface (interfaces, exported function signatures)',
            'Must address error handling strategy for the change',
            'Must address concurrency implications if applicable',
        ],
        specs: [
            'Each spec must be independently testable',
            'Specs must define both success and failure behaviors',
            'Include boundary conditions and edge cases',
            'Reference specific interfaces/types, not vague descriptions',
        ],
        tasks: [
            'Break tasks into chunks of max 2 hours of work',
            'Each task must have a clear "done" definition verifiable by running a command',
            'Tasks must follow TDD order - write test first, then implement, then refactor',
            'Every task must include a verification command (go test / specific test function)',
            'Mark blocking dependencies explicitly between tasks',
        ],
    },
};
export const goDetectionConfig = {
    stackId: 'go',
    markerFiles: ['go.mod', 'go.sum'],
    markerDirs: [],
    fileExtensions: ['.go'],
    priority: 10,
};
//# sourceMappingURL=go.js.map