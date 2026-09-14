## Context

See `proposal.md` — Why for motivation. The facts that shape the approach:

- **The artifact is a document, not code.** `skills/init-specfuse/SKILL.md` is read by another LLM which performs the install. There is no runtime to validate, no interface to type, and no process to intercept — the only enforcement available is the text itself plus a test in this repository.
- **Its delivery is the internal repository.** The file ships in neither channel: `package.json` `files` is `["dist", "README.md"]`, `.npmignore` excludes `skills/`, and `.git/multi-git.yml` excludes `skills` from the public mirror. The consuming agent clones the internal GitLab repo — which is why it can read the canonical sources directly.
- **The canonical content already exists in the repo.** Four composers in `src/templates/` produce the files the skill describes; three merge helpers in `src/scaffolder.ts` define the brownfield behaviour. The helpers are module-private: the skill points at them for *reading*, not calling.
- **Both dependencies are multi-platform and self-describe at runtime.** OpenSpec's `openspec init --help` enumerates ~40 tool ids; Superpowers supports ~14 platforms. This is what makes embedded support lists unnecessary.
- **The staleness is measurable**, which is what makes the guard worth writing: `stack` ×14, `subagent` ×17, `git worktree` ×8, `/opsx:*` ×15, `.claude/skills` ×4, `CLAUDE.md` ×1, `AskUserQuestion` ×1, and FUSION markers ×2 (portable HTML comments).

## Goals / Non-Goals

**Goals:** the skill carries no copy of the methodology; the executing agent can materialize it on its own platform; the questionnaire and readiness reporting match the CLI; the file is stack-free; a rename in `src/` cannot leave the skill pointing at nothing.

**Non-Goals** (design-level boundaries; see also `proposal.md` — Non-goals):

- **No enforcement inside the skill.** A document cannot validate itself. The guard is a test in this repository; the skill contains no self-check beyond the runtime checks it delegates to OpenSpec and Superpowers.
- **No template engine, and no interpolated variables.** The current file's `{{test_cmd}}` and `{{lint_cmd}}` exist solely to receive stack-derived commands (line 93: "Replace `{{test_cmd}}` and `{{lint_cmd}}` with the stack's actual commands"). With the stack layer gone they have no source, so they are **removed** and replaced by the CLI's stack-free phrasing — `the project's test command`, `the project's linter` (`src/templates/claude-md.ts:111,214`). Redefining them for a stack-free world would be inventing a variable with no producer.
- **No change to what the CLI generates.** The skill converges on the CLI, never the reverse.

## Decisions

**D1 — Pointers instead of a pre-rendered copy.** Alternatives: (a) hand-sync the inlined copy; (b) commit pre-rendered templates plus a generator; (c) point at the sources. Chose **(c)**. (a) is the practice that produced four months of drift. (b) leaves a copy in place and adds machinery to police it — treating the symptom. (c) removes the copy, so there is nothing to drift. The consuming agent already has the whole repo; the cost is that it must read TypeScript template literals, which is work a capable model can do and which (b) would have bought at the price of a third copy.

**D2 — Runtime self-description instead of embedded platform lists.** Alternatives: (a) embed OpenSpec's tool ids and Superpowers' platform list; (b) have the agent derive them at runtime. Chose **(b)**. (a) recreates the defect being fixed at one remove: the lists grow upstream, and a skill carrying a stale list misinforms the agent about its own platform. `openspec init --help` enumerates the ids itself, and whether Superpowers is installed is knowable locally.

**D3 — Attribute `subagent` and `git worktree` to Superpowers rather than degrading them individually.** The generated text mentions subagent 17 times and worktree 8, which invites a per-capability degradation table. That is wrong: both come from Superpowers skills (`subagent-driven-development`, `using-git-worktrees`), so they are covered by the single Superpowers question — and Superpowers carries its own per-platform tool mappings. Collapsing 25 references into one conditional is the whole simplification.

**D4 — Mirror the CLI's questionnaire exactly, including the decline-versus-failure distinction.** A skill that asks different questions or reports differently from the CLI produces divergent projects, which is the failure mode this change exists to remove. Declined OpenSpec prints `/opsx:*` verbatim; a failed attempt annotates the line and emits a trailing notice.

