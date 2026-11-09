/**
 * Shared scanner for the public-surface hygiene guard and its package-level
 * E2E case. The patterns cover the forms that have appeared in this repository
 * and the obvious variants: home-relative and `homedir()` paths, `$HOME`, Linux
 * and macOS home directories, Windows user directories, vendor credential
 * variables other than the public dsh pair, versioned model ids in prose or
 * YAML, and literal credential values.
 */
export interface Prohibited {
  name: string;
  pattern: RegExp;
}

export const PROHIBITED: Prohibited[] = [
  {
    name: 'personal environment file',
    pattern:
      /(?:~\/|\$HOME\/|\$\{HOME\}\/|\/home\/[^/\s]+\/|\/Users\/[^/\s]+\/|[A-Za-z]:\\Users\\[^\\\s]+\\)[^\s'"`]*\.env\b|homedir\(\)\s*,\s*['"][^'"]+\.env['"]/i,
  },
  {
    name: 'vendor credential variable',
    pattern:
      /\b(?!DEEPSEEK_)(?!SPECFUSE_)[A-Z][A-Z0-9]+(?:_BASE_URL|_API_KEY|_AUTH_TOKEN|_API_TOKEN|_ACCESS_TOKEN|_TOKEN|_SECRET|_PASSWORD)\b/,
  },
  {
    name: 'absolute home path',
    pattern:
      /(?:\/home\/[A-Za-z0-9_-]+|\/Users\/[A-Za-z0-9_-]+|[A-Za-z]:\\Users\\[A-Za-z0-9_-]+)/i,
  },
  {
    name: 'concrete versioned model id',
    pattern:
      /\b[a-z][a-z0-9]*(?:[/-][a-z0-9]+)*-[0-9]+\.[0-9]+(?![.\d])(?:-[a-z0-9]+)*\b/i,
  },
  {
    name: 'literal credential value',
    pattern: /(?:API_KEY|AUTH_TOKEN|ACCESS_TOKEN|SECRET|PASSWORD)\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}/,
  },
];

export function scanText(text: string): string[] {
  return PROHIBITED.filter((rule) => rule.pattern.test(text)).map((rule) => rule.name);
}
