# E2E case ledger

Format: `.claude/skills/fuseqa/templates/ledger.md`. Cases live in
`tests/e2e/<capability>/`, aligned by name with `openspec/specs/<capability>/`.

## Addition — 2026-09-08 (change: add-fuseqa-phase)

| Field | Content |
|---|---|
| Case | `tests/e2e/scaffold-tool-boundary/skill-distribution.test.ts` (5 cases) |
| Capability | `scaffold-tool-boundary` |
| Traces to | spec `fuseqa-skill-generation` / Scenarios "Scaffolder distributes the skill and its templates without overwriting", "Templates ship in the build output"; plus the escaped-backtick defect found during this change |
| Shape | CLI — real subprocess with argv, plus the symlinked bin shim path |

Covers: skill + four templates installed; CLAUDE.md section ordering
(FuseReview < FuseQA < Verify); no escaped backticks in generated markdown;
user-authored skill preserved while templates still copy; invocation through a
symlinked bin shim.

**Why these cannot be unit tests:** `tests/scaffolder.test.ts` imports
`scaffold()` and mocks `utils/tools.js`, so it exercises source in-process with
the OpenSpec calls stubbed. It cannot observe whether the *built* artifact
resolves `dist/fuseqa/templates`, which the build script produces rather than
`tsc` — a build-script regression is invisible to it. That gap is exactly what
shipped as v0.9.0's escaped entry-guard defect.

## Correction — 2026-09-08 (same change, superseded below)

| Field | Content |
|---|---|
| Case | all cases in `skill-distribution.test.ts` |
| What changed | added an explicit 30s per-case timeout |
| Why the original was wrong | judged the ~4.2s per case to be inherent to running the artifact as a user |
| Status | **Wrong attribution. Superseded by the correction below.** |

## Correction — 2026-09-08 (supersedes the above; found by FuseReview cold read)

| Field | Content |
|---|---|
| Case | all cases in `skill-distribution.test.ts` |
| What changed | scratch `HOME` + `XDG_CONFIG_HOME`, a `PATH` with OpenSpec removed, a stub `npm` that exits non-zero, git identity via env; added a guard case asserting home-directory writes stay inside the scratch HOME; **removed all five 30s timeouts** |
| Why the original was wrong | the cost was never "running the artifact as a user". `--yes` implies `initOpenspec`, so every case ran `npm install -g @fission-ai/openspec`, rewrote `~/.config/openspec/config.json` and appended to `~/.claude.json`. The cases mutated the developer's machine — a cold-read reviewer measured its own global `openspec` being upgraded 1.3.1 → 1.12.0 by a test run. The `isolation` field claimed "fresh temp directory per case", which was false for all of it. The 30s timeout masked this rather than addressing it. |
| Evidence the implementation is correct | no product change was made. Template distribution through the real entry point is unaffected: all four templates still arrive via the built `dist/index.js`, including through the symlinked bin shim. With isolation added the suite drops from ~25s to ~2.7s and passes under vitest's default 5s timeout, so no exemption is needed. Attribution: **case debt** — but a different defect than first recorded. |
| Coverage boundary | A consequence of the narrowed `PATH` and stub `npm`: these cases now always take the "OpenSpec not installed" warning branch. The openspec-present path is NOT covered here — `tests/scaffolder.test.ts` exercises the `initOpenspec` branches in-process with `utils/tools.js` mocked. No case in this file ever asserted on OpenSpec init results, so nothing was lost; recorded so a future reader does not assume otherwise. |
| Guard verification | removing the `HOME` override turns the new guard red; restoring it turns it green. The first version of this guard did NOT go red when isolation was broken (it observed ambient files the subprocess env could not affect) and was rewritten — a hollow assertion caught before it was trusted. |

## Notes on cost

After isolation, the five E2E cases cost ~2.7s total (~0.4s each) and the full
suite runs in ~5s. The earlier ~4.2s per case was the unsandboxed global work,
not process spawn and not the `openspec --version` probe (which costs ~0.4s).


