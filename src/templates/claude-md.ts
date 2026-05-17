import type { StackProfile, TemplateContext } from '../types.js';

function renderTechStack(stack: StackProfile): string {
  const lines = [
    '## Tech Stack',
    ...stack.languages.map((l) => `- Language: ${l}`),
  ];
  if (stack.framework) lines.push(`- Framework: ${stack.framework}`);
  lines.push(
    `- Architecture: ${stack.architecture}`,
    `- Build: \`${stack.commands.build}\``,
    `- Test: \`${stack.commands.test}\``,
    `- Lint: \`${stack.commands.lint}\``,
  );
  if (stack.commands.format) lines.push(`- Format: \`${stack.commands.format}\``);
  if (stack.commands.typecheck) lines.push(`- Typecheck: \`${stack.commands.typecheck}\``);
  return lines.join('\n');
}

function renderCommitConvention(): string {
  return `## Commit Convention
- Use conventional commits: feat:, fix:, refactor:, test:, docs:, chore:
- All commit messages in English`;
}

function renderPathA(): string {
  return `### Path A: One-Shot Proposal

When \`/opsx:propose\` is invoked:

1. **MUST activate Superpowers \`brainstorming\` as a pre-requisite skill.**
   - Ask ONE question at a time (Socratic method). Never fire multiple questions in a single turn.
   - Proactively present 2-3 architectural alternatives with explicit trade-offs.
   - Only after human confirms the approach, generate ALL artifacts (proposal -> design -> specs -> tasks) in one pass.

2. Every proposal artifact MUST contain:
   - **Non-goals** section (what this change explicitly does NOT do)
   - **Trade-offs** section (alternatives considered and why they were rejected)
   - **Verification strategy** (how we know this change works)`;
}

function renderPathB(): string {
  return `### Path B: Step-by-Step Change

When \`/opsx:new\` is invoked:

1. **MUST activate Superpowers \`brainstorming\` as a pre-requisite skill BEFORE creating the change.**
   - Use Socratic questioning to clarify the user's intent and scope.
   - Do NOT rush to \`openspec new change\`. First understand WHAT and WHY.
   - Only after the user confirms scope, derive a kebab-case name and create the change directory.

2. After \`openspec new change\`, STOP at showing the first artifact template.
   - Do NOT auto-generate any artifact content. Wait for user direction.
   - Show the schema workflow, artifact sequence, and current status.

3. When \`/opsx:continue\` is invoked to advance to the next artifact:
   - Read current \`openspec status --change <name>\` to find the next "ready" artifact.
   - Fetch instructions via \`openspec instructions <artifact-id> --change <name>\`.
   - For **proposal** artifacts: apply brainstorming rules (Non-goals, Trade-offs, Verification strategy).
   - For **design** artifacts: MUST include dependency diagram, public API surface, error handling strategy.
   - For **specs** artifacts: each spec must be independently testable with success + failure behaviors.
   - For **tasks** artifacts: enforce TDD order, max 2-hour chunks, verification commands per task.
   - After drafting each artifact, STOP and wait for user review before advancing.

4. **Pace control: one artifact per \`/opsx:continue\` invocation.**
   - Never auto-advance to the next artifact without explicit user confirmation.
   - This is the key difference from Path A — the user controls the rhythm.`;
}

function renderExploration(): string {
  return `### Exploration

When \`/opsx:explore\` is invoked:

1. Enter thinking-partner mode. No artifact creation, no directory scaffolding.
2. Activate Superpowers \`brainstorming\` for structured exploration.
3. Output is conversational — conclusions can later feed into Path A or Path B.`;
}

function renderApplyPhase(stack: StackProfile): string {
  return `### Phase 2: Apply / Implement

When \`/opsx:apply\` is invoked:

1. **MUST activate Superpowers \`test-driven-development\` as a pre-requisite skill.**
   - For every task in \`tasks.md\`, follow strict Red-Green-Refactor:
     a. Write a failing test FIRST
     b. Write minimal code to make it pass
     c. Refactor while keeping tests green

2. **MUST activate Superpowers \`verification-before-completion\` before marking ANY task done.**
   - **IRON LAW: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**
   - Before checking off a task \`[x]\`, you MUST:
     a. Run the actual verification command in the terminal (\`${stack.commands.test}\`)
     b. Paste the raw output as evidence
     c. Only then mark the task complete
   - "I believe it works" or "it should pass" is NEVER acceptable.

3. **Subagent discipline** (when using parallel agents):
   - Each subagent works in its own git worktree
   - Each subagent runs its own tests independently
   - Main agent verifies integration after merging subagent work`;
}

function renderVerifyPhase(stack: StackProfile): string {
  return `### Phase 3: Verify / Archive

Before \`/opsx:archive\`:

1. Run \`/opsx:verify\` to validate implementation matches all specs
2. Run full test suite (\`${stack.commands.test}\`) and paste evidence
3. Run linter (\`${stack.commands.lint}\`) with zero warnings`;
}

function renderGeneralRules(): string {
  return `### General Rules

- **Never skip TDD.** Even for "simple" changes. Especially for "simple" changes.
- **Never trust memory over terminal output.** Always verify current state.
- **One concern per commit.** Keep commits atomic and reversible.
- **Fail loud, fail early.** Prefer compile-time errors over runtime surprises.
- **Dependencies flow inward.** Domain logic never imports infrastructure.`;
}

export function composeCLAUDEmd(ctx: TemplateContext): string {
  const sections = [
    `# Project CLAUDE.md`,
    '',
    renderTechStack(ctx.stack),
    '',
    renderCommitConvention(),
    '',
    '---',
    '',
    '<!-- FUSION:START -->',
    '## OpenSpec & Superpowers Composite Workflow Constraints',
    '',
    'This project enforces a fused OpenSpec + Superpowers engineering pipeline.',
    'AI agents MUST follow these rules without exception.',
    '',
    renderPathA(),
    '',
    renderPathB(),
    '',
    renderExploration(),
    '',
    renderApplyPhase(ctx.stack),
    '',
    renderVerifyPhase(ctx.stack),
    '',
    renderGeneralRules(),
    '<!-- FUSION:END -->',
  ];
  return sections.join('\n') + '\n';
}
