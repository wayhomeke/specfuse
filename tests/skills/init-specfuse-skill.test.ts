import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Guards for the non-Claude-agent installation skill.
 *
 * The skill is a document another LLM reads at install time, so it cannot be
 * run in order to be tested. What is testable is what it points at, and what
 * it must no longer contain: the methodology is referenced rather than copied,
 * so the failures worth catching are a copy returning, and a rename in src/
 * leaving a pointer dangling.
 *
 * Contract: openspec/specs/init-specfuse-skill/
 */
const SKILL = path.resolve(import.meta.dirname, '..', '..', 'skills', 'init-specfuse', 'SKILL.md');
const REPO = path.resolve(import.meta.dirname, '..', '..');
const md = readFileSync(SKILL, 'utf-8');
// Prose assertions run against a whitespace-collapsed copy: the contract is
// about what the document says, and a line wrap must not decide whether an
// assertion matches.
const flat = md.replace(/\s+/g, ' ');

/**
 * The sources the skill points at instead of copying. Two assertions apply to
 * each: that the skill names it, and that it still resolves in the repo. The
 * first goes red when the skill loses a pointer; the second when a rename
 * makes the pointer dangle — which is the only drift surface left once the
 * copies are gone.
 */
const SOURCES: Array<{ file: string; symbol: string }> = [
  { file: 'src/templates/claude-md.ts', symbol: 'composeCLAUDEmd' },
  { file: 'src/templates/gitignore.ts', symbol: 'composeGitignore' },
  { file: 'src/templates/claude-settings.ts', symbol: 'composeClaudeSettings' },
  { file: 'src/templates/openspec-config.ts', symbol: 'composeOpenspecConfig' },
  { file: 'src/scaffolder.ts', symbol: 'mergeFusionIntoCLAUDEmd' },
  { file: 'src/scaffolder.ts', symbol: 'mergeGitignore' },
  { file: 'src/scaffolder.ts', symbol: 'mergeClaudeSettings' },
  // The three skills scaffold() installs. composeCLAUDEmd()'s output names
  // them ("The full review method lives in .claude/skills/fusereview/SKILL.md"),
  // so a skill that does not produce them ships an instruction file pointing at
  // files that do not exist — the same defect class this change removes from
  // the readiness path, moved to the artifact side.
  { file: 'src/templates/design-md-skill.ts', symbol: 'composeDesignMdSkill' },
  { file: 'src/templates/fusereview-skill.ts', symbol: 'composeFuseReviewSkill' },
  { file: 'src/templates/fuseqa-skill.ts', symbol: 'composeFuseQASkill' },
];

/** Template packs those skills carry, copied whole by scaffold(). */
const TEMPLATE_DIRS = ['src/design-md/templates', 'src/fuseqa/templates'];

describe('init-specfuse skill is stack-free (spec: init-specfuse-skill)', () => {
  it('contains no reference to the removed technology-stack layer', () => {
    // Case-insensitive on purpose. Six of the file's lines carry only the
    // capitalised `Stack` — `## Tech Stack`, `Stack-specific permissions:`,
    // and `## Stack Profiles Quick Reference` among them — so a case-sensitive
    // count would leave standing the very section this is meant to remove.
    const hits = [...md.matchAll(/stack/gi)];
    expect(hits).toHaveLength(0);
  });

  it('carries no inlined copy of the methodology', () => {
    // `### Phase 2: Apply / Implement` is the tell of a copied FUSION block.
    // The skill points at composeCLAUDEmd() instead of restating it, so this
    // heading appearing again means a copy has been pasted back in.
    expect(md).not.toContain('### Phase 2: Apply / Implement');
  });
});

/**
 * Whole-identifier match. `toContain('composeCLAUDEmd')` is satisfied by
 * `composeCLAUDEmdRenamed`, so a plain substring check passes after a rename —
 * it was written that way first, and the counter-example step caught it by
 * leaving every assertion green with the symbol renamed.
 */
const hasIdentifier = (text: string, name: string) => new RegExp(`\\b${name}\\b`).test(text);

describe('init-specfuse skill points at sources that resolve (spec: init-specfuse-skill)', () => {
  it('names every canonical source it depends on', () => {
    const unnamed = [
      ...SOURCES.filter((s) => !md.includes(s.file) || !hasIdentifier(md, s.symbol)),
      ...TEMPLATE_DIRS.filter((d) => !md.includes(d)).map((d) => ({ file: d, symbol: '(directory)' })),
    ];
    expect(unnamed).toEqual([]);
  });

  it.each(SOURCES)('$symbol is declared in $file', ({ file, symbol }) => {
    // Requires the *declaration*, not a mention. A bare `\bNAME\b` is satisfied
    // by an import or call site left behind when the function moves, so that
    // form stayed green after relocating `mergeGitignore` to another module —
    // while the skill's pointer ("… in src/scaffolder.ts") had become false.
    const source = readFileSync(path.join(REPO, file), 'utf-8');
    const declaration = new RegExp(
      `(?:export\\s+)?(?:async\\s+)?(?:function|const|class)\\s+${symbol}\\b`,
    );
    expect(source).toMatch(declaration);
  });
});