## FuseQA checkpoint decision — 2026-09-08 (change: add-fuseqa-phase)

**Decision: declined.** Recorded with the change facts so the skip is auditable
rather than invisible.

| Fact | Value |
|---|---|
| Touched a user-observable entry point | Yes — `scaffolder.ts` (template distribution), `claude-md.ts` (generated CLAUDE.md content and section order), `claude-settings.ts` (generated permissions), plus four newly distributed template files |
| Capabilities affected | `fuseqa-checkpoint`, `fuseqa-skill-generation`, `apply-exit-checkpoint` (delta) |
| E2E case count at decision time | 6, all under `tests/e2e/scaffold-tool-boundary/` |
| Cases authored during this change | 6 (task 7.6) — this change implements FuseQA itself, so its cases doubled as the templates' usability test |

**Known coverage gaps left open by declining:**

1. The OpenSpec-present branch is not covered end-to-end. Isolating the global
   side effects (narrowed `PATH`, stub `npm`) means every case takes the
   "OpenSpec not installed" warning path. The `initOpenspec` branches are
   covered in-process by `tests/scaffolder.test.ts` with `utils/tools.js` mocked.
2. `composeClaudeSettings()` permission changes have template-layer unit
   assertions only — no case verifies the generated `settings.local.json` inside
   a real scaffolded project.

Neither gap is a known defect; both are untested surface. Recorded here so a
future change can pick them up deliberately rather than rediscovering them.

## Addition — 2026-09-11 (change: openspec-init-failure-visibility)

| Field | Content |
|---|---|
| Case | `tests/e2e/openspec-readiness-reporting/success-path.test.ts` (2 cases) |
| Capability | `openspec-readiness-reporting` |
| Traces to | spec Scenarios "Line is verbatim when OpenSpec is ready" and "No notice on the success path" |
| Shape | CLI — real subprocess with argv, real OpenSpec CLI reachable, scratch HOME |

Covers the **success** path, which no other test reaches end to end: the unit
suite mocks `utils/tools.js`, so `initOpenspec` returning true is an assumption
rather than an observation, and the pre-existing E2E suite is permanently on the
install-failed path (narrowed `PATH`, stub `npm`).

**Why it is not a duplicate of the unit tests.** Mutating the scaffolder to
report `'ready'` regardless of the real init result — the one defect class a mock
cannot see — turns this case red on `existsSync(<project>/.claude/commands/opsx)`
(`expected false to be true`), while the unit suite stays green. A mocked "ready"
cannot distinguish a working init from a no-op; only running the real CLI can.

**Timeout:** 60s per case, because a real `openspec init` costs ~5.7s, above
vitest's 5s default. This is inherent to the path under observation, not case
debt — the work being paid for is the thing being verified. Full suite goes from
~5s to ~16s as a result.

**Environment self-check:** the suite skips with a printed reason when the
OpenSpec CLI is not on `PATH` — "cannot execute" is not "failed", and an
unexecutable case must not turn the regression gate red.

**Isolation:** scratch `HOME`/`XDG_CONFIG_HOME` per file. Verified the real
`openspec init` and the trust-list write land inside it: `~/.claude.json`
project count unchanged (1493) and `~/.config/openspec/config.json` mtime
unchanged across runs.

## Known gap recorded, not fixed (change: openspec-init-failure-visibility)

The **unit** suite still writes trust entries into the developer's real
`~/.claude.json` — measured at ~35 rows per full run, of which ~16 come from the
suites added by this change. `trustDirectory()` calls `os.homedir()`, which
ignores an in-process `process.env.HOME` reassignment, so unit tests cannot
isolate it the way subprocess-based E2E cases do.

Deferred deliberately: the fix requires changing `trustDirectory()`'s signature
(inject the path), which is a production interface change orthogonal to making a
failure visible. "Pre-existing" alone is not a sufficient reason — this change
roughly doubles the leak rate — so the reason on record is the scope boundary,
with the rate quantified here so a follow-up change has a baseline.

