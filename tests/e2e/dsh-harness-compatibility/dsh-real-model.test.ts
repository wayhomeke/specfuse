import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

/**
 * FuseQA case — authored per .claude/skills/fuseqa/templates contracts.
 *
 *   artifact:   a project scaffolded by the built dist/index.js
 *   entry:      a real `npx @deepseek-ai/dsh headless` process
 *   isolation:  project-local scratch project with its own .git, scratch
 *               DSH_HOME, DSH_AGENTS_HOME, and HOME for the scaffold
 *   observable: the model's skill catalog and the entry-skill response
 *   traces-to:  spec dsh-harness-compatibility / Scenarios "Catalog contains
 *               the shared skills", "Entry skills remain user-only", "Missing
 *               `/specfuse` requirement prints usage and stops", "Missing
 *               `/specfuse-full` requirement prints usage and stops"
 *
 * Why this cannot be a unit test: dsh's catalog and its `/name` gesture exist
 * only in a running harness. The scaffolded frontmatter can be parsed without
 * dsh, but only dsh proves it accepts the policy, hides the entry skills from
 * the model, and injects the entry skill on user input.
 *
 * Gate: `SPECFUSE_DSH_E2E=1`, Node 24.9+, and an endpoint. The endpoint comes
 * from an already exported `DEEPSEEK_BASE_URL`/`DEEPSEEK_API_KEY` pair, or from
 * `~/sb-openai.env` via `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN`. Values are
 * passed to the child process; nothing is written to disk.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const DIST = path.join(ROOT, 'dist', 'index.js');
const ENV_FILE = path.join(homedir(), 'sb-openai.env');

function parseEnvFile(content: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

function nodeSupportsDsh(): boolean {
  const [major, minor] = process.versions.node.split('.').map(Number);
  return major > 24 || (major === 24 && minor >= 9);
}

function evaluateGate(): { enabled: boolean; reason: string; endpoint?: string; token?: string } {
  if (process.env.SPECFUSE_DSH_E2E !== '1') {
    return { enabled: false, reason: 'SPECFUSE_DSH_E2E is not 1' };
  }
  if (!nodeSupportsDsh()) {
    return { enabled: false, reason: `Node ${process.versions.node} is below 24.9` };
  }
  if (!existsSync(DIST)) {
    return { enabled: false, reason: 'dist/index.js is missing; run `npm run build`' };
  }

  if (process.env.DEEPSEEK_BASE_URL && process.env.DEEPSEEK_API_KEY) {
    return {
      enabled: true,
      reason: 'enabled',
      endpoint: process.env.DEEPSEEK_BASE_URL,
      token: process.env.DEEPSEEK_API_KEY,
    };
  }

  if (!existsSync(ENV_FILE)) {
    return {
      enabled: false,
      reason: `neither DEEPSEEK_BASE_URL/DEEPSEEK_API_KEY nor ${ENV_FILE} is available`,
    };
  }
  const values = parseEnvFile(readFileSync(ENV_FILE, 'utf-8'));
  const endpoint = values.ANTHROPIC_BASE_URL;
  const token = values.ANTHROPIC_AUTH_TOKEN;
  if (!endpoint || !token) {
    return {
      enabled: false,
      reason: `${ENV_FILE} does not define ANTHROPIC_BASE_URL and ANTHROPIC_AUTH_TOKEN`,
    };
  }
  return { enabled: true, reason: 'enabled', endpoint, token };
}

/**
 * Copies the current environment without credentials. The dsh process is
 * trusted, but the model's shell tools inherit its environment; a test has no
 * business handing the developer's unrelated secrets to it.
 */
function sanitizedEnv(overrides: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (/(KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL)/i.test(key)) continue;
    env[key] = value;
  }
  return { ...env, ...overrides };
}

const GATE = evaluateGate();
if (!GATE.enabled) {
  console.log(`[fuseqa] skipping real dsh E2E: ${GATE.reason}`);
}

