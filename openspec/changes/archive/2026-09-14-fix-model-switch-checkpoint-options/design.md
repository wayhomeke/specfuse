## Context

See `proposal.md` — Why for motivation. The constraints that shape the approach:

- **The template layer is pure functions.** `src/templates/*.ts` assemble strings with no side effects; IO and merge policy live in `scaffolder.ts`. This change touches only the template layer, so it introduces no IO and no new failure branch.
- **The section is reachable only through `composeCLAUDEmd()`.** `renderApplyFuseReview`, `renderFuseQA`, and `renderVerifyPhase` are exported; `renderApplyPhase` is not. `tests/templates/claude-md.test.ts` imports named exports from `../../src/templates/claude-md.js`.
- **The generated text *is* the product.** This package ships prose instructions to an AI, not a runtime checkpoint. There is no code path that can validate an `AskUserQuestion` payload — the observable is the rendered string, so the unit under test is the rendered section and the assertion is on its content.
- **Root `CLAUDE.md` is a hand-merged copy of the same block — but not a byte-identical one.** It sits between `<!-- FUSION:START -->` / `<!-- FUSION:END -->` and carries the identical defect text, yet the two blocks already differ by one deliberate line: root replaces the template's stack-agnostic `Run the project's test command in the terminal` with this repo's concrete `npx vitest run (...)`. That specialization is what the stack-free design intends (the project's own toolchain declares the command), so **byte-equality is not a valid sync criterion** and a whole-block drift guard would report a permanent false positive. Verification of the sync must therefore be scoped to the checkpoint segment, which is the part this change owns.

## Goals / Non-Goals

**Goals:** the rendered checkpoint never instructs a single-option `AskUserQuestion` call; the switch path is one described behavior rather than two; the contract is directly assertable in a unit test; the template and the self-hosted `CLAUDE.md` agree for this block.

**Non-Goals** (design-level boundaries; see also `proposal.md` — Non-goals):

- **No runtime validation of `AskUserQuestion` arguments.** This package emits text and cannot intercept the tool call. The only available enforcement is the rendered instruction plus the spec.
- **No data structure driving the option list.** Two options hardcoded in a template string is the entire mechanism; an options array would be speculative generality for a four-item constant.
- **No changes to `scaffolder.ts` for the checkpoint concern itself**, and none to merge semantics or to file distribution.

  **Superseded during apply (authorized scope extension).** `src/scaffolder.ts` *was* modified, by a decision taken at the apply exit checkpoint rather than in this design: the repo's documented `npx eslint .` gate had no config and no installed ESLint, so the gate was built (see `tasks.md` §6). That work narrowed `trustDirectory()` and `mergeClaudeSettings()` from `any` to named interfaces, and — as FuseReview later caught — the narrowing silently swapped `if (!x) x = {}` for `??=`, dropping the self-heal on a falsy `projects` field. Reverted to the original semantics and covered by a new test (`tasks.md` §8). The boundary this bullet still holds: nothing about **merge semantics or file distribution** changed, and the checkpoint concern itself never needed a scaffolder change.

## Decisions

**D1 — Add a second generic option rather than listing model names.** Alternatives: (a) supply four options naming specific models; (b) two generic options; (c) keep one option and rely on the Other field. Chose **(b)**: the tool requires at least two, and the switch path already had a defined continuation (prompt `/model <name>`, then re-enter apply) which a generic second option reuses unchanged. **(a)** binds every generated project to identifiers that project never chose, contradicting the stack-free position established by `remove-stack-selection`. **(c)** is the defect itself.

**D2 — Merge the switch option and the Other field into one branch.** The current text describes the Other path only. Adding a second option without merging would produce two descriptions of the same continuation, which drift apart. One sentence covers both: select `切换模型` **or** enter a command via Other → prompt to run `/model <name>` → stop and wait for `/opsx:apply`.

**D3 — State the 2–4 bound in the rendered text.** The defect survived because nothing recorded the constraint. Putting the bound in the artifact makes a future edit that removes an option visibly wrong *at the point of edit*, instead of surfacing months later as a model's rejected tool call. Cost: one parenthetical.

**D4 — Export `renderApplyPhase()` rather than assert through `composeCLAUDEmd()`.** Alternatives: (a) named export; (b) substring assertions against the assembled document; (c) no test. Chose **(a)**. **(b)** couples the assertion to the entire document — an unrelated edit could satisfy or break it by accident, and isolating the section requires slicing on neighbouring headings. **(a)** matches the three sibling exports and yields a direct object. **(c)** contradicts the project's TDD rule.

**D5 — Assert the option count as a quantity.** Alternatives: (a) count `选项 N:` occurrences plus a presence check for `切换模型`; (b) match the exact option block; (c) assert only that `切换模型` appears. Chose **(a)**: the count is the schema-bound quantity, so assert the quantity. **(c)** would pass if a stray single-option list reappeared elsewhere; **(b)** is brittle to wording while the count is what the tool validates.

## Dependency diagram

```
composeCLAUDEmd(ctx)                              src/templates/claude-md.ts
  ├── renderCommitConvention()
  ├── renderDesignTokensRules()
  └── <!-- FUSION:START -->
      ├── renderPathA()
      ├── renderPathB()
      ├── renderExploration()
      ├── renderApplyPhase()        ◀── CHANGED: Step 0 rewritten; NEW export
      │     └── Step 0  Model Switch Checkpoint   ◀── defect site
      ├── renderApplyFuseReview()   [already exported]
      ├── renderFuseQA()            [already exported]
      ├── renderVerifyPhase()       [already exported]
      └── renderGeneralRules()
          <!-- FUSION:END -->

