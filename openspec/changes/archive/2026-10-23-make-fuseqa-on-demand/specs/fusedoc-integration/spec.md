## MODIFIED Requirements

### Requirement: FuseDoc introduces no checkpoint

The apply exit sequence contains exactly one mandatory checkpoint question, FuseReview. FuseDoc SHALL NOT add a second, and SHALL NOT make any phase's completion conditional on a FuseDoc decision.

#### Scenario: No third checkpoint question

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** it defines no mandatory FuseDoc checkpoint question, and the apply exit sequence requires exactly the FuseReview decision on record

#### Scenario: Apply completion does not depend on FuseDoc

- **WHEN** the fusion `CLAUDE.md` is generated
- **THEN** apply completion requires no FuseDoc decision record, and no FuseDoc outcome can block entry to the Verify phase
