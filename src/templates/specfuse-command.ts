/**
 * Renders the unattended pipeline as Claude Code slash commands and as
 * dsh-invocable skills.
 *
 * The pipeline is prose, not a runtime: every ordering rule below is enforced
 * only by the model reading it. Keep clauses exact — the tests assert the
 * sentences that carry each requirement, because a looser paraphrase can drop
 * a prohibition (for example, "archive after verify" without "only when every
 * check passes") while every keyword still appears.
 *
 * Both modes share the same automatic-decision policy, TDD rules, verify gate,
 * and prohibitions. They differ only in the FuseQA posture, the execution
 * order, the worktree phase list, and the completion report. The Claude and
 * dsh variants differ only in their frontmatter, the way the requirement
 * arrives, and the harness-specific skill and verify paths.
 */
type SpecfuseMode = 'default' | 'full';
type Harness = 'claude' | 'dsh';

function verifyStep(harness: Harness): string {
  return harness === 'claude'
    ? 'Run the verify phase with `/opsx:verify <change>`, then the project\'s full test suite and the project\'s linter.'
    : 'Run the verify phase with `openspec validate <change> --strict` and the `openspec-verify-change` skill, then the project\'s full test suite and the project\'s linter.';
}

function defaultExecution(harness: Harness): string {
  return `### 4. FuseReview

Run the \`fusereview\` skill over the working-tree diff from the recorded baseline, including untracked files. Do not use \`baseline..HEAD\`: no commits are made. Fix Blocking findings test-first and re-review only the fix diff.

### 5. Verify

${verifyStep(harness)} Paste the raw output for each. Structural validation alone does not check implementation against specs.

### 6. Archive

Archive only when every verify check passes: run \`openspec archive <change> --yes\`. If any check still fails after best-effort repair, do not archive; leave the change directory in place and write each failure with its raw output into the final report.`;
}

function fullExecution(harness: Harness): string {
  return `### 4. FuseReview

Run the \`fusereview\` skill over the working-tree diff from the recorded baseline, including untracked files. Do not use \`baseline..HEAD\`: no commits are made. Fix Blocking findings test-first and re-review only the fix diff.

### 5. FuseQA

Run the \`fuseqa\` skill over the built artifact. Author E2E cases for this change's entry-point behavior and handle what they expose. It is a step, not a checkpoint: do not ask whether to enter it. Its new cases are included in the Verify full test run.

### 6. Verify

${verifyStep(harness)} Paste the raw output for each. Structural validation alone does not check implementation against specs.

### 7. Archive

Archive only when every verify check passes: run \`openspec archive <change> --yes\`. If any check still fails after best-effort repair, do not archive; leave the change directory in place and write each failure with its raw output into the final report.`;
}