// Every heading the canonical text carries. Guarding only one of them left the
// rest copy-pasteable: restoring `### Path A: One-Shot Proposal` verbatim kept
// the suite green.
const CANONICAL_HEADINGS = [
  '## OpenSpec & Superpowers Composite Workflow Constraints',
  '### Path A: One-Shot Proposal',
  '### Path B: Step-by-Step Change',
  '### Exploration',
  '### Phase 2: Apply / Implement',
  '### Phase 3: Verify / Archive',
  '### General Rules',
];

describe('init-specfuse skill carries no partial copy of the methodology (spec: init-specfuse-skill)', () => {
  it.each(CANONICAL_HEADINGS)('does not restate %s', (heading) => {
    expect(md).not.toContain(heading);
  });
});

// OpenSpec tool ids chosen for being distinctive enough that they appear only
// if the `openspec init --help` output were pasted in wholesale.
//
// Honest scope: this catches that one malformation and nothing more. A hand-
// written short list (`claude, cursor, gemini`) passes both this and the
// positive check below, because the positive check only asks whether the
// instruction to run `openspec init --help` is present — it cannot fail for the
// presence of a list either. Nothing here mechanically prevents a hardcoded
// list; review is what does.
const COPIED_LIST_MARKERS = ['amazon-q', 'codeartsagent', 'minimax-code', 'oh-my-pi', 'roocode'];

describe('init-specfuse skill defers platform support to runtime (spec: init-specfuse-skill)', () => {
  it('tells the agent to read the tool id from openspec init --help', () => {
    // The dependency enumerates its own supported tools; asking it at runtime
    // is what keeps an upstream addition from making the skill stale.
    expect(md).toContain('openspec init --help');
  });

  it('does not carry a pasted copy of the supported-tools list', () => {
    const pasted = COPIED_LIST_MARKERS.filter((id) => md.includes(id));
    expect(pasted).toEqual([]);
  });
});

// The remaining scenarios are content assertions: they say what the document
// states, which is all a document can be held to. Each one is written so the
// pre-rewrite file fails it — verified against `git show <baseline>:…/SKILL.md`,
// because a content assertion that the old text also satisfied would guard
// nothing.
describe('init-specfuse skill content contract (spec: init-specfuse-skill)', () => {
  it("names the executing agent's own instruction files, not only Claude Code's", () => {
    for (const file of ['AGENTS.md', '.cursor/rules', 'copilot-instructions.md', 'GEMINI.md']) {
      expect(flat).toContain(file);
    }
  });

  it("warns that the canonical text is Claude Code's dialect", () => {
    expect(flat).toMatch(/written in Claude Code's dialect/i);
    expect(flat).toMatch(/do not copy it verbatim/i);
  });

  it('attributes the subagent and worktree instructions to Superpowers', () => {
    // They are Superpowers features, so a per-capability degradation table
    // would be wrong: one Superpowers check covers both.
    expect(flat).toMatch(/\*\*from Superpowers\*\*/);
    expect(flat).toMatch(/must not be degraded on their own/i);
  });

  it('does not claim the dependencies are unavailable off Claude Code', () => {
    expect(flat).toMatch(/Nothing in this methodology is unavailable merely because you are not Claude Code/i);
  });

  it('asks the git question only for a new project directory', () => {
    expect(flat).toMatch(/only when you are initialising a new project directory/i);
  });

  it('separates a declined OpenSpec from a failed attempt', () => {
    expect(flat).toMatch(/Print the `\/opsx:\*` line unannotated/i);
    expect(flat).toMatch(/Annotate that line with a marker/i);
    expect(flat).toMatch(/must not present `\/opsx:propose` as a working next step/i);
  });

  it("carries the CLI's merge rules for an existing project", () => {
    expect(flat).toMatch(/replace only the text between/i);
    expect(flat).toMatch(/Never remove a line/i);
    expect(flat).toMatch(/leave an existing one alone/i);
  });

  it('dropped the interpolated variables, which had no producer left', () => {
    // {{test_cmd}} / {{lint_cmd}} were filled from the removed toolchain layer.
    expect(md).not.toMatch(/\{\{[a-z_]+\}\}/);
  });

  it('states that the FUSION markers carry over unchanged', () => {
    expect(flat).toMatch(/portable as-is/i);
  });

  it('names what each discipline requires when Superpowers is unavailable', () => {
    // Degrading to prose is only useful if the prose says what the discipline
    // was enforcing; otherwise the capability silently disappears.
    expect(flat).toContain('reach agreement on the approach before building');
    expect(flat).toContain('write the failing test first, then the least code that passes it');
    expect(flat).toContain('no claim of completion without pasting fresh output as evidence');
  });

  it('asks the OpenSpec question whether or not the directory is new', () => {
    expect(flat).toMatch(/Ask this either way/i);
  });
});