## Correction — 2026-09-14 (supersedes the premise of the "Known gap" section above)

| Field | Content |
|---|---|
| Claim corrected | The "Known gap" premise: "`trustDirectory()` calls `os.homedir()`, which ignores an in-process `process.env.HOME` reassignment, so unit tests cannot isolate it the way subprocess-based E2E cases do." |
| What changed | No product change. This entry records that the premise was **false**, so the gap was never un-isolatable and the recorded deferral rested on a wrong reason. The "~35 entries per full run" figure is **not** in question — it is confirmed exactly. |
| Why the original was wrong | On POSIX, `os.homedir()` reads `process.env.HOME` at call time. Measured on this machine: `HOME=/scratch node -e "…os.homedir()"` → `/scratch`, and an in-process `process.env.HOME='/x/y'` → `/x/y` as well. Either redirects the write. Whatever version produced the original note, this one does not behave that way. |
| Evidence | A full unit+E2E run with `HOME=<scratch>` wrote **exactly 35** `projects` entries into the scratch `.claude.json` (all `/tmp/fusion-*` paths) while the developer's real `~/.claude.json` stayed at **4** entries with **0** temp entries. Isolation holds and the rate is pinned. |
| How to apply | Run the suite with `HOME` (and `XDG_CONFIG_HOME`) pointing at a scratch directory to keep the trust write off the developer's machine. **No `trustDirectory()` signature change is required for isolation** — so the previously recorded blocker no longer justifies deferring a follow-up. |
| Still unexplained | Why the real `~/.claude.json` holds **0** such entries today despite ~35 being written per run. "Claude Code prunes entries whose directories no longer exist" is consistent with the observation but is **unverified** and undocumented. |
| Cost of running it | The race that remains is not the trust write itself but two processes doing unlocked read-modify-write on one file. Even with `HOME` redirected, running the suite concurrently with a live Claude Code session pointed at the same `HOME` would carry it. |

**Related, noticed while writing this entry:** this ledger's header cites its format
from `.claude/skills/fuseqa/templates/ledger.md`, and the project `CLAUDE.md`
points at `.claude/skills/fuseqa/SKILL.md`. **Neither path exists in this
repository** — the project self-hosts `design-md` and `fusereview` but not
`fuseqa`. Two dangling references to a skill this project generates for others.
Recorded, not fixed here.

## Addition — 2026-09-14 (change: fix-model-switch-checkpoint-options)

| Field | Content |
|---|---|
| Case | `tests/e2e/model-switch-checkpoint/shipped-checkpoint.test.ts` (3 cases) |
| Capability | `model-switch-checkpoint` |
| Traces to | spec `model-switch-checkpoint` / Scenarios "At least two options are named", "Switch and Other share one behavior", "The 2–4 bound is asserted in the rendered text"; plus the proposal's Impact statement that already-initialized projects receive the fix by re-running the scaffolder |
| Shape | CLI — real subprocess through a **symlinked bin shim**, against the built `dist/index.js`; the observable is the generated `CLAUDE.md` (the CLI recipe sanctions "files written") |

Covers three paths the unit suite cannot reach:

1. **The shipped artifact.** `tests/templates/claude-md.test.ts` asserts
   `renderApplyPhase()` from `src/`. Between that and what a user receives sit
   `tsc` and the build script's template-copy loop. A build/merge regression is
   invisible to a source-level assertion — the class that produced v0.9.0's
   escaped-backtick defect.
2. **The brownfield merge.** `npm create specfuse@latest .` against a directory
   whose `CLAUDE.md` already carries a stale, single-option FUSION block. This is
   the migration path named in the proposal and **no other case covered it**.
   It also asserts that user text outside the markers survives.
3. **Idempotence on repeat.** The same command twice; the merge slices by marker
   index, so a second pass is where duplication would surface.

