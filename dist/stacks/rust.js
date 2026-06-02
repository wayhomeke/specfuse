export const rustStack = {
    id: 'rust',
    label: 'Rust',
    languages: ['Rust'],
    architecture: 'Clean Architecture / Hexagonal (Ports & Adapters)',
    commands: {
        build: 'cargo build',
        test: 'cargo test',
        lint: 'cargo clippy -- -D warnings',
        format: 'cargo fmt',
    },
    errorHandling: 'Rust Result<T,E> / thiserror + anyhow',
    concurrency: 'Rust async (tokio) + channels',
    permissions: [
        'Bash(cargo test *)',
        'Bash(cargo build *)',
        'Bash(cargo clippy *)',
        'Bash(cargo fmt *)',
    ],
    gitignorePatterns: [
        '/target/',
    ],
    openspecContext: `Tech stack: Rust backend services
Build: cargo build
Testing: cargo test
Code style: rustfmt + clippy
Architecture: Clean Architecture / Hexagonal (ports & adapters)
Error handling: Rust Result<T,E>
Concurrency: Rust async (tokio) + channels`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected crates/modules by name',
            'Keep proposals under 800 words',
        ],
        design: [
            'Must include a dependency diagram (ASCII or mermaid) showing module relationships',
            'Must specify public API surface (traits, function signatures)',
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
            'Every task must include a verification command (cargo test / specific test function)',
            'Mark blocking dependencies explicitly between tasks',
        ],
    },
};
export const rustDetectionConfig = {
    stackId: 'rust',
    markerFiles: ['Cargo.toml', 'Cargo.lock'],
    markerDirs: [],
    fileExtensions: ['.rs'],
    priority: 10,
};
//# sourceMappingURL=rust.js.map