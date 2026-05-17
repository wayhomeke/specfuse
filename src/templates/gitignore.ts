import type { StackProfile } from '../types.js';

const SHARED_PATTERNS = [
  '# IDE',
  '.idea/',
  '.vscode/',
  '*.swp',
  '*.swo',
  '*~',
  '',
  '# OS',
  '.DS_Store',
  'Thumbs.db',
  '',
  '# Environment',
  '.env',
  '.env.local',
  '.env.*.local',
  '',
  '# Logs',
  '*.log',
  '',
  '# Temporary',
  '/tmp/',
];

export function composeGitignore(stack: StackProfile): string {
  const lines = [
    '# Build & Dependencies',
    ...stack.gitignorePatterns,
    '',
    ...SHARED_PATTERNS,
  ];
  return lines.join('\n') + '\n';
}
