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

export function composeGitignore(): string {
  return SHARED_PATTERNS.join('\n') + '\n';
}
