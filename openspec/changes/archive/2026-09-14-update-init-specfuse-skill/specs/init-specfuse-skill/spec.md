## Purpose

Defines the contract for the non-Claude-agent installation skill: the methodology is referenced rather than copied, the executing agent translates it into its own platform's shape and degrades only what that platform lacks, and the questionnaire and readiness reporting match the CLI's.

## ADDED Requirements

### Requirement: Methodology is referenced, not copied

`skills/init-specfuse/SKILL.md` SHALL name `composeCLAUDEmd()` in `src/templates/claude-md.ts` as the canonical methodology text and SHALL NOT carry a second copy of it. It SHALL state that the canonical text is written in Claude Code's dialect and must be translated rather than reproduced verbatim.

#### Scenario: Canonical source is named

- **WHEN** `SKILL.md` is read
- **THEN** it names `composeCLAUDEmd()` together with its module path, so the executing agent has a resolvable source of truth

#### Scenario: No inlined copy remains

- **WHEN** `SKILL.md` is searched for `### Phase 2: Apply / Implement`
- **THEN** no occurrence is found, because an occurrence marks an inlined copy of the methodology that can drift

#### Scenario: Dialect warning present

- **WHEN** `SKILL.md` is read
- **THEN** it states that the canonical text is Claude Code's rendering and must be translated, so the agent does not copy platform-specific tokens verbatim

### Requirement: Platform shape is translated at runtime

`SKILL.md` SHALL instruct the executing agent to materialize the methodology in its own platform's shape, and SHALL derive dependency-supported tool identities from the dependency's own runtime self-description rather than from a list embedded in the skill.

#### Scenario: Instruction file is the agent's own

- **WHEN** `SKILL.md` is read
- **THEN** it states that the instruction file is the executing agent's own — naming `AGENTS.md`, `.cursor/rules`, `copilot-instructions.md`, and `GEMINI.md` among the possibilities — rather than `CLAUDE.md`

#### Scenario: OpenSpec tool identity comes from the runtime

- **WHEN** `SKILL.md` is read
- **THEN** it directs the agent to obtain its OpenSpec tool id from `openspec init --help` rather than from a list written into the skill

#### Scenario: No hardcoded platform list

- **WHEN** `SKILL.md` is read
- **THEN** it contains no enumerated list of supported platforms or tool ids, so an upstream addition cannot make the skill silently stale

#### Scenario: Portable markers are kept

- **WHEN** `SKILL.md` is read
- **THEN** it states that the `FUSION:START` / `FUSION:END` markers are plain HTML comments and are carried over unchanged

### Requirement: Capability degradation is conditional on the platform

`SKILL.md` SHALL require degradation of a capability only when the target platform lacks it, and SHALL NOT present capabilities supplied by Superpowers or OpenSpec as universally unavailable.

#### Scenario: Supported platforms need no degradation

- **WHEN** `SKILL.md` is read
- **THEN** it states that where Superpowers supports the platform the disciplines are used as-is, and where OpenSpec supports the platform the command surface works as-is

#### Scenario: subagent and worktree are not degraded separately

- **WHEN** `SKILL.md` is read
- **THEN** it attributes the subagent and git-worktree instructions to Superpowers rather than listing them as independent platform capabilities to degrade

#### Scenario: Unsupported platform degrades to prose

- **WHEN** `SKILL.md` is read
- **THEN** it states that where Superpowers is unavailable the disciplines are executed directly, and names what each requires — brainstorming before building, the failing test first, fresh evidence before claiming completion

#### Scenario: No blanket unavailability claim

- **WHEN** `SKILL.md` is read
- **THEN** it does not assert that Superpowers or OpenSpec is unavailable outside Claude Code, since both are multi-platform

### Requirement: Questionnaire mirrors the CLI

`SKILL.md` SHALL ask git initialization only when the target is a new project directory and SHALL ask OpenSpec initialization in both cases, matching `collectProjectConfig()`.

#### Scenario: git asked only for a new directory

- **WHEN** `SKILL.md` is read
- **THEN** it states the git question is asked only when initializing a new project directory, and is not asked for an existing directory

#### Scenario: OpenSpec always asked

- **WHEN** `SKILL.md` is read
- **THEN** it states the OpenSpec question is asked regardless of whether the directory is new or existing

#### Scenario: The stack question is absent

- **WHEN** `SKILL.md` is read
- **THEN** its setup questionnaire offers no technology-stack choice, because that question was removed from the product

### Requirement: Readiness is reported, not promised

`SKILL.md` SHALL distinguish a declined OpenSpec from a failed OpenSpec attempt, and SHALL NOT present `/opsx:*` commands as available next steps after a failed attempt.

#### Scenario: Decline prints the line verbatim

- **WHEN** `SKILL.md` is read
- **THEN** it states that a user declining OpenSpec leaves the `/opsx:*` line unannotated, because nothing was attempted and nothing failed

#### Scenario: Failure is annotated and explained

- **WHEN** `SKILL.md` is read
- **THEN** it states that a failed OpenSpec attempt annotates that line and emits a trailing notice naming what is missing and the commands that repair it

#### Scenario: No promise after failure

- **WHEN** `SKILL.md` is read
- **THEN** its summary does not present `/opsx:propose` as a working next step after a failed attempt

### Requirement: Existing projects get the CLI's merge semantics

`SKILL.md` SHALL apply the same conservative merge rules as `scaffold()`, naming the merge helpers it derives them from.

#### Scenario: Canonical merge helpers named

- **WHEN** `SKILL.md` is read
- **THEN** it names `mergeFusionIntoCLAUDEmd`, `mergeGitignore`, and `mergeClaudeSettings` in `src/scaffolder.ts`

#### Scenario: FUSION block replaced in place

- **WHEN** `SKILL.md` is read
- **THEN** it states that only the content between the FUSION markers is replaced, and everything outside them survives

#### Scenario: gitignore appends without removing

- **WHEN** `SKILL.md` is read
- **THEN** it states that missing patterns are appended and existing lines are never removed

#### Scenario: Existing config is left alone

- **WHEN** `SKILL.md` is read
- **THEN** it states that an existing `openspec/config.yaml` is skipped rather than overwritten

### Requirement: The skill's pointers resolve

Every source path and symbol named in `SKILL.md` SHALL exist in the repository, so a rename cannot leave the skill pointing at nothing.

#### Scenario: Named paths exist

- **WHEN** the `src/...` paths named in `SKILL.md` are checked against the tree
- **THEN** each one exists

#### Scenario: Named symbols are present

- **WHEN** the symbol names the skill associates with those paths are checked
- **THEN** each symbol is present in the file it is attributed to

### Requirement: The skill is stack-free

`SKILL.md` SHALL contain no reference to the technology-stack layer that `remove-stack-selection` removed from the product.

#### Scenario: No stack references

- **WHEN** `SKILL.md` is searched for `stack` **case-insensitively**
- **THEN** zero occurrences are found — case-insensitivity is required, not incidental: six lines carry only the capitalised `Stack`, including `## Stack Profiles Quick Reference`, which a case-sensitive search would leave standing

#### Scenario: No stack profiles section

- **WHEN** `SKILL.md` is read
- **THEN** `## Stack Profiles Quick Reference` is absent, and no stack-specific variant of the gitignore, settings, or openspec-config content is described