function renderPipelineBody(mode: SpecfuseMode, harness: Harness): string {
  const full = mode === 'full';
  const isDsh = harness === 'dsh';
  const slug = full ? '/specfuse-full' : '/specfuse';
  const claudeSlug = full ? '/specfuse:full' : '/specfuse';
  const title = full
    ? isDsh
      ? '/specfuse-full — complete unattended pipeline'
      : '/specfuse:full — complete unattended pipeline'
    : '/specfuse — unattended pipeline';
  const fuseqaDecision = full
    ? isDsh
      ? '- **FuseQA:** record `auto: entered` and run the `fuseqa` skill (`.agents/skills/fuseqa/SKILL.md`) after FuseReview, before Verify. It is a step, not a checkpoint.'
      : '- **FuseQA:** record `auto: entered` and run the `fuseqa` skill after FuseReview, before Verify. It is a step, not a checkpoint.'
    : '- **FuseQA:** not part of the pipeline; do not invoke it. It remains available only through an explicit `/fuseqa` request.';
  const worktreePhases = full
    ? 'artifacts, apply, FuseReview, FuseQA, verify, and archive'
    : 'artifacts, apply, FuseReview, verify, and archive';
  const report = full
    ? 'State the change name and location, the artifacts written, the task count, verification output, the FuseReview decision (`auto: entered`), the FuseQA decision (`auto: entered`), the archive outcome, any worktree path, every automatic decision with its rationale, and that no commit and no push were performed.'
    : 'State the change name and location, the artifacts written, the task count, verification output, the FuseReview decision (`auto: entered`), the archive outcome, any worktree path, every automatic decision with its rationale, and that no commit and no push were performed. FuseQA is not part of the pipeline, so no FuseQA decision is recorded.';
  const execution = full ? fullExecution(harness) : defaultExecution(harness);
  const fusedocPath = isDsh ? '.agents/skills/fusedoc/SKILL.md' : '.claude/skills/fusedoc/SKILL.md';
  const questionRule = isDsh
    ? 'Do not ask the user a question at any decision point. Answer each with the recommended option and record the decision in the final report.'
    : 'Do not call AskUserQuestion at any decision point. Answer each with the recommended option and record the decision in the final report.';
  const applyRule = isDsh
    ? 'Apply strict Red-Green-Refactor: for every task, write the failing test first, make it pass, then refactor. Before checking off a task, run the project\'s test command and paste the raw output as evidence. Do not dispatch implementation subagents: their worktrees would require a merge, which auto mode forbids.'
    : 'Activate `test-driven-development` and `verification-before-completion`. For every task, write the failing test first, make it pass, then refactor. Before checking a task off, run the project\'s test command and paste the raw output as evidence. Do not dispatch implementation subagents: their worktrees would require a merge, which auto mode forbids.';
  const skillRootNote = isDsh
    ? '\n\nThe shared skills are installed under `.agents/skills/`: `design-md`, `fusedoc`, `fusereview`, and `fuseqa`.'
    : '';

  const invocation = isDsh
    ? `Run the ${full ? 'complete ' : 'full '}SpecFuse pipeline for the requirement text following \`${slug}\` in the user's message.`
    : `Run the ${full ? 'complete ' : 'full '}SpecFuse pipeline for: $ARGUMENTS`;
  const missing = isDsh
    ? `If no requirement text follows the invocation, print exactly \`${full ? 'SPECFUSE_FULL_USAGE: /specfuse-full' : 'SPECFUSE_USAGE: /specfuse'} <requirement description>\` and stop. Do not create a change or generate an artifact. Do not ask a question.`
    : `If \`$ARGUMENTS\` is empty, print usage as \`${claudeSlug} <requirement description>\` and stop. Do not create a change or generate an artifact. Do not ask a question.`;

  return `# ${title}

${invocation}

${missing}

## Automatic decisions

${questionRule}

- **Brainstorming:** derive 2–3 alternatives with trade-offs, select the recommended one, and write the selection and rationale into \`design.md\`.
- **Design tokens:** when the three-gate test triggers \`/design-md\`, answer the questionnaire with recommended values and generate \`DESIGN-TOKENS.md\`; never overwrite an existing \`DESIGN-TOKENS.md\`.
- **Model switch:** record \`continue with current model\`; do not switch and do not ask.
- **FuseReview:** record \`auto: entered\` and run the review.
${fuseqaDecision}
- **Pace control:** do not stop between artifacts for review.

## Execution order

### 0. Select the workspace

When a Git Worktree trigger condition is met, create and enter a dedicated worktree before writing anything, so every artifact stays inside it. If worktree creation fails, continue in the current working tree and record the fallback.

### 1. Create the change

Run \`openspec new change <kebab-case-name>\`. Record the current HEAD as the review baseline.

### 2. Generate the artifacts

Read \`openspec instructions <artifact-id> --change <name>\` for each artifact and write them in one pass, in this order: \`proposal.md\`, \`specs/\`, \`design.md\`, \`tasks.md\`. Artifact prose follows the FuseDoc standard at \`${fusedocPath}\`.${skillRootNote}

### 3. Apply

${applyRule}

${execution}

## Worktree isolation

When a Git Worktree trigger condition is met, the worktree is selected in step 0 and the entire pipeline runs inside it: ${worktreePhases}. Never merge the worktree back to the trunk; leave it in place for the user to inspect. If worktree creation fails, continue in the current working tree and record the fallback. Because auto mode does not commit, FuseReview reads the working-tree diff from the baseline, including untracked files.

## Prohibitions

- Never run \`git commit\`, \`git push\`, or \`git merge\`.
- Never skip TDD or verification evidence.
- Never archive after a failing verify.
- Never leave an automatic decision out of the final report.

## Final report

${report}
`;
}

function renderClaudeCommand(mode: SpecfuseMode): string {
  const full = mode === 'full';
  const description = full
    ? 'Run the complete SpecFuse pipeline unattended, including FuseQA, from brainstorming through archive'
    : 'Run the SpecFuse pipeline unattended, from brainstorming through archive';

  return `---
description: ${description}
argument-hint: <requirement description>
---

${renderPipelineBody(mode, 'claude')}`;
}

export function composeSpecfuseCommand(): string {
  return renderClaudeCommand('default');
}

export function composeSpecfuseFullCommand(): string {
  return renderClaudeCommand('full');
}

export function composeSpecfuseDshSkill(mode: SpecfuseMode): string {
  const full = mode === 'full';
  const name = full ? 'specfuse-full' : 'specfuse';
  const description = full
    ? 'Run the complete SpecFuse pipeline unattended, including FuseQA, from brainstorming through archive. Invoked as /specfuse-full.'
    : 'Run the SpecFuse pipeline unattended, from brainstorming through archive. Invoked as /specfuse.';

  return `---
name: ${name}
description: ${description}
disable-model-invocation: true
user-invocable: true
---

${renderPipelineBody(mode, 'dsh')}`;
}