**D5 — Guard by pointer resolution and absence assertions, in `tests/`.** The skill cannot be tested by running it. What can be asserted: the paths and symbols it names resolve, and the copies are absent. The pointer assertions are the strong ones — a rename or a move in `src/` turns them red, provided they require a *declaration* rather than a bare mention. The absence assertions are weaker and, for the "no embedded platform list" case, **not mechanical at all**: nothing in the suite can fail for the mere presence of a list, so that property rests on review. Stated here because an earlier draft claimed the positive assertion carried the weight, which FuseReview showed to be false.

## Dependency diagram

```
skills/init-specfuse/SKILL.md          ◀── the artifact: read by a non-Claude agent
   │
   │ names, as read-only pointers
   ├──▶ src/templates/claude-md.ts        composeCLAUDEmd()          methodology text
   ├──▶ src/templates/gitignore.ts        composeGitignore()
   ├──▶ src/templates/claude-settings.ts  composeClaudeSettings()
   ├──▶ src/templates/openspec-config.ts  composeOpenspecConfig()
   └──▶ src/scaffolder.ts                 mergeFusionIntoCLAUDEmd
                                          mergeGitignore
                                          mergeClaudeSettings         brownfield rules
   │
   │ delegates to, at runtime on the executing agent's platform
   ├──▶ OpenSpec      `openspec init --tools <id>`    command surface
   └──▶ Superpowers   brainstorming · TDD · verification-before-completion
                      subagent-driven-development · using-git-worktrees

tests/skills/init-specfuse-skill.test.ts ──asserts──▶ the pointers above resolve,
                                                      and the copies stay absent
```

Nothing points the other way: the skill is a consumer of `src/**`, and no file under `src/` changes.

## Public API surface

**None added, none changed.** This change exports no symbol, alters no signature, and moves no module. The only new file outside the skill is a test.

The skill's own surface is the set of names it points at, and that set is fixed by the spec: `composeCLAUDEmd` (`src/templates/claude-md.ts`), `composeGitignore` (`src/templates/gitignore.ts`), `composeClaudeSettings` (`src/templates/claude-settings.ts`), `composeOpenspecConfig` (`src/templates/openspec-config.ts`), and `mergeFusionIntoCLAUDEmd` / `mergeGitignore` / `mergeClaudeSettings` (`src/scaffolder.ts`). The guard asserts each resolves.

## Error handling strategy

The skill has no error path of its own; the failures it must handle belong to the environment it runs in. Three are specified, and the first is the defect this change closes:

1. **OpenSpec declined versus OpenSpec failed.** These are different states needing different handling, and the current file collapses them into one misleading summary. Declined → the `/opsx:*` line prints verbatim, because nothing was attempted and nothing failed. Failed → the line is annotated and a trailing notice names the missing piece and the repair commands. In both cases the summary must not present `/opsx:propose` as a working next step when it is not.
2. **Superpowers unsupported on the platform.** The disciplines are executed directly, with each one's requirement named — brainstorming before building, the failing test first, fresh evidence before claiming completion. The degradation is behavioural, not a missing dependency, so no capability silently disappears.
3. **No skill or command mechanism on the platform.** The content is inlined into the agent's instruction file. The skill states this as a possibility rather than enumerating which platforms fall into it.

## Risks / Trade-offs

- **[Risk]** The skill now depends on the agent actually following its pointers into `src/`. An agent that does not will produce nothing. → **Mitigation:** the pointers are named exactly and kept resolvable by the guard; the alternative (carrying a copy) trades this risk for a certainty of drift.
- **[Risk]** "Translate the dialect" is model judgement, not a mechanical transform, so output quality varies with the model. → **Accepted.** The alternative — embedding a platform-neutral methodology in the skill — creates a second source of truth, which is the defect being fixed.
- **[Risk]** The guard leans partly on absence assertions (`stack` count 0, no inlined copy), which cannot fail for the reason the feature exists. → **Mitigation:** the pointer-resolution assertions are positive and go red on a rename; §Verification below makes that counter-example mandatory.
- **[Trade-off]** The file shrinks by roughly two-thirds, so a reader expecting a self-contained procedure must now follow pointers. → **Accepted:** that is the intended shape for an agent that clones the repository.

## Migration Plan

No data migration and no installed copy to invalidate: the file lives only in the internal repository and is read at initialisation time. Projects previously initialised by the skill keep what it produced; re-running applies the current CLI merge semantics, which replace only the FUSION block and leave surrounding content intact. Rollback is a revert of the file.

## Open Questions

None. The three decisions that could have been deferred — the option set for the platform-adaptation boundary, whether the questionnaire mirrors the CLI, and whether to embed support lists — were all resolved before the artifacts were drafted.