describe.skipIf(!GATE.enabled)('a real dsh session uses the scaffolded pipeline', () => {
  let project: string;
  let dshHome: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    project = path.join(ROOT, 'tmp', `e2e-dsh-model-${process.pid}-${Date.now()}`, 'project');
    const scratch = path.dirname(project);
    dshHome = path.join(scratch, 'dsh-home');
    const agentsHome = path.join(scratch, 'agents-home');
    const scaffoldHome = path.join(scratch, 'scaffold-home');
    mkdirSync(project, { recursive: true });
    mkdirSync(dshHome, { recursive: true });
    mkdirSync(agentsHome, { recursive: true });
    mkdirSync(path.join(scaffoldHome, '.config'), { recursive: true });

    // dsh resolves the project root through the nearest .git ancestor. The
    // scratch project lives inside this repository, so without its own marker
    // dsh would scan the repository's .agents/skills instead. A failed init
    // must fail the case rather than let that happen.
    const gitInit = spawnSync('git', ['init', '-q'], { cwd: project, encoding: 'utf-8' });
    expect(gitInit.status, gitInit.stderr).toBe(0);

    // A stub OpenSpec keeps the scaffold fast and side-effect free. This case
    // asserts dsh discovery; the real dual-adapter init is covered by the
    // readiness E2E. npx stays on the real PATH because the dsh call needs it.
    const stubBin = path.join(scratch, 'stub-bin');
    mkdirSync(stubBin, { recursive: true });
    writeFileSync(
      path.join(stubBin, 'openspec'),
      '#!/bin/sh\nif [ "$1" = "--version" ]; then echo 0.0.0; fi\nexit 0\n',
      { mode: 0o755 },
    );

    const pathWithStub = `${stubBin}${path.delimiter}${process.env.PATH ?? ''}`;

    // scaffold() trusts the target directory by writing <home>/.claude.json.
    // The scaffold therefore gets its own HOME; the dsh run keeps the real
    // HOME so npx can reuse its cache.
    const scaffoldEnv = sanitizedEnv({
      PATH: pathWithStub,
      HOME: scaffoldHome,
      XDG_CONFIG_HOME: path.join(scaffoldHome, '.config'),
    });
    const scaffoldRun = spawnSync(process.execPath, [DIST, '.', '--yes'], {
      cwd: project,
      env: scaffoldEnv,
      encoding: 'utf-8',
    });
    expect(scaffoldRun.status, scaffoldRun.stderr).toBe(0);
    expect(
      existsSync(path.join(scaffoldHome, '.claude.json')),
      'the scaffold trust write must land in the scratch HOME',
    ).toBe(true);

    // Proves dsh is reading this scratch project rather than the repository's
    // own .agents/skills: the canary exists nowhere else.
    const canary = path.join(project, '.agents', 'skills', 'catalog-canary');
    mkdirSync(canary, { recursive: true });
    writeFileSync(
      path.join(canary, 'SKILL.md'),
      '---\nname: catalog-canary\ndescription: Proves dsh scans the scratch project.\n---\n\n# Canary\n',
    );

    env = sanitizedEnv({
      PATH: pathWithStub,
      DSH_HOME: dshHome,
      DSH_AGENTS_HOME: agentsHome,
      DEEPSEEK_BASE_URL: GATE.endpoint,
      DEEPSEEK_API_KEY: GATE.token,
    });

    writeFileSync(
      path.join(project, 'cordis.patch.yml'),
      [
        '- id: llm-deepseek',
        '  config:',
        '    models:',
        '      - id: gemini-3.8-flash-high',
        '- id: agent-default-model',
        '  config:',
        '    provider: deepseek-official',
        '    model: gemini-3.8-flash-high',
        '',
      ].join('\n'),
    );
  });

  afterAll(() => {
    if (project) rmSync(path.dirname(project), { recursive: true, force: true });
  });

  function runDsh(task: string): { status: number; stdout: string; stderr: string } {
    const result = spawnSync(
      'npx',
      [
        '--yes',
        '@deepseek-ai/dsh',
        'headless',
        '--patch',
        './cordis.patch.yml',
        task,
      ],
      { cwd: project, env, encoding: 'utf-8', timeout: 240_000 },
    );
    if (result.error) throw result.error;
    return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  }

  it(
    'lists the shared skills and hides the entry skills from the catalog',
    () => {
      const run = runDsh(
        'Output only the skill names available in this session, one per line, and nothing else.',
      );
      expect(run.status, run.stderr).toBe(0);

      const lines = run.stdout
        .split('\n')
        .map((line) => line.replace(/^[-*`\s]+|`+$/g, '').trim())
        .filter(Boolean);

      for (const skill of ['design-md', 'fusedoc', 'fusereview', 'fuseqa', 'catalog-canary']) {
        expect(lines, `catalog is missing ${skill}`).toContain(skill);
      }
      expect(lines, 'specfuse must not be model-visible').not.toContain('specfuse');
      expect(lines, 'specfuse-full must not be model-visible').not.toContain('specfuse-full');
    },
    300_000,
  );

  it(
    'reaches the /specfuse entry skill and stops on missing requirement text',
    () => {
      const run = runDsh('/specfuse');
      expect(run.status, run.stderr).toBe(0);
      expect(run.stdout).toContain('SPECFUSE_USAGE: /specfuse <requirement description>');
    },
    300_000,
  );

  it(
    'reaches the /specfuse-full entry skill and stops on missing requirement text',
    () => {
      const run = runDsh('/specfuse-full');
      expect(run.status, run.stderr).toBe(0);
      expect(run.stdout).toContain(
        'SPECFUSE_FULL_USAGE: /specfuse-full <requirement description>',
      );
    },
    300_000,
  );
});