**Counter-example verification (the cases are not hollow).** Reverting the
template's Step 0 to its pre-fix text, rebuilding, and re-running turned all
three red with the expected reasons:
`expected 1 to be greater than or equal to 2` (×2) and
`expected [ '继续使用当前模型' ] to include '切换模型'`. Restoring the fix and
rebuilding returns them green. A case that passes on first run and cannot be
made to fail guards nothing.

**Isolation:** scratch `HOME`/`XDG_CONFIG_HOME`, OpenSpec off `PATH`, stub `npm`
exiting non-zero, git identity via env — the recipe from
`scaffold-tool-boundary/skill-distribution.test.ts`. `--yes` implies
`initOpenspec`, so without it these cases would install a global package and
write the developer's `~/.claude.json`.

**Derivation limit, recorded rather than assumed:** the real consumer of the
generated `CLAUDE.md` is a coding agent reading instructions, which cannot be
driven from a test. The case therefore stops at "the corrected section is in the
file the user's project receives". That is the strongest entry available for this
artifact shape, and the conclusion is recorded here so a future reader does not
mistake it for full end-to-end coverage of the checkpoint's behaviour.

## Addition — 2026-09-16 (change: add-fusedoc-skill)

| Field | Content |
|---|---|
| Case | `tests/e2e/fusedoc-skill-generation/install.test.ts` (7 cases) |
| Capability | `fusedoc-skill-generation` |
| Traces to | spec `fusedoc-skill-generation` / Scenarios "Skill reaches the target through the published artifact", "Reference files ship with the skill", "Every reference link resolves"; spec `fusedoc-integration` / Scenario "No third checkpoint question" |
| Shape | CLI — real subprocess with argv, plus the symlinked bin shim path |

Covers: skill + three reference files installed; every `references/*.md` link
resolving inside the target project; non-empty reference bodies; the
documentation standard present in `CLAUDE.md` with the exit sequence still at
exactly two checkpoints; no escaped backticks; user-authored skill preserved
while references still copy; invocation through a symlinked bin shim.

**Why these cannot be unit tests — demonstrated, not asserted.** The source
directory `src/fusedoc/templates/` is copied into `dist/` by the build script's
literal `src/*/templates` glob, not by `tsc`. Renaming it, or any regression in
that glob, leaves every unit test green: `tests/templates/fusedoc-skill.test.ts`
calls `composeFuseDocSkill()` and reads `src/`, and `tests/scaffolder.test.ts`
imports `scaffold()` in-process, also resolving against `src/`.

Measured on 2026-09-16 by deleting `dist/fusedoc/templates/` while leaving the
source intact, then running both suites:

| Suite | Result |
|---|---|
| `tests/templates/fusedoc-skill.test.ts` + `tests/scaffolder.test.ts` | 58 passed, 0 failed |
| `tests/e2e/fusedoc-skill-generation/install.test.ts` | 7 failed |

Restoring the directory and rebuilding returns both green. A separate check —
renaming the source directory itself — turns both red, because
`copyTemplateDir` already refuses a missing source with
`Template source directory missing`. So the source-side regression is caught
earlier and louder; this case exists for the build-side gap, which nothing else
reaches.

**Isolation:** scratch `HOME`/`XDG_CONFIG_HOME`, OpenSpec off `PATH`, stub `npm`
exiting non-zero, git identity via env — the recipe from
`scaffold-tool-boundary/skill-distribution.test.ts`.

**A defect this case's authoring surfaced, recorded because it cost a run:**
`src/*/templates` written inside a block comment terminates that comment at the
`*/`. The first draft of this case had it in its header comment and failed to
parse with a misleading error pointing at an unrelated string literal.

**Derivation limit, recorded rather than assumed:** these cases drive the Claude
Code install path — the built CLI writing a project directory. SpecFuse has a
second install path, `skills/init-specfuse/SKILL.md`, which a non-Claude agent
reads and executes with its own tools. That document cannot be executed here, so
no E2E case reaches it. What guards it instead is a source-resolution check in
`tests/skills/init-specfuse-skill.test.ts`: the skill must name every canonical
source and template pack, and each named symbol must actually be declared. That
guard went red during this change's FuseQA beat — the skill enumerated three
skill definitions and two template packs, not four and three — which is the
finding recorded in the apply completion report, not an E2E case.

