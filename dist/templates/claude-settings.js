const SHARED_PERMISSIONS = [
    'Bash(git status *)',
    'Bash(git diff *)',
    'Bash(git log *)',
    'Bash(git branch *)',
    'Bash(git add *)',
    'Bash(git stash *)',
    'Bash(git worktree *)',
    'Bash(git init *)',
    'Bash(git clone *)',
    'Bash(openspec *)',
    'Bash(find *)',
    'Bash(ls *)',
    'Bash(rg *)',
    'Bash(grep *)',
    'Bash(wc *)',
    'Bash(tree *)',
    'WebSearch',
];
export function composeClaudeSettings(stack) {
    return {
        permissions: {
            allow: [...stack.permissions, ...SHARED_PERMISSIONS],
        },
    };
}
//# sourceMappingURL=claude-settings.js.map