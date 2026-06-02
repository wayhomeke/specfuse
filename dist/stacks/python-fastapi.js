export const pythonFastapiStack = {
    id: 'python-fastapi',
    label: 'Python + FastAPI',
    languages: ['Python'],
    framework: 'FastAPI',
    architecture: 'Clean Architecture / Layered (API -> Service -> Repository)',
    commands: {
        build: 'pip install -e .',
        test: 'python -m pytest tests/ -v',
        lint: 'ruff check .',
        format: 'ruff format .',
        typecheck: 'mypy src/',
    },
    errorHandling: 'Python exceptions + FastAPI HTTPException + custom error handlers',
    concurrency: 'Python asyncio + FastAPI async endpoints',
    permissions: [
        'Bash(python -m pytest *)',
        'Bash(pip install *)',
        'Bash(ruff *)',
        'Bash(mypy *)',
        'Bash(uvicorn *)',
        'Bash(python *)',
    ],
    gitignorePatterns: [
        '__pycache__/',
        '*.egg-info/',
        '.venv/',
        '*.pyc',
        '.mypy_cache/',
        '.ruff_cache/',
        '/dist/',
    ],
    openspecContext: `Tech stack: Python + FastAPI backend services
Build: pip install -e .
Testing: pytest
Code style: ruff (check + format) + mypy
Architecture: Clean Architecture / Layered (API -> Service -> Repository)
Error handling: Python exceptions + FastAPI HTTPException
Concurrency: Python asyncio + FastAPI async endpoints`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected modules/packages by name',
            'Keep proposals under 800 words',
        ],
        design: [
            'Must include a dependency diagram (ASCII or mermaid) showing module relationships',
            'Must specify public API surface (Pydantic models, endpoint signatures)',
            'Must address error handling strategy for the change',
            'Must address async/concurrency implications if applicable',
        ],
        specs: [
            'Each spec must be independently testable',
            'Specs must define both success and failure behaviors',
            'Include boundary conditions and edge cases',
            'Reference specific classes/models/types, not vague descriptions',
        ],
        tasks: [
            'Break tasks into chunks of max 2 hours of work',
            'Each task must have a clear "done" definition verifiable by running a command',
            'Tasks must follow TDD order - write test first, then implement, then refactor',
            'Every task must include a verification command (pytest / specific test function)',
            'Mark blocking dependencies explicitly between tasks',
        ],
    },
};
export const pythonFastapiDetectionConfig = {
    stackId: 'python-fastapi',
    markerFiles: ['requirements.txt', 'pyproject.toml', 'setup.py', 'Pipfile'],
    markerDirs: [],
    fileExtensions: ['.py'],
    priority: 10,
};
//# sourceMappingURL=python-fastapi.js.map