## Purpose

Defines the "Pre-Apply Review (Grill)" protocol section that `renderGrillReview()` must emit into generated CLAUDE.md files: review dimensions, blocking classification, backup/rollback, exit commands, soft limit, bidirectional consistency scan, and summary format.

## Requirements

### Requirement: renderGrillReview function exists
The system SHALL export a module-internal function `renderGrillReview()` in `src/templates/claude-md.ts` that returns a string containing the complete "Pre-Apply Review (Grill)" markdown section.

#### Scenario: Function returns valid markdown string
- **WHEN** `renderGrillReview()` is called
- **THEN** it returns a non-empty string starting with `### Pre-Apply Review (Grill)`

#### Scenario: Function has no parameters
- **WHEN** `renderGrillReview()` is defined
- **THEN** it accepts zero arguments (stack-agnostic)

---

### Requirement: Grill section inserted in correct position
The system SHALL insert the output of `renderGrillReview()` in `composeCLAUDEmd()` between the Exploration section and the Phase 2 (Apply) section.

#### Scenario: Section ordering in generated CLAUDE.md
- **WHEN** `composeCLAUDEmd()` generates the full markdown
- **THEN** the string "Pre-Apply Review (Grill)" appears AFTER "Exploration" and BEFORE "Phase 2: Apply"

#### Scenario: No other sections displaced
- **WHEN** `composeCLAUDEmd()` generates the full markdown
- **THEN** all existing sections (Path A, Path B, Exploration, Phase 2, Phase 3, General Rules) remain present and in their original relative order

---

### Requirement: Trigger prompt content
The generated section SHALL instruct the AI to prompt the user with a grill review suggestion when all artifacts in a change are complete.

#### Scenario: Trigger condition described
- **WHEN** the grill section content is examined
- **THEN** it contains instruction that AI prompts for `/grill-me` after all artifacts are complete

#### Scenario: Skip mechanism described
- **WHEN** the grill section content is examined
- **THEN** it states that `/opsx:apply` without prior grill is treated as an implicit skip

---

### Requirement: Review dimensions listed
The generated section SHALL list 8 universal review dimensions: scope boundary, error paths, dependency risk, testability, security, performance impact, backward compatibility, data-flow integrity.

#### Scenario: All dimensions present
- **WHEN** the grill section content is examined
- **THEN** it contains all 8 dimension keywords

#### Scenario: Relevance-based selection noted
- **WHEN** the grill section content is examined
- **THEN** it includes instruction to select dimensions by relevance rather than forcing all

---

### Requirement: Problem classification with blocking categories
The generated section SHALL define blocking vs non-blocking classification with hardcoded blocking categories.

#### Scenario: Blocking categories listed
- **WHEN** the grill section content is examined
- **THEN** it lists: artifact contradictions, uncovered edge cases, missing error handling, security risks, untestable specs as blocking categories

#### Scenario: User override documented
- **WHEN** the grill section content is examined
- **THEN** it states users can override/downgrade blocking issues with explicit acknowledgment

---

### Requirement: Backup and rollback mechanism
The generated section SHALL describe file-based backup to `.grill-backup/` before grill starts, with rollback on abort.

#### Scenario: Backup instruction present
- **WHEN** the grill section content is examined
- **THEN** it instructs to copy the change directory to `.grill-backup/` before grill begins

#### Scenario: Rollback instruction present
- **WHEN** the grill section content is examined
- **THEN** it instructs to restore from `.grill-backup/` when `grill-abort` is issued

#### Scenario: Cleanup instruction present
- **WHEN** the grill section content is examined
- **THEN** it instructs to delete `.grill-backup/` after successful grill completion

---

### Requirement: Exit commands
The generated section SHALL define `grill-stop` and `grill-abort` as unambiguous exit keywords, with disambiguation for vague expressions.

#### Scenario: grill-stop behavior
- **WHEN** the grill section content is examined
- **THEN** it defines `grill-stop` as "exit grill, keep modifications made so far"

#### Scenario: grill-abort behavior
- **WHEN** the grill section content is examined
- **THEN** it defines `grill-abort` as "exit grill, rollback all modifications from backup"

#### Scenario: Ambiguity handling
- **WHEN** the grill section content is examined
- **THEN** it instructs AI to ask for clarification when user intent is ambiguous between exiting grill vs exiting the entire change

---

### Requirement: Soft question limit
The generated section SHALL specify a soft limit of 9 questions, after which AI self-assesses remaining blocking issues.

#### Scenario: Limit value present
- **WHEN** the grill section content is examined
- **THEN** it mentions 9 as the soft question limit

#### Scenario: Self-assessment behavior
- **WHEN** the grill section content is examined
- **THEN** it instructs AI to evaluate whether remaining questions are blocking-level after reaching the limit

---

### Requirement: Consistency scan at end
The generated section SHALL require a final consistency scan covering reference integrity, terminology consistency, and logical conflict detection across all artifacts, run bidirectionally (every proposal goal maps to design/specs/tasks forward, and every spec input maps to a declared signature parameter slot in reverse).

#### Scenario: Three scan dimensions present
- **WHEN** the grill section content is examined
- **THEN** it lists reference integrity, terminology consistency, and logical conflict detection

#### Scenario: Reverse direction present
- **WHEN** the grill section content is examined
- **THEN** it includes the reverse direction check from spec inputs to declared signature parameter slots

#### Scenario: Scan blocks completion
- **WHEN** the grill section content is examined
- **THEN** it states grill cannot pass if consistency scan finds unresolved issues

---

### Requirement: Summary format at grill end
The generated section SHALL define the end-of-grill summary format including blocking issues resolved, non-blocking suggestions, modified files list, and consistency scan result.

#### Scenario: Summary components defined
- **WHEN** the grill section content is examined
- **THEN** it specifies: blocking resolved list, non-blocking suggestions list, modified artifacts list, and consistency scan pass/fail

#### Scenario: Handoff prompt present
- **WHEN** the grill section content is examined
- **THEN** it ends with instruction to prompt user with `/opsx:apply`

---

### Requirement: Modification protocol
The generated section SHALL state that grill directly modifies artifacts, with the core principle that users must see the final diff before any file write.

#### Scenario: Direct modification stated
- **WHEN** the grill section content is examined
- **THEN** it states grill may directly modify artifact files

#### Scenario: Diff-before-write principle
- **WHEN** the grill section content is examined
- **THEN** it contains the principle "user must see the final diff before any write"

#### Scenario: Recommended answer with preview
- **WHEN** the grill section content is examined
- **THEN** it instructs each question to include a recommended answer and a modification preview

---

### Requirement: Gitignore includes grill-backup
The generated `.gitignore` SHALL include `.grill-backup/` pattern.

#### Scenario: Pattern present in gitignore output
- **WHEN** `composeGitignore()` generates the gitignore content
- **THEN** the output contains the line `.grill-backup/`
