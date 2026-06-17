## Context

SpecFuse generates a `CLAUDE.md` file via `composeCLAUDEmd()` in `src/templates/claude-md.ts`. The file is assembled from discrete render functions (`renderPathA`, `renderPathB`, `renderExploration`, `renderApplyPhase`, `renderVerifyPhase`, `renderGeneralRules`). Each section is independent and the composition is a flat join.

Currently there is no review gate between artifact completion and implementation. The generated workflow goes directly from "artifacts ready" to "Phase 2: Apply".

## Goals / Non-Goals

**Goals:**
- Add a `renderGrillReview()` function that outputs the "Pre-Apply Review (Grill)" section
- Insert the section between Exploration and Phase 2 in the composed output
- Add `.grill-backup/` to the generated `.gitignore` template
- Keep the implementation stack-agnostic (no `StackProfile` dependency for review dimensions)

**Non-Goals:**
- No runtime logic — this is purely template output (markdown generation)
- No new CLI commands or interactive prompts
- No modifications to existing render functions
- No schema changes to OpenSpec

## Decisions

### 1. New function: `renderGrillReview(): string`

Returns the full "Pre-Apply Review (Grill)" markdown section. Does not accept `StackProfile` as parameter since all review dimensions are universal.

**Rationale:** Consistent with existing pattern (`renderExploration()` also takes no args). Stack-agnostic dimensions avoid maintenance burden per stack.

### 2. Insertion point in `composeCLAUDEmd()`

Insert `renderGrillReview()` output between `renderExploration()` and `renderApplyPhase()` in the sections array.

**Rationale:** Matches the logical workflow order — artifacts are created during Path A/B/Exploration, reviewed by grill, then implemented in Apply.

### 3. `.grill-backup/` in gitignore

Add the pattern to `composeGitignore()` in `src/templates/gitignore.ts` under a "# Grill review backups" comment.

**Rationale:** Backup directory is transient and should never be committed.

### 4. Section content structure

The rendered section contains these subsections:
- Trigger (when AI prompts for grill)
- Protocol (how grill operates: one question at a time, recommended answer + diff preview)
- Review dimensions (7 universal dimensions, select by relevance)
- Problem classification (blocking vs non-blocking, with hardcoded blocking categories)
- Modification rules (direct artifact edit, "user sees final diff before write" principle)
- Backup & rollback (`.grill-backup/` copy before grill, `grill-abort` to restore)
- Exit commands (`grill-stop`, `grill-abort`, ambiguous intent → confirm)
- Soft limit (15 questions, then self-assess for remaining blocking issues)
- Consistency scan (reference integrity, terminology, logical conflicts)
- Summary format (blocking list + suggestions + modified files + consistency result)
- Handoff (prompt `/opsx:apply`)

**Rationale:** Each subsection maps 1:1 to a design decision from the grill session. Keeping them as prose within one render function (not further decomposed) because the total is ~40-50 lines and splitting would over-engineer.

## Risks / Trade-offs

- **[CLAUDE.md bloat]** Adding ~45 lines increases generated file size → Mitigation: content is well-structured markdown; AI agents parse it efficiently. Users rarely read CLAUDE.md manually.
- **[Grill quality depends on AI model]** Weaker models may not follow the protocol precisely → Mitigation: explicit blocking categories and dimensional checklist provide guardrails regardless of model capability.
- **[Backup directory left behind]** If grill crashes mid-session, `.grill-backup/` may remain → Mitigation: gitignore prevents accidental commit; grill start step should clean stale backups.

## Component Hierarchy

```
composeCLAUDEmd(ctx)
├── renderTechStack(stack)
├── renderCommitConvention()
├── renderPathA()
├── renderPathB()
├── renderExploration()
├── renderGrillReview()          ← NEW
├── renderApplyPhase(stack)
├── renderVerifyPhase(stack)
└── renderGeneralRules()
```

## Public API Surface

No new exports. `renderGrillReview()` is a module-internal function in `src/templates/claude-md.ts`, called only by `composeCLAUDEmd()`.

## State Management

N/A — pure template generation, no runtime state.

## Accessibility

N/A — CLI scaffolding tool, no UI components.
