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
  // FuseQA E2E cases run the built artifact in an isolated scratch directory.
  // Deliberately stack-free: no test-framework entries — the project's own
  // stack decides how cases are expressed.
  'Bash(mktemp *)',
  'Bash(mkdir *)',
  'WebSearch',
];

export function composeClaudeSettings(): object {
  return {
    permissions: {
      allow: [...SHARED_PERMISSIONS],
    },
  };
}
