export function composeGrillMeSkill(): string {
  return `---
name: grill-me
description: Pre-apply review — stress-test all artifacts before implementation. Use when artifacts are complete and you want a structured review before /opsx:apply.
---

# Pre-Apply Review (Grill)

Activate the review. The full method is self-contained in this skill; the CLAUDE.md "Pre-Apply Review (Grill)" protocol governs project-level discipline (classification, backup, rollback).

## Discipline (every question)

- Ask ONE question at a time.
- Every question carries artifact evidence (file:line + specific scenario) — no evidence, no question. This is what keeps the review dense instead of formalistic.
- Every question includes a recommended answer.
- Classify each issue as [blocking] or [non-blocking].
- Soft limit: After 9 questions, self-assess whether remaining issues are blocking-level. If none remain, proceed to summary.

## Flow

1. **Backup**: Copy the change directory to \`.grill-backup/\` before grill begins. Clean stale backups if present.
2. **Review**: All artifacts (proposal, design, specs, tasks) one question at a time.
3. **Write**: On acceptance, show the final diff before any write, then modify the artifact.
4. **Consistency scan**: Run the bidirectional scan before summary.
5. **Summary**: Output the review summary and prompt \`/opsx:apply\`.
6. **Cleanup**: Delete \`.grill-backup/\` after successful completion.

## Review Surfaces (by artifact group — discovery perspectives, not mandatory per-item questions)

[proposal.md]
- Scope clarity — non-goals present and unambiguous
- Trade-off reality — each trade-off names rejected alternatives and reasons
- Verification executable — the verification strategy can actually run
- Problem validity — diagnoses a real problem, not an invented one

[design.md]
- Signature contract — every declared input has a source and a consumer (signature substitution)
- Dependency direction — domain never imports adapters; arrows point inward
- State & concurrency — shared state, lifecycle, who holds the lock
- Config defaults — every flag has a default, a range, and fallback behavior
- Error ownership — every failure class has a handling layer

[specs/]
- Independently testable — success and failure behaviors both present
- Boundary conditions — empty, over-limit, boundary values
- Input slot — every spec WHEN input maps to a parameter slot in a declared signature
- Assertion strength — scenarios prove an input took effect, not merely an output shell
- Terminology consistent — same concept, same name across specs
- Preconditions explicit — implied state assumptions written out

[tasks/]
- Verifiable — "done" is checkable by a command
- TDD order — failing test first, then implementation
- Spec trace — every spec scenario has a corresponding task, and vice versa
- Granularity — chunks ≤ 2h with correct dependencies

## Check Tools (trigger-based, not run every round)

- **Signature substitution** — for each public signature ask: where does each input come from, who constructs it, who consumes it?
- **Bidirectional parameter flow** — spec input → design parameter slot; design parameter → spec scenario
- **Implementation rehearsal** — for each signature ask: "can I write this now and satisfy the spec?"

## Boundary Discipline

- **Assertion-strength triage**: presentation defect (behavior already defined in proposal/design) → strengthen the THEN; requirements defect (behavior never defined) → route to Think/user, never invent.
- **Consistency scan runs both directions**: proposal → specs/tasks (forward) and spec inputs → design signature slots (reverse).
- **Exit commands**: \`grill-stop\` (keep changes), \`grill-abort\` (rollback from \`.grill-backup/\`).
`;
}
