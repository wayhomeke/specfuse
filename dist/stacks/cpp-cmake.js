export const cppCmakeStack = {
    id: 'cpp-cmake',
    label: 'C/C++ (CMake)',
    languages: ['C', 'C++'],
    architecture: 'Modular / Library-based',
    commands: {
        build: 'cmake --build build',
        test: 'ctest --test-dir build --output-on-failure',
        lint: 'clang-tidy src/**/*.cpp',
        format: 'clang-format -i src/**/*.cpp src/**/*.h',
    },
    errorHandling: 'C++ exceptions + error codes + std::expected (C++23)',
    concurrency: 'std::thread + std::async + std::mutex',
    permissions: [
        'Bash(cmake *)',
        'Bash(ctest *)',
        'Bash(make *)',
        'Bash(clang-tidy *)',
        'Bash(clang-format *)',
    ],
    gitignorePatterns: [
        '/build/',
        '*.o',
        '*.obj',
        '*.a',
        '*.so',
        '*.dylib',
        '*.exe',
        'CMakeCache.txt',
        'CMakeFiles/',
    ],
    openspecContext: `Tech stack: C/C++ with CMake build system
Build: cmake --build build
Testing: ctest --test-dir build --output-on-failure
Code style: clang-tidy + clang-format
Architecture: Modular / Library-based
Error handling: C++ exceptions + error codes + std::expected (C++23)
Concurrency: std::thread + std::async + std::mutex`,
    openspecRules: {
        proposal: [
            'Always include a "Non-goals" section to explicitly scope out what this change does NOT do',
            'Include "Trade-offs" section with at least 2 alternative approaches considered',
            'Must reference affected libraries/targets by name',
            'Keep proposals under 800 words',
        ],
        design: [
            'Must include a dependency diagram (ASCII or mermaid) showing library/target relationships',
            'Must specify public API surface (headers, class interfaces, function signatures)',
            'Must address error handling strategy for the change',
            'Must address concurrency implications if applicable',
        ],
        specs: [
            'Each spec must be independently testable',
            'Specs must define both success and failure behaviors',
            'Include boundary conditions and edge cases',
            'Reference specific classes/functions/headers, not vague descriptions',
        ],
        tasks: [
            'Break tasks into chunks of max 2 hours of work',
            'Each task must have a clear "done" definition verifiable by running a command',
            'Tasks must follow TDD order - write test first, then implement, then refactor',
            'Every task must include a verification command (ctest / specific test target)',
            'Mark blocking dependencies explicitly between tasks',
        ],
    },
};
export const cppCmakeDetectionConfig = {
    stackId: 'cpp-cmake',
    markerFiles: ['CMakeLists.txt'],
    markerDirs: [],
    fileExtensions: ['.cpp', '.cc', '.c', '.h', '.hpp'],
    priority: 10,
};
//# sourceMappingURL=cpp-cmake.js.map