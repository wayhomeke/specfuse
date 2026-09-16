import type { TemplateContext } from '../types.js';

export function composeFuseQASkill(_ctx: TemplateContext): string {
  return `---
name: fuseqa
description: Use when performing post-apply E2E verification (FuseQA) — derives end-to-end cases for the current change from its specs and drives them through real user entry points against the built artifact; also runs when the user asks to "write e2e tests", "end-to-end tests", "QA acceptance", or to add test cases for a change.
---

# FuseQA — Post-Apply E2E Verification

Think reviews direction, Do produces code, FuseReview reviews the implementation, **FuseQA verifies the artifact through real entry points**, Verify validates the whole.

This beat authors E2E cases for the current change and handles what those cases expose. It **does not execute the existing regression suite** — that belongs to the Verify phase full test run. A new case failing on first run is the TDD RED step, not a diagnosis stage.

**What makes this beat necessary:** unit tests cover source, cold-read review runs nothing, and the Verify phase runs the same unit suite. A defect can pass all of them and still reach users. The canonical shape: an entry-guard that compares a resolved module path against an unresolved \`argv[1]\` works when the built file is invoked by its real path and silently does nothing when invoked through a symlinked bin shim — typecheck, unit tests and diff review all pass.

---

## §1 The artifact-shape decision tree

Never ask "what framework should I use". Ask these three, in order. They resolve any artifact shape, including shapes absent from the recipes below.

1. **How does the user obtain this artifact?** — npm install / downloaded binary / a URL / a container image / it is read by another program.
2. **How is the artifact triggered once obtained?** — a command line, an import, an HTTP request, a browser opening it, **or being read by another program**.
3. **What is externally observable after triggering?** — exit code, stdout/stderr, return value across the published boundary, HTTP status and body, DOM state, files written.

**Artifacts with no executable entry point are verified through their real consumer.** A generated config, a token file, a template pack cannot be "run" — question 2 lands on the "read by another program" branch, and the case drives that consumer. Asserting on the file's text is a unit test, not an E2E case.

**Unknown shapes are derived, never declared untestable.** If a shape has no recipe here, answer the three questions, then record the conclusion in the case's \`entry\` field so the derivation is auditable and can graduate into a new recipe.

---

## §2 The case contract

Every case declares five fields (schema: \`templates/_case-schema.yaml\`):

| Field | Meaning |
|---|---|
| \`artifact\` | What is under test — the build output or an installed package. **Never a source path.** |
| \`entry\` | The user-reachable entry. **Never a function name.** |
| \`isolation\` | Temp directory / dedicated port / fresh browser context. |
| \`observable\` | The external signal asserted on. |
| \`traces-to\` | The spec Scenario it derives from, or the escaped defect it was written for. |

Two hard rules, both mechanically checkable:

- **No importing project source.** A case that imports from \`../src/\` is not a FuseQA case — it is a unit test wearing a costume. This is grep-checkable, so it is checked.
- **The artifact under test is the build output, not the source.** TDD covers \`src/\`; FuseQA covers what ships. The bin-shim entry-guard defect above passes at source level and fails as a built artifact — that gap is this beat's whole subject.

---

## §3 Entry recipes

The recipes fix the **contract**, not the tool. Use the project's existing test stack — do not introduce a second test framework for E2E.

**CLI** — spawn a real subprocess with argv; assert exit code, stdout, files written. **Must cover invocation through a symlinked bin shim**, not only the real path: package managers install binaries as symlinks, and that path has its own failure mode.

**HTTP API** — issue a real request against a live port. Calling the handler function directly is forbidden: it skips routing, middleware, serialization and the error mapper, which is where the defects live.

**WebUI** — drive a real browser against a served page. Asserting on mounted component props is forbidden — that is a unit test. See §4 for environment self-check.

**Library** — import from the build output via the paths declared in \`package.json\` \`exports\`, never internal source paths. The published contract is what users get; an internal path that works while the declared export is broken is the exact defect class this catches.

**Data artifact** (config, tokens, templates, generated docs) — hand it to its real consumer and assert on the consumer's behavior.

---

## §4 Browser cases: self-check and skip visibly

A missing browser binary means **cannot execute**, which is not the same as **failed**. Conflating them turns a browserless CI red, and the standard response to that is disabling the suite — worse than having no E2E at all.

- Detect the browser binary first; if absent, **skip rather than fail**.
- **Print the reason** so the skip is visible in the output, never silent.
- An unexecutable case MUST NOT turn the regression gate red.

---

## §5 Deriving cases beyond the happy path

Functional cases come from spec Scenarios; these techniques come from QA practice and apply to any project (checklist: \`templates/derivation-checklist.md\`):

- **Equivalence partitioning with boundary values** — empty, one, many, maximum, over-limit, malformed.
- **State transitions** — uninitialized → initializing → initialized; and **idempotence on repeat**: run the same command twice.
- **Concurrency and races** — two real processes touching one resource. Unlocked read-modify-write on a shared file is the classic; this only reproduces with real processes, which is why no unit test finds it.
- **Error injection** — dependency unreachable, permission denied, disk full, timeout.
- **Re-entry after interruption** — kill mid-run, run again.

**Read the change proposal's Non-goals as an out-of-scope boundary.** Writing a case against behavior the proposal explicitly excluded manufactures a false failure. specs say what must work; Non-goals say what must not be tested.

---

## §6 Findings: attribute first, then grade

A red case carries evidence but its cause is undetermined. Attribution is usually cheap — run the artifact two ways and compare.

- **Implementation defect → Blocking.** The red case IS the failing test; fix the implementation.
- **Spec gap → Suggestion** by default; escalate to Blocking if the undefined behavior breaks something users see.
- **False red → case debt**, outside the grading. Fix or remove the case and record **why the implementation is correct**, with evidence. "The test was wrong" alone is not an attribution.
- **Attribution over its time box → Suggestion.** Never hold up apply completion on an unresolved attribution.

---

## §7 The ledger

Cases live in \`tests/e2e/<capability>/\`, the capability name matching \`openspec/specs/<capability>/\`. Record every lifecycle event (format: \`templates/ledger.md\`):

- **Addition** — its \`traces-to\` source.
- **Correction** — why the original judgment was wrong.
- **Removal** — why the case is no longer valid. Without a reason, "deleting a red case" and "hiding a defect" look identical in the ledger.

A suite that only grows rots: cases outlive their requirements, drift into permanent red, and get skipped wholesale. Retirement with a recorded reason is what keeps the suite trustworthy.
`;
}