## Addition — 2026-09-16 (change: fix-pipeline-beat-numbering)

| Field | Content |
|---|---|
| Case | `tests/e2e/pipeline-description-consistency/description.test.ts` (5 cases) |
| Capability | `pipeline-description-consistency` |
| Traces to | spec `pipeline-description-consistency` / Scenarios "CLI help names every beat", "Generated CLAUDE.md names every beat", "Both skills name every beat", "No ordinal labels any beat"; plus the escaped defect this change exists for — `--help` advertising a four-beat pipeline |
| Shape | CLI — real subprocess with argv, through the symlinked bin shim |

Covers: help text names all five beats; the scaffolded `CLAUDE.md` enumerates all
five in both checkpoint sections; the scaffolded `fusereview` and `fuseqa` skills
enumerate all five; no shipped description carries a positional ordinal; FuseDoc
is not swept into the beat list.

**Counter-example verification (the cases are not hollow).** Each case was made
to fail against the built artifact before being kept:

| Planted regression | Case that went red |
|---|---|
| FuseQA dropped from the FuseQA enumeration in `CLAUDE.md` | "enumerates every beat in both checkpoints" |
| `fourth beat` written back | "no shipped description labels a beat by its position" |
| FuseQA dropped from the CLI description | "help text names every beat" |

Restoring and rebuilding returns all five green.

**Why these cannot be unit tests:** the unit guards call `composeCLAUDEmd()` and
`compose*Skill()` and assert on their return values, so they observe the
template's output. Whether a scaffolded project *receives* it is a separate
question — a copy step, a build-script regression, or a stale installed file
would leave every unit guard green. Only driving the CLI and reading what landed
on disk answers it.

**Isolation:** scratch `HOME`/`XDG_CONFIG_HOME`, OpenSpec off `PATH`, stub `npm`
exiting non-zero, git identity via env — the recipe from
`scaffold-tool-boundary/skill-distribution.test.ts`.

## Addition — 2026-09-17 (change: repair-spec-corpus)

| Field | Content |
|---|---|
| Case | No new E2E case — derivation recorded below |
| Capability | `design-md-archetypes` (and the corpus as a whole) |
| Traces to | the repair itself: `openspec validate --specs --strict` went from 7 failures to 0 |
| Shape | data artifact, read by another program |

**Derivation (§1 decision tree), recorded so the conclusion is auditable:**

1. *How does the user obtain it?* — Not shipped. `package.json` `files` is
   `["dist", "README.md"]`, so the spec corpus never reaches a package consumer.
   It is obtained by cloning the repository.
2. *How is it triggered?* — The "read by another program" branch. The consumer
   is the `openspec` CLI: `validate`, `show`, and `archive`.
3. *What is externally observable?* — The CLI's exit status and output.

**Verification performed at this beat, against the real consumer:**

- **Read path.** `openspec show <capability> --json` over all thirteen specs:
  thirteen parsed, zero failures.
- **Merge path.** In an isolated `openspec/` root copied inside the repository,
  a scratch change with a delta against `design-md-archetypes` was archived
  through the real CLI. The merge preserved the three-section structure, grew
  the capability from four requirements to five, kept all four originals, and
  left the tree passing `--strict`. This is the path the repair unblocks: the
  archiving tool previously had to merge into a file that opened with
  `## REMOVED Requirements`.

**Why no permanent case.** The merge probe copies the whole `openspec/` tree to
avoid mutating the real specs, which makes a permanent case expensive for
coverage the guard already provides: `tests/specs/spec-corpus.test.ts` asserts
the tree passes the tool's own `--strict` validation, and mergeability follows
from structural validity. Recorded here rather than silently omitted, so a
future reader can revisit the call — the one-off evidence above is what it
rests on.
