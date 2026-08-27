import type { TemplateContext } from "../types.js";

export function composeFuseReviewSkill(ctx: TemplateContext): string {
  const { stack } = ctx;
  return `---
name: fusereview
description: Use when performing the post-apply code review (FuseReview, the fourth pipeline beat) — reviews the accumulated diff of the current change with a fresh context; also runs when the user asks to "code review", "review the change", or audit the implementation quality of recent work.
---

# FuseReview — Post-Apply Code Review

Fourth beat of the pipeline: Think reviews direction, Do produces code, **FuseReview reviews the implementation**, Verify validates the whole. This skill is guidance, not a checklist: follow the code, keep judgment active, and prefer one substantiated blocker over a list of nits.

This skill is **self-contained**. The review method below is complete within this file; it does not route to documents that may not exist in this project.

## Review object and preparation

1. The review object is the change's accumulated diff: \`git diff <baseline>..HEAD\`, where the baseline is the HEAD commit recorded in the change's state when \`/opsx:apply\` started. If no baseline is recorded, fall back to the merge-base of the current branch and the trunk, and annotate the fallback in the report.
2. The diff is an **index, not a boundary**: read enough surrounding code to understand the design — both sides of every changed interface, and the consumers of every changed symbol.
3. The reviewer SHOULD be a context that did not participate in the implementation (a fresh subagent or session), reading the diff cold. If none is available, run in the current session and annotate "non-cold-read" in the report.
4. Verify findings against \`openspec/specs/\` and the change's artifacts (design.md, tasks.md) — the specs are the behavioral baseline.

## The eleven checks

### [test-strength] Test strength

An assertion must fail on its intended regression. For each new or changed test, ask whether it verifies external state, logs, events, or observable behavior — or merely restates the implementation. Coverage proves lines ran, not that the feature works as shipped; a suite at full coverage can still be tautological. The recipe to prove a guard works: introduce the regression deliberately, watch the test fail, revert. A test that cannot be made to fail guards nothing.

### [missing-detection] Missing detection

Hunt what the diff should contain but does not: documentation or README updates accompanying changed behavior, tests for new error paths, release/cleanup logic for every new acquisition, spec scenarios with no implementation. Absence is invisible to any test run — only a standards-to-implementation walk finds it.

### [scope-fit] Scope fit

Map every new abstraction, function, option, or configuration key to a spec entry or a task. Code with no owner is scope creep. Flag speculative generality — machinery built for consumers that do not exist yet.

### [real-entry] Real entry path

Tests must exercise the shipped entry point — the real module load, CLI, or exported function as consumers use it. Hand-assembled internals prove the pieces move, not that the shipped path works.

### [interface-both-sides] Interface both sides

Trace both sides of every changed interface: callers and implementation, including errors, cancellation, and ownership. When one outcome has several representations (thrown, error event, null), the public surface must normalize them so consumers never guess which form arrives.

### [lifecycle-concurrency] Lifecycle and concurrency

Apply the seven defect classes:

1. **Orthogonal outcomes are reported independently** — a process can time out AND exit 0; surface each fact on its own, never nested inside another's branch.
2. **Honor contracts on both sides** — normalize multiple representations of one outcome before returning through the public API.
3. **Async state is not synchronous state** — completion races turn boundaries; never treat a shared "running" signal as the result of one operation; handle the "nothing to wait for" branch.
4. **Dispose must reach quiescence** — killing is not cleanup; await the children's exit, close listeners before killing so late completions stay silent.
5. **Contain callback exceptions in the dispatcher** — one bad subscriber must never break the core lifecycle.
6. **Never hand untrusted output ambient secrets or predictable paths** — scrub \`*KEY*\`/\`*SECRET*\`/\`*TOKEN*\` from spawned environments; use private temp paths with exclusive creation.
7. **Unlink link-shaped paths** — identify symlinks before removal; never let recursive deletion descend through a link into its target.

### [enforcement-paths] Enforcement paths

Follow every denial path to the operation that executes it, then look for direct or alternate callers that bypass the schema, facade, wrapper, or guard. An enforcement that a second call path can route around is not enforcement.

### [config-choices] Configuration choices

Every new default, public option, or imported external concept needs current-consumer evidence or prior art. Absent that, require an explicit choice or a documented deferral.

### [capability-consumer] Capability and consumer fit

Consumer-specific behavior must not leak into a general interface — and the inverse: a public method whose only caller is one internal consumer is needless API expansion; a private closure handed to that consumer suffices.

### [borrowed-state] Borrowed state and validation boundaries

For each retained value, ask whether it is borrowed or owned. Trust the type system at typed same-process boundaries; runtime validation belongs at the real boundaries — parsers, configuration loaders, persisted files, worker/process handoffs, and network input. Cache, echo, replay, and query views must trace back to one authoritative source.

### [boundary-values] Boundary values

Locate the owner of the complete emitted or retained result, including wrappers and metadata. Probe tiny and exact limits, oversized single items, and multibyte content against byte limits.

## Stack-adaptive checks

Review error paths and concurrency against this project's declared stack policies:

- **Error handling policy:** \`${stack.errorHandling}\` — new error paths must conform to it; deviations need justification in the diff or the change's design artifact.
- **Concurrency model:** \`${stack.concurrency}\` — lifecycle, cancellation, and shared-state checks must be reasoned through this model.

## Output discipline

- Every finding states **Defect / Location / Impact / Evidence**.
- Separate **Blocking** findings (must fix before Verify) from **Suggestion** findings (recorded, not enforced).
- Omit what a mechanical gate already enforces: if the stack's lint, test, or typecheck command covers a check and passes, do not re-raise it here.

## Handling findings

- **Blocking** findings are fixed test-first: write the failing test that would catch the defect, then fix.
- **Suggestions** are recorded in the apply completion report without enforcement.
- After fixes, re-review ONLY the fix diff. There is no second full review round — this is the termination condition.
`;
}
