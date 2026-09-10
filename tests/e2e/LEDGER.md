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
