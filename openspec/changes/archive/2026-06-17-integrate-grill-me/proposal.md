## Why

SpecFuse generates CLAUDE.md with a structured OpenSpec + Superpowers workflow, but there is no review gate between artifact completion and implementation. Users can jump directly into `/opsx:apply` without validating that their proposal, design, specs, and tasks are internally consistent. The `grill-me` skill provides a relentless interview pattern that can serve as this quality gate — catching contradictions, missing edge cases, and scope creep before expensive implementation begins.

## What Changes

- Add a new "Pre-Apply Review (Grill)" section to the generated CLAUDE.md, positioned between Exploration and Phase 2 (Apply)
- The section defines a structured review protocol triggered after all artifacts are complete
- Grill directly modifies artifacts when issues are found, with file-backup rollback support
- Add `.grill-backup/` handling logic to the generated workflow constraints
- No changes to existing Phase 2 / Phase 3 behavior

## Non-goals

- Does NOT create a standalone `/grill-me` skill within SpecFuse — it leverages the user's existing skill installation
- Does NOT add stack-specific review dimensions — all dimensions are universal
- Does NOT modify the OpenSpec schema or artifact structure
- Does NOT enforce grill as mandatory — `/opsx:apply` always works as an implicit skip

## Trade-offs

| Alternative | Why rejected |
|---|---|
| Embed grill behavior inside brainstorming phase | Brainstorming focuses on design exploration, not artifact validation. Mixing concerns dilutes both. |
| Make grill mandatory (block `/opsx:apply` without it) | Adds friction for small changes where full review is overkill. User autonomy > process purity. |
| Generate a separate review artifact file | Adds file management overhead. Grill's value is in the conversation + direct artifact fixes, not a report file. |

## Capabilities

### New Capabilities
- `grill-review-section`: Generates the "Pre-Apply Review (Grill)" CLAUDE.md section with trigger logic, review protocol, backup/rollback mechanism, consistency scan, and exit commands

### Modified Capabilities

## Impact

- `src/templates/claude-md.ts`: New `renderGrillReview()` function, inserted into `composeCLAUDEmd()` between Exploration and Phase 2
- Generated CLAUDE.md output grows by ~40-50 lines
- `.gitignore` template: add `.grill-backup/` pattern
- No runtime dependencies added; no API changes; no breaking changes
