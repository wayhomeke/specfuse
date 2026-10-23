## MODIFIED Requirements

### Requirement: The section is exported and assembled in place

`src/templates/claude-md.ts` SHALL export `renderApplyPhase()` so the checkpoint contract can be asserted directly, and the assembled `CLAUDE.md` SHALL carry the checkpoint inside the Apply phase section.

#### Scenario: Named export present

- **WHEN** the module `src/templates/claude-md.ts` is imported
- **THEN** `renderApplyPhase` is among its named exports, alongside `renderApplyFuseReview`, `renderFuseQAOnDemand`, and `renderVerifyPhase`

#### Scenario: Checkpoint sits at the apply entrance

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the model switch checkpoint appears within the Apply phase section and before the step that activates TDD

#### Scenario: Export does not alter assembly

- **WHEN** `composeCLAUDEmd(ctx)` output is compared before and after the export is added
- **THEN** the Apply phase content is unchanged by the export, so the assertion seam introduces no behavioral difference
