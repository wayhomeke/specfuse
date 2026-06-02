export const bashStack = {
    id: 'bash',
    label: 'Bash / Shell Script',
    languages: ['Bash'],
    architecture: 'Script-based / Pipeline',
    commands: {
        build: 'echo "No build step"',
        test: 'bats tests/',
        lint: 'shellcheck **/*.sh',
        format: 'shfmt -w .',
    },
    errorHandling: 'set -euo pipefail + trap handlers',
    concurrency: 'Background processes + GNU parallel',
    permissions: [
        'Bash(bats *)',
        'Bash(shellcheck *)',
        'Bash(shfmt *)',
        'Bash(bash *)',
    ],
    gitignorePatterns: [
        '*.log',
        '/tmp/',
    ],
    openspecContext: `Tech stack: Bash / Shell scripts
Build: No build step
Testing: bats
Code style: shellcheck + shfmt
Architecture: Script-based / Pipeline
Error handling: set -euo pipefail + trap handlers
Concurrency: Background processes + GNU parallel`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected scripts/modules by name',
            'Keep proposals under 800 words',
        ],
        design: [
            'Must include a dependency diagram (ASCII or mermaid) showing script relationships',
            'Must specify public API surface (functions, script arguments, environment variables)',
            'Must address error handling strategy for the change',
            'Must address concurrency implications if applicable',
        ],
        specs: [
            'Each spec must be independently testable',
            'Specs must define both success and failure behaviors',
            'Include boundary conditions and edge cases',
            'Reference specific scripts/functions, not vague descriptions',
        ],
        tasks: [
            'Break tasks into chunks of max 2 hours of work',
            'Each task must have a clear "done" definition verifiable by running a command',
            'Tasks must follow TDD order - write test first, then implement, then refactor',
            'Every task must include a verification command (bats / specific test file)',
            'Mark blocking dependencies explicitly between tasks',
        ],
    },
};
export const bashDetectionConfig = {
    stackId: 'bash',
    markerFiles: ['.shellcheckrc', '.bats'],
    markerDirs: [],
    fileExtensions: ['.sh', '.bash'],
    priority: 30,
};
//# sourceMappingURL=bash.js.map