import type { StackProfile, TemplateContext } from "../types.js";

function renderTechStack(stack: StackProfile): string {
  const lines = [
    "## Tech Stack",
    ...stack.languages.map((l) => `- Language: ${l}`),
  ];
  if (stack.framework) lines.push(`- Framework: ${stack.framework}`);
  lines.push(
    `- Architecture: ${stack.architecture}`,
    `- Build: \`${stack.commands.build}\``,
    `- Test: \`${stack.commands.test}\``,
    `- Lint: \`${stack.commands.lint}\``,
  );
  if (stack.commands.format)
    lines.push(`- Format: \`${stack.commands.format}\``);
  if (stack.commands.typecheck)
    lines.push(`- Typecheck: \`${stack.commands.typecheck}\``);
  return lines.join("\n");
}

function renderCommitConvention(): string {
  return `## Commit Convention
- Use conventional commits: feat:, fix:, refactor:, test:, docs:, chore:
- All commit messages in English`;
}

function renderDesignTokensRules(): string {
  return `## DESIGN-TOKENS.md Generation Rules

DESIGN-TOKENS.md 触发判定在 brainstorming 结束时执行，采用三道门依次评估（命中即停）：

- **Brainstorming auto-trigger (three-gate test, evaluated at brainstorming end):**
  - **Gate 1 — Primary trigger:** Does this change or project ship a UI consumed by an end user? Trigger if ANY: new WebUI / desktop GUI / mobile interface; modifying the visual presentation layer of an existing UI; deliverable embeds a frontend (SPA / templates / \`go:embed\` web assets). Examples — hit: a ping tool with a browser UI; miss: a pure API / CLI / backend service / library / script.
  - **Gate 2 — Exemption:** Skip if visual decisions are already settled elsewhere: a DESIGN-TOKENS.md already exists at project root AND this change does not touch the visual presentation layer; OR the change only moves API/logic/data with the UI visual layer fully unchanged; OR the project has a design system / component library this change merely consumes.
  - **Gate 3 — Intensity calibration (not a switch):**
    - **Strong intent** (user actively discussed palette / dark mode / brand archetype / component visual language / design references / mood during brainstorming) → invoke \`/design-md\` NOW. Questionnaire answers already have grounding in the brainstorming record.
    - **Weak intent** (only "has UI" was settled, no visual discussion) → STILL invoke \`/design-md\` NOW (Gate 1 hit), but BEFORE running the questionnaire, explicitly tell the user: "This change includes a user-facing UI, so DESIGN-TOKENS.md will be generated. However, visual design was NOT discussed during brainstorming — the following questionnaire will capture those decisions now." Then run the questionnaire. Do NOT silently extract answers the user never expressed.
  - **Default:** Gate 1 misses → do not invoke \`/design-md\`; resume the artifact flow directly.
- **Why trigger on "has UI" not "user expressed visual intent":** A WebUI project's visual tokens are an inevitable consequence of building the UI, not a function of whether the user raised visual topics in brainstorming. design.md and tasks.md reference DESIGN-TOKENS.md (archetype, fonts, status colors, primary scale), so the token file must exist before those artifacts are drafted — deferring generation to after artifacts creates dangling forward references in design.md and tasks.md.
- **Brownfield (manual):** Invoke \`/design-md\` to generate DESIGN-TOKENS.md for an existing project. The skill is installed at \`.claude/skills/design-md/SKILL.md\`.
- **Never overwrite silently:** If DESIGN-TOKENS.md already exists, always prompt for confirmation and create a \`.bak\` backup before overwriting.`;
}

function renderPathA(): string {
  return `### Path A: One-Shot Proposal

When \`/opsx:propose\` is invoked:

1. **MUST activate Superpowers \`brainstorming\` as a pre-requisite skill.**
   - Ask ONE question at a time (Socratic method). Never fire multiple questions in a single turn.
   - Proactively present 2-3 architectural alternatives with explicit trade-offs.
   - **STOP brainstorming BEFORE its "Write design doc" step (step 6).** Do NOT write to \`docs/superpowers/specs/\`. All spec files are managed exclusively by OpenSpec.
   - **If the three-gate test (see DESIGN-TOKENS.md Generation Rules above) triggers:** MUST invoke \`/design-md\` skill NOW (before generating artifacts). For weak intent, state that visual design was not discussed in brainstorming before running the questionnaire. Complete the questionnaire → generate DESIGN-TOKENS.md → THEN proceed.
   - Only after human confirms the approach, generate ALL artifacts (proposal -> design -> specs -> tasks) in one pass.

2. Every proposal artifact MUST contain:
   - **Non-goals** section (what this change explicitly does NOT do)
   - **Trade-offs** section (alternatives considered and why they were rejected)
   - **Verification strategy** (how we know this change works)`;
}

function renderPathB(): string {
  return `### Path B: Step-by-Step Change

When \`/opsx:new\` is invoked:

1. Follow the \`openspec-new-change\` skill steps normally: ask what to build, create the change directory, show status.

2. **BEFORE drafting the first artifact (proposal), MUST activate Superpowers \`brainstorming\`.**
   - Use Socratic questioning to clarify scope, non-goals, and trade-offs.
   - **STOP brainstorming BEFORE its "Write design doc" step (step 6).** Do NOT write to \`docs/superpowers/specs/\`. All spec files are managed exclusively by OpenSpec.
   - **If the three-gate test (see DESIGN-TOKENS.md Generation Rules above) triggers:** MUST invoke \`/design-md\` skill NOW (before drafting proposal). For weak intent, state that visual design was not discussed in brainstorming before running the questionnaire. Complete the questionnaire → generate DESIGN-TOKENS.md → THEN proceed.
   - Only after the user confirms the approach, draft the proposal artifact.

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
3. Output is conversational — conclusions can later feed into Path A or Path B.

4. **Worktree isolation (exploration):**
   When exploration needs to produce actual code (PoC, prototype), SHOULD create a worktree:
   - Exploration may generate substantial code that will ultimately be discarded
   - Exploration involves modifying existing code to validate hypotheses
   Discarding a worktree costs zero — prevents exploration artifacts from polluting the main branch.`;
}

function renderApplyPhase(stack: StackProfile): string {
  return `### Phase 2: Apply / Implement

When \`/opsx:apply\` is invoked:

0. **Model Switch Checkpoint (模型切换节拍)**
   - 进入实施阶段前，AI MUST 使用 AskUserQuestion 工具询问用户是否切换模型。
   - 选项设置：
     - 选项 1: "继续使用当前模型"（描述：不切换，直接开始实施）
     - Other 输入框提示："输入切换命令，如 /model sonnet、/model glm、/model ds"
   - 如果用户选择 "继续使用当前模型"，直接进入步骤 1。
   - 如果用户通过 Other 输入了模型名称，AI 提示用户手动执行 \`/model <name>\` 命令，然后重新执行 \`/opsx:apply\` 以从步骤 1 开始。AI 此时 MUST 停止，不继续执行后续步骤。
   - 此步骤不可跳过，必须等待用户明确选择后才执行后续步骤。

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
   - Main agent verifies integration after merging subagent work

4. **Subagent-Driven Development trigger conditions:**
   When ALL of the following are met, SHOULD enable subagent mode:
   - \`tasks.md\` contains ≥ 6 pending implementation tasks
   - Most tasks have no \`blocked by\` dependency on each other
   - Tasks map to different modules/files with clear module boundaries
   - Session context window is >40% consumed

   Execution discipline when enabled:
   - Each subagent works in its own isolated git worktree
   - Each subagent independently follows TDD and runs its own tests
   - Main agent performs two-stage review per subagent output (spec compliance → FuseReview skill via \`.claude/skills/fusereview/SKILL.md\`, executed on the subagent's diff before merge)
   - Main agent runs full integration tests after merging
   - Subagents MUST NOT implement the same module in parallel; independent modules may be parallelized

5. **Git Worktree isolation trigger conditions:**
   When ANY of the following are met, SHOULD create a worktree before apply begins:
   - Change involves destructive refactoring (replacing core modules, migrating data structures)
   - Multiple \`/opsx:new\` changes are being worked on in parallel
   - Rollback cost of failure is high (change affects multiple consumers)

   Worktree is NOT needed when:
   - Single-file bugfix
   - Adding a new independent module (no impact on existing code)
   - Documentation or configuration adjustments`;
}

export function renderApplyFuseReview(): string {
  return `### Phase 2.5: FuseReview Checkpoint (Post-Apply)

FuseReview is the fourth beat: Think reviews direction, Do produces code, **FuseReview reviews the implementation**, Verify validates the whole. The full review method lives in \`.claude/skills/fusereview/SKILL.md\`.

**Baseline:** At apply start, record the current HEAD commit in the change's state as the review baseline. The review object is \`baseline..HEAD\`. If no baseline was recorded, fall back to the merge-base of the current branch and the trunk, and annotate the fallback in the report.

**Checkpoint (mandatory question):** After the last task in \`tasks.md\` passes verification, the AI MUST ask the user whether to enter FuseReview. Silent advancement to \`/opsx:verify\` or \`/opsx:archive\` is forbidden — the question may be answered "no", but it may never be skipped.

**Present facts, do not judge:** The checkpoint question lists the change facts — task count, whether subagent mode was used, and the modules touched. A recommendation may be attached, but the decision belongs to the user. There are no automatic trigger thresholds: no task-count cutoff, no automatic change-classification heuristics of any kind.

**If the user accepts:** dispatch a reviewer context that did not participate in the implementation (fresh subagent or session) to cold-read \`baseline..HEAD\` and execute the FuseReview skill. If no separate context is available, run in the current session and annotate "non-cold-read".

**If the user declines:** record the skip decision in the apply completion report together with the change facts (task count, subagent usage, modules), so the skip is auditable rather than invisible.

**Handling findings:**
- **Blocking** findings are fixed test-first: write the failing test that catches the defect, then fix.
- **Suggestions** are recorded in the apply completion report without enforcement.
- After fixes, re-review ONLY the fix diff. There is no second full review round — this is the termination condition.

**Merge gate (subagent mode):** in subagent mode the second stage of the two-stage review executes the FuseReview skill on each subagent's diff before merge, automatically, without a user checkpoint.

**Manual invocation:** the user may invoke the FuseReview skill explicitly at any time, independent of the checkpoint.`;
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

- **Always run \`openspec\` commands from the project root directory.**
- **Never skip TDD.** Even for "simple" changes. Especially for "simple" changes.
- **Never trust memory over terminal output.** Always verify current state.
- **One concern per commit.** Keep commits atomic and reversible.
- **Fail loud, fail early.** Prefer compile-time errors over runtime surprises.
- **Dependencies flow inward.** Domain logic never imports infrastructure.`;
}

export function composeCLAUDEmd(ctx: TemplateContext): string {
  const sections = [
    `# Project CLAUDE.md`,
    "",
    renderTechStack(ctx.stack),
    "",
    renderCommitConvention(),
    "",
    renderDesignTokensRules(),
    "",
    "---",
    "",
    "<!-- FUSION:START -->",
    "## OpenSpec & Superpowers Composite Workflow Constraints",
    "",
    "This project enforces a fused OpenSpec + Superpowers engineering pipeline.",
    "AI agents MUST follow these rules without exception.",
    "",
    renderPathA(),
    "",
    renderPathB(),
    "",
    renderExploration(),
    "",
    renderApplyPhase(ctx.stack),
    "",
    renderApplyFuseReview(),
    "",
    renderVerifyPhase(ctx.stack),
    "",
    renderGeneralRules(),
    "<!-- FUSION:END -->",
  ];
  return sections.join("\n") + "\n";
}
