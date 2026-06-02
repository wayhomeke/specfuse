export const phpStack = {
    id: 'php',
    label: 'PHP',
    languages: ['PHP'],
    architecture: 'MVC / Layered',
    commands: {
        build: 'composer install',
        test: 'vendor/bin/phpunit',
        lint: 'vendor/bin/phpstan analyse',
        format: 'vendor/bin/php-cs-fixer fix',
    },
    errorHandling: 'PHP exceptions + typed error handlers',
    concurrency: 'PHP Fibers (PHP 8.1+) + async frameworks',
    permissions: [
        'Bash(php *)',
        'Bash(composer *)',
        'Bash(vendor/bin/phpunit *)',
        'Bash(vendor/bin/phpstan *)',
    ],
    gitignorePatterns: [
        '/vendor/',
        '*.cache',
        '.phpunit.result.cache',
        '.php-cs-fixer.cache',
    ],
    openspecContext: `Tech stack: PHP
Build: composer install
Testing: vendor/bin/phpunit
Code style: phpstan + php-cs-fixer
Architecture: MVC / Layered
Error handling: PHP exceptions + typed error handlers
Concurrency: PHP Fibers (PHP 8.1+) + async frameworks`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected packages/namespaces by name',
            'Keep proposals under 800 words',
        ],
        design: [
            'Must include a dependency diagram (ASCII or mermaid) showing namespace/package relationships',
            'Must specify public API surface (classes, interfaces, method signatures)',
            'Must address error handling strategy for the change',
            'Must address concurrency implications if applicable',
        ],
        specs: [
            'Each spec must be independently testable',
            'Specs must define both success and failure behaviors',
            'Include boundary conditions and edge cases',
            'Reference specific classes/interfaces/methods, not vague descriptions',
        ],
        tasks: [
            'Break tasks into chunks of max 2 hours of work',
            'Each task must have a clear "done" definition verifiable by running a command',
            'Tasks must follow TDD order - write test first, then implement, then refactor',
            'Every task must include a verification command (vendor/bin/phpunit / specific test file)',
            'Mark blocking dependencies explicitly between tasks',
        ],
    },
};
export const phpDetectionConfig = {
    stackId: 'php',
    markerFiles: ['composer.json', 'composer.lock'],
    markerDirs: [],
    fileExtensions: ['.php'],
    priority: 10,
};
//# sourceMappingURL=php.js.map