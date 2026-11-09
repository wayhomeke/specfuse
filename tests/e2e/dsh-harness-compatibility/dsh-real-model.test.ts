import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
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
 * Gate: `SPECFUSE_DSH_E2E=1`, Node 24.9+, `DEEPSEEK_BASE_URL`,
 * `DEEPSEEK_API_KEY`, and `SPECFUSE_DSH_MODEL`. Values come only from the
 * process environment; nothing is read from disk or written to a credential
 * file.
 */
const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const DIST = path.join(ROOT, 'dist', 'index.js');

function nodeSupportsDsh(): boolean {
  const [major, minor] = process.versions.node.split('.').map(Number);
  return major > 24 || (major === 24 && minor >= 9);
}

interface EnabledGate {
  enabled: true;
  endpoint: string;
  token: string;
  model: string;
}

interface DisabledGate {
  enabled: false;
  reason: string;
}

type Gate = EnabledGate | DisabledGate;

function evaluateGate(): Gate {
  if (process.env.SPECFUSE_DSH_E2E !== '1') {
    return { enabled: false, reason: 'SPECFUSE_DSH_E2E is not 1' };
  }
  if (!nodeSupportsDsh()) {
    return { enabled: false, reason: `Node ${process.versions.node} is below 24.9` };
  }
  if (!existsSync(DIST)) {
    return { enabled: false, reason: 'dist/index.js is missing; run `npm run build`' };
  }

  const endpoint = process.env.DEEPSEEK_BASE_URL;
  const token = process.env.DEEPSEEK_API_KEY;
  const model = process.env.SPECFUSE_DSH_MODEL;
  if (!endpoint || !token || !model) {
    const missing = [
      ...(endpoint ? [] : ['DEEPSEEK_BASE_URL']),
      ...(token ? [] : ['DEEPSEEK_API_KEY']),
      ...(model ? [] : ['SPECFUSE_DSH_MODEL']),
    ];
    return { enabled: false, reason: `missing ${missing.join(', ')}` };
  }
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/-]*$/.test(model)) {
    return { enabled: false, reason: 'SPECFUSE_DSH_MODEL contains unsupported characters' };
  }

  return { enabled: true, endpoint, token, model };
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

// The suite factory runs even when the gate is closed; hooks and test bodies
// do not. The assertion narrows the value only for the path that can use it.
const SUITE = GATE.enabled ? describe : describe.skip;
SUITE('a real dsh session uses the scaffolded pipeline', () => {
  const gate = GATE as EnabledGate;
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
      DEEPSEEK_BASE_URL: gate.endpoint,
      DEEPSEEK_API_KEY: gate.token,
    });

    writeFileSync(
      path.join(project, 'cordis.patch.yml'),
      [
        '- id: llm-deepseek',
        '  config:',
        '    models:',
        '      - id: ' + JSON.stringify(gate.model),
        '- id: agent-default-model',
        '  config:',
        '    provider: deepseek-official',
        '    model: ' + JSON.stringify(gate.model),
        '',
      ].join('\n'),
    );
    const patch = readFileSync(path.join(project, 'cordis.patch.yml'), 'utf-8');
    expect(patch).toContain(`id: ${JSON.stringify(gate.model)}`);
    expect(patch).toContain(`model: ${JSON.stringify(gate.model)}`);
  });

  afterAll(() => {
    if (project) rmSync(path.dirname(project), { recursive: true, force: true });
  });

  type DshRun = { status: number; stdout: string; stderr: string };

  /**
   * Runs dsh without blocking the worker thread. `spawnSync` would hold the
   * event loop for the whole model call, and vitest's worker RPC times out
   * after 60 seconds even when the case itself has a longer budget.
   */
  function runDsh(task: string): Promise<DshRun> {
    return new Promise((resolve, reject) => {
      const child = spawn(
        'npx',
        [
          '--yes',
          '@deepseek-ai/dsh',
          'headless',
          '--patch',
          './cordis.patch.yml',
          task,
        ],
        { cwd: project, env, detached: process.platform !== 'win32' },
      );

      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let settled = false;
      const timer = setTimeout(() => {
        timedOut = true;
        if (child.pid === undefined) {
          child.kill('SIGKILL');
          return;
        }
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          child.kill('SIGKILL');
        }
      }, 240_000);
      const settle = (action: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        action();
      };

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on('error', (error) => {
        settle(() => reject(error));
      });
      child.on('close', (code) => {
        settle(() => {
          if (timedOut) {
            reject(new Error(`dsh timed out after 240s\nstdout:\n${stdout}\nstderr:\n${stderr}`));
            return;
          }
          resolve({ status: code ?? -1, stdout, stderr });
        });
      });
    });
  }

  /**
   * One retry absorbs model non-determinism. The skill body that requests the
   * exact line is guarded separately by the composer tests; this case is the
   * real-process smoke test, not a deterministic assertion about sampling.
   */
  async function runDshWithRetry(task: string, accept: (run: DshRun) => boolean): Promise<DshRun> {
    const first = await runDsh(task);
    if (first.status !== 0 || accept(first)) return first;
    return runDsh(task);
  }

  it(
    'lists the shared skills and hides the entry skills from the catalog',
    async () => {
      const parseLines = (stdout: string) =>
        stdout
          .split('\n')
          .map((line) => line.replace(/^[-*`\s]+|`+$/g, '').trim())
          .filter(Boolean);
      const expected = ['design-md', 'fusedoc', 'fusereview', 'fuseqa', 'catalog-canary'];
      const run = await runDshWithRetry(
        'Output only the skill names available in this session, one per line, and nothing else.',
        (candidate) => {
          const lines = parseLines(candidate.stdout);
          return (
            expected.every((skill) => lines.includes(skill)) &&
            !lines.includes('specfuse') &&
            !lines.includes('specfuse-full')
          );
        },
      );
      expect(run.status, run.stderr).toBe(0);

      const lines = parseLines(run.stdout);
      for (const skill of expected) {
        expect(lines, `catalog is missing ${skill}`).toContain(skill);
      }
      expect(lines, 'specfuse must not be model-visible').not.toContain('specfuse');
      expect(lines, 'specfuse-full must not be model-visible').not.toContain('specfuse-full');
    },
    600_000,
  );

  it(
    'reaches the /specfuse entry skill and stops on missing requirement text',
    async () => {
      const usage = 'SPECFUSE_USAGE: /specfuse <requirement description>';
      const run = await runDshWithRetry('/specfuse', (candidate) =>
        candidate.stdout.includes(usage),
      );
      expect(run.status, run.stderr).toBe(0);
      expect(run.stdout).toContain(usage);
    },
    600_000,
  );

  it(
    'reaches the /specfuse-full entry skill and stops on missing requirement text',
    async () => {
      const usage = 'SPECFUSE_FULL_USAGE: /specfuse-full <requirement description>';
      const run = await runDshWithRetry('/specfuse-full', (candidate) =>
        candidate.stdout.includes(usage),
      );
      expect(run.status, run.stderr).toBe(0);
      expect(run.stdout).toContain(usage);
    },
    600_000,
  );
});
