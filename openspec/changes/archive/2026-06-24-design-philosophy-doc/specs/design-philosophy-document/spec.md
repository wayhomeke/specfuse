## ADDED Requirements

### Requirement: Document exists at correct path
The system SHALL produce a file at `docs/design-philosophy.md`.

#### Scenario: File created successfully
- **WHEN** the implementation task is complete
- **THEN** `docs/design-philosophy.md` exists and contains non-empty content

#### Scenario: Does not overwrite existing files
- **WHEN** `docs/design-philosophy.md` is created
- **THEN** `docs/product-overview.md` remains unchanged

---

### Requirement: Six-chapter linear structure
The document SHALL contain exactly six chapters in a specific order: core problem, fusion motivation, pipeline design, AI behavior modeling, limitations, and core belief.

#### Scenario: All chapters present in order
- **WHEN** the document content is examined
- **THEN** it contains six top-level sections (## headers) covering: (1) core problem/insight, (2) two tools' limitations and fusion, (3) Think-Do-Verify pipeline design, (4) AI behavior modeling and constraint philosophy, (5) known limitations and roadmap, (6) closing belief/vision

#### Scenario: Chapter ordering is sequential
- **WHEN** the document is parsed by header positions
- **THEN** chapter N appears before chapter N+1 for all N in 1..5

---

### Requirement: Decision chain format
Each major design decision SHALL be presented as a complete chain: problem statement → argument/counter-argument → conclusion → acknowledged cost.

#### Scenario: Decision includes counter-argument
- **WHEN** a design decision is presented (e.g., "TDD as iron law")
- **THEN** it includes at least one counter-argument or rejected alternative with reasoning

#### Scenario: Decision acknowledges cost
- **WHEN** a design decision is concluded
- **THEN** it explicitly states the trade-off or cost of the chosen approach

#### Scenario: Minimum decision count
- **WHEN** the full document is examined
- **THEN** it contains at least 8 distinct design decisions with full chain format

---

### Requirement: Professional third-person tone
The document SHALL use professional third-person voice throughout, avoiding subjective first-person plural ("我们") as the primary narrative voice.

#### Scenario: No first-person as primary narrator
- **WHEN** the document prose is examined
- **THEN** fewer than 5% of sentences use "我们" as the subject

#### Scenario: Analytical phrasing used
- **WHEN** design choices are explained
- **THEN** they use analytical framing (e.g., "SpecFuse 的设计选择是...", "一种可能的路径是...", "这个选择的代价在于...")

---

### Requirement: Code examples at key decision points
The document SHALL include actual code/configuration snippets from the project at points where "methodology becomes machine instruction."

#### Scenario: CLAUDE.md template snippet included
- **WHEN** the TDD enforcement or verification evidence design is discussed
- **THEN** the document includes a quoted snippet from `src/templates/claude-md.ts` output showing the actual constraint declaration

#### Scenario: Trigger condition snippet included
- **WHEN** the subagent/worktree trigger design is discussed
- **THEN** the document includes the actual CLAUDE.md trigger condition text

#### Scenario: Code snippets have context
- **WHEN** a code snippet is presented
- **THEN** it is preceded by a sentence explaining what the snippet demonstrates and followed by analysis of its design implications

---

### Requirement: Word count within target range
The document SHALL contain between 8000 and 12000 Chinese characters (excluding code blocks and markdown formatting).

#### Scenario: Meets minimum depth
- **WHEN** the document word count is measured (prose only, excluding code blocks)
- **THEN** it contains at least 8000 characters

#### Scenario: Does not exceed maximum
- **WHEN** the document word count is measured
- **THEN** it contains no more than 12000 characters

---

### Requirement: Covers all four designated themes
The document SHALL substantively address: (1) core insight and stance, (2) process design and fusion thinking, (3) constraint philosophy and AI behavior modeling, (4) limitations and roadmap.

#### Scenario: Core insight theme coverage
- **WHEN** the document is examined for theme 1
- **THEN** it defines the capability-vs-discipline gap and states SpecFuse's position on trusting process over AI self-discipline

#### Scenario: Fusion thinking theme coverage
- **WHEN** the document is examined for theme 2
- **THEN** it explains why OpenSpec and Superpowers individually are insufficient, why fusion (not composition) was chosen, and why CLAUDE.md serves as the bridge layer

#### Scenario: AI behavior modeling theme coverage
- **WHEN** the document is examined for theme 3
- **THEN** it addresses: declarative rules vs hardcoding, progressive complexity, SHOULD vs MUST for trigger conditions, and the design assumption about AI as "capable but undisciplined"

#### Scenario: Limitations theme coverage
- **WHEN** the document is examined for theme 4
- **THEN** it honestly states at least 3 known limitations with their severity and discusses which are intentional trade-offs vs unresolved problems
