---
name: specfuse
description: Run the SpecFuse pipeline unattended, from brainstorming through archive. Invoked as /specfuse.
disable-model-invocation: true
user-invocable: true
---

# /specfuse — unattended pipeline

Run the full SpecFuse pipeline for the requirement text following `/specfuse` in the user's message.

If no requirement text follows the invocation, print exactly `SPECFUSE_USAGE: /specfuse <requirement description>` and stop. Do not create a change or generate an artifact. Do not ask a question.

## Automatic decisions

Do not ask the user a question at any decision point. Answer each with the recommended option and record the decision in the final report.

- **Brainstorming:** derive 2–3 alternatives with trade-offs, select the recommended one, and write the selection and rationale into `design.md`.
- **Design tokens:** when the three-gate test triggers `/design-md`, answer the questionnaire with recommended values and generate `DESIGN-TOKENS.md`; never overwrite an existing `DESIGN-TOKENS.md`.
- **Model switch:** record `continue with current model`; do not switch and do not ask.
- **FuseReview:** record `auto: entered` and run the review.
- **FuseQA:** not part of the pipeline; do not invoke it. It remains available only through an explicit `/fuseqa` request.
- **Pace control:** do not stop between artifacts for review.

## Execution order

### 0. Select the workspace

When a Git Worktree trigger condition is met, create and enter a dedicated worktree before writing anything, so every artifact stays inside it. If worktree creation fails, continue in the current working tree and record the fallback.

### 1. Create the change

Run `openspec new change <kebab-case-name>`. Record the current HEAD as the review baseline.

### 2. Generate the artifacts

Read `openspec instructions <artifact-id> --change <name>` for each artifact and write them in one pass, in this order: `proposal.md`, `specs/`, `design.md`, `tasks.md`. Artifact prose follows the FuseDoc standard at `.agents/skills/fusedoc/SKILL.md`.

The shared skills are installed under `.agents/skills/`: `design-md`, `fusedoc`, `fusereview`, and `fuseqa`.

### 3. Apply

Apply strict Red-Green-Refactor: for every task, write the failing test first, make it pass, then refactor. Before checking off a task, run the project's test command and paste the raw output as evidence. Do not dispatch implementation subagents: their worktrees would require a merge, which auto mode forbids.

### 4. FuseReview

Run the `fusereview` skill over the working-tree diff from the recorded baseline, including untracked files. Do not use `baseline..HEAD`: no commits are made. Fix Blocking findings test-first and re-review only the fix diff.

### 5. Verify

Run the verify phase with `openspec validate <change> --strict` and the `openspec-verify-change` skill, then the project's full test suite and the project's linter. Paste the raw output for each. Structural validation alone does not check implementation against specs.

### 6. Archive

Archive only when every verify check passes: run `openspec archive <change> --yes`. If any check still fails after best-effort repair, do not archive; leave the change directory in place and write each failure with its raw output into the final report.

## Worktree isolation

When a Git Worktree trigger condition is met, the worktree is selected in step 0 and the entire pipeline runs inside it: artifacts, apply, FuseReview, verify, and archive. Never merge the worktree back to the trunk; leave it in place for the user to inspect. If worktree creation fails, continue in the current working tree and record the fallback. Because auto mode does not commit, FuseReview reads the working-tree diff from the baseline, including untracked files.

## Prohibitions

- Never run `git commit`, `git push`, or `git merge`.
- Never skip TDD or verification evidence.
- Never archive after a failing verify.
- Never leave an automatic decision out of the final report.

## Final report

State the change name and location, the artifacts written, the task count, verification output, the FuseReview decision (`auto: entered`), the archive outcome, any worktree path, every automatic decision with its rationale, and that no commit and no push were performed. FuseQA is not part of the pipeline, so no FuseQA decision is recorded.
