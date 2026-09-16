## Purpose

Defines the generation and distribution contract for the FuseDoc documentation-standard skill: the three prose axes with inlined substance, the reference files that ship alongside it, the two host capabilities SpecFuse guarantees structurally, and the non-overwriting distribution behavior of `scaffold()`.

## ADDED Requirements

### Requirement: Skill template renders three prose axes with substance

`composeFuseDocSkill()` output SHALL contain all three review axes — proposition judgment, vantage correction, structural placement — each carrying actionable substance rather than a bare name.

#### Scenario: All three axes present

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output contains a heading for each of the three axes, and the vantage axis contains the resolvability test (a reader at the current commit, with no session transcript, can resolve every reference and verify every claim)

#### Scenario: Vantage axis carries the leakage taxonomy

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** the vantage-correction axis enumerates the eight leakage classes (dead design-session citations, stack and review-thread vantage, change narration and version stamps, review choreography, reviewer-addressed justification, restatement and derivation transcripts, hedges and planning residue, authoring-language slips)

#### Scenario: Overcorrection traps are stated

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output states the four overcorrection traps (flipping an obligation into an endorsement, promoting a hypothetical to a shipped feature, deleting a true fact with the transcript around it, dropping provenance while keeping the number)

#### Scenario: Scope is a required input

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output states that scope is a required input, and that an invocation naming no scope reports the missing input and stops instead of inferring a repository-wide scope

### Requirement: Skill declares the host capabilities SpecFuse guarantees

A SpecFuse-scaffolded project structurally provides a decision-record convention and a frozen-archive convention. `composeFuseDocSkill()` output SHALL name both as present rather than leaving them to generic detection, and SHALL exclude the skill's own directory from audit.

#### Scenario: Decision-record destination is pre-wired

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output names `openspec/changes/` as the decision-record convention, so escalating a behavior-changing removal has a destination and the skill does not ask the user to name one

#### Scenario: Frozen archive is pre-wired

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output names `openspec/changes/archive/` as the frozen-archive convention, and states that an archived record is inspected only to understand an inbound citation — never to modernize its prose or its outbound links

#### Scenario: The skill excludes its own directory

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output excludes `.claude/skills/fusedoc/` from audit scope, because its calibration material quotes flawed prose deliberately

#### Scenario: Undetected dimensions are reported, not assumed

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output requires the report to name every uncovered dimension and forbids claiming a mechanical check passed when none was detected or executed

### Requirement: Reference files ship with the skill

The skill's method SHALL be complete without network access: the three reference files it links — calibration examples, capability probes, and recall batteries — SHALL be distributed alongside `SKILL.md`, and every relative link in the rendered skill SHALL resolve to a distributed file.

#### Scenario: Every reference link resolves

- **WHEN** a project is scaffolded
- **THEN** every `references/<name>.md` link appearing in `.claude/skills/fusedoc/SKILL.md` corresponds to a file that exists under `.claude/skills/fusedoc/references/`

#### Scenario: Calibration examples are distributed

- **WHEN** a project is scaffolded
- **THEN** `.claude/skills/fusedoc/references/examples.md` exists and contains paired over-trimmed and balanced versions demonstrating the complete-proposition rule

#### Scenario: Recall batteries are distributed

- **WHEN** a project is scaffolded
- **THEN** `.claude/skills/fusedoc/references/recall-batteries.md` exists and contains both search patterns for the leakage taxonomy and the known false-positive families that must be judged and kept

#### Scenario: Capability probes are distributed

- **WHEN** a project is scaffolded
- **THEN** `.claude/skills/fusedoc/references/probes.md` exists and states that detection reads host configuration rather than running a command to test whether that command exists

### Requirement: Rendered skill contains no vendor or foreign-host references

The skill is distributed to arbitrary user projects. Its rendered output SHALL NOT name the vendor, repository, or directory layout of the project it was authored in.

#### Scenario: No vendor identifiers in the rendered skill

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output contains no vendor product name, vendor package scope, or vendor-specific environment variable name

#### Scenario: No foreign host paths in the rendered skill

- **WHEN** `composeFuseDocSkill()` is called
- **THEN** its output references no source-repository-specific directory that a scaffolded project would not have

### Requirement: Scaffolder distributes the skill without overwriting

`scaffold()` SHALL write the skill and its reference files to `<target>/.claude/skills/fusedoc/` for new projects and SHALL NOT overwrite an existing `SKILL.md`.

#### Scenario: New project receives the skill and its references

- **WHEN** `scaffold()` runs for a new project directory
- **THEN** `.claude/skills/fusedoc/SKILL.md` exists with the rendered skill content, and the three reference files exist under `.claude/skills/fusedoc/references/`

#### Scenario: Existing skill preserved

- **WHEN** `scaffold()` runs where `.claude/skills/fusedoc/SKILL.md` already exists with custom content
- **THEN** that file's content is unchanged after scaffolding

#### Scenario: Installation is unconditional

- **WHEN** `scaffold()` runs with any valid configuration
- **THEN** the skill is installed without asking an additional setup question, and `ProjectConfig` carries no FuseDoc field

#### Scenario: Install surface names the skill

- **WHEN** `scaffold()` completes
- **THEN** the printed file listing includes the `.claude/skills/fusedoc/` entry and the skill-installation progress message names fusedoc

#### Scenario: Skill reaches the target through the published artifact

- **WHEN** the built package is invoked through a symlinked bin shim, the path package managers install
- **THEN** `.claude/skills/fusedoc/SKILL.md` and all three reference files are written to the target project