Consumers:
  scaffold()  ──writes──▶  <target>/CLAUDE.md        (unchanged path, unchanged merge)
  tests/templates/claude-md.test.ts  ──asserts──▶  renderApplyPhase()   (new seam)

Repo root CLAUDE.md  ◀── hand-merged copy of the FUSION block; synced by hand in this change
```

## Public API surface

One new export; no signature changes:

```ts
// src/templates/claude-md.ts
export function renderApplyPhase(): string
```

- **Input:** none — like its siblings `renderApplyFuseReview()`, `renderFuseQA()`, and `renderVerifyPhase()`, it takes no `TemplateContext`. Only visibility changes.
- **Output:** the Apply phase Markdown section, byte-identical to what `composeCLAUDEmd()` already emits.
- **Breaking:** no. A named export is additive, and the spec pins that assembly output is unchanged by it (Scenario: *Export does not alter assembly*).

## Error handling strategy

- This module performs no IO and throws nothing; there is no error path to add. `renderApplyPhase()` is total — it takes no input and always returns a string.
- The failure mode being fixed is **not** an exception in this package. It is an AI-side tool-call rejection caused by the *content* of the rendered instruction (a single-element `options` array). The mitigation is therefore content-level — name at least two options and state the bound — both of which the spec and the unit test pin down.
- Degradation when `AskUserQuestion` is entirely unavailable stays out of scope (`proposal.md` — Non-goals). No fallback is introduced, so no new failure branch exists.

## Risks / Trade-offs

- **[Risk]** The rendered 2–4 bound is prose; an AI could still emit one option. → **Mitigation:** the bound is stated at its point of use and pinned by a unit test on the template, so the template cannot silently regress. Runtime enforcement is impossible from this package (D3, Non-goals).
- **[Risk]** Root `CLAUDE.md` drifts from the template again. → **Mitigation:** none automated in this change (explicit Non-goal); the two are hand-synced here and the sync is verified segment-scoped (see Context for why whole-block comparison is invalid). Recorded as a known gap rather than left implicit.
- **[Risk]** Counting `选项 N:` couples the test to the current numbering style. → **Accepted:** the numbering *is* the contract surface the AI reads. If the style changes, the test should be revisited deliberately — that is the intended cost.
- **[Trade-off]** The block grows by one line in every generated project. → **Accepted:** one line, in exchange for removing a silent failure path.

## Migration Plan

- No data migration, no schema change, no runtime component.
- **Existing projects:** re-run `npm create specfuse@latest .`. `mergeFusionIntoCLAUDEmd()` replaces only the `FUSION` marker block, so edits outside the markers survive; this change adds no new merge behavior.
- **Rollback:** revert the commit. The template returns to the single-option text; no other shape changed.

## Open Questions

None. The two decisions that could have been deferred — the composition of the option set and whether to add a degradation protocol — were both resolved during brainstorming before artifacts were drafted.
