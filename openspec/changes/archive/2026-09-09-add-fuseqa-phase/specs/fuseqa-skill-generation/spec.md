## ADDED Requirements

### Requirement: Skill frontmatter triggers on both flow and colloquial phrasing

`composeFuseQASkill(ctx)` SHALL emit YAML frontmatter whose `name` is `fuseqa` and whose `description` covers both the in-flow trigger and colloquial user requests, so the Skill tool can activate it.

#### Scenario: Frontmatter name and flow trigger

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output starts with YAML frontmatter containing `name: fuseqa` and a `description` naming the post-apply E2E verification beat

#### Scenario: Colloquial triggers present

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the `description` contains at least two colloquial trigger phrases covering end-to-end test authoring and QA acceptance

#### Scenario: Activation failure mode stated in the skill body

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the body states that FuseQA authors cases for the current change and does not execute the existing regression suite

### Requirement: Skill carries the artifact-shape decision tree

`composeFuseQASkill(ctx)` output SHALL contain a three-question decision tree that derives the real entry point for any artifact shape, including artifacts with no executable entry point.

#### Scenario: Three questions present

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output asks how the user obtains the artifact, how the artifact is triggered, and what is externally observable after triggering

#### Scenario: Data artifacts route to their consumer

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the trigger question includes a "read by another program" branch, and the output states that an artifact with no executable entry is verified through its real consumer

#### Scenario: Unknown shapes are derived, not skipped

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output requires an artifact shape absent from the recipes to be derived via the three questions and its conclusion recorded in the case's `entry` field, rather than declared untestable

### Requirement: Skill forbids source imports and requires artifact under test

`composeFuseQASkill(ctx)` output SHALL state the mechanically checkable case contract: no importing of project source, and the subject under test is the built or installed artifact.

#### Scenario: Source import forbidden

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output states that a case importing project source (for example from `../src/`) is not a valid FuseQA case, and that this is grep-checkable

#### Scenario: Artifact not source under test

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output states TDD covers source while FuseQA covers the built or installed artifact, and cites an entry-guard defect that passes at source level but fails through a symlinked bin shim

#### Scenario: Case declares five fields

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output requires each case to declare artifact, entry, isolation, observable, and traces-to

### Requirement: Entry recipes cover CLI, API, WebUI, library and data artifacts

`composeFuseQASkill(ctx)` output SHALL give an entry-construction recipe per known artifact shape, and SHALL leave tool choice to the project.

#### Scenario: CLI recipe requires the bin shim path

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the CLI recipe requires spawning a real subprocess with argv and requires covering invocation through a symlinked bin shim

#### Scenario: API and WebUI recipes forbid internal shortcuts

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the API recipe requires a real HTTP request against a live port and forbids calling handlers directly, and the WebUI recipe requires a real browser and forbids asserting on mounted component props

#### Scenario: Library recipe tests the published contract

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the library recipe requires importing from the build output via the paths declared in `package.json` `exports`, not internal source paths

#### Scenario: Tool choice deferred to the project

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output states the recipes fix the contract and not the tool, and directs the project to use its existing test stack rather than adopt a second framework

### Requirement: Browser cases self-check capability and skip visibly

`composeFuseQASkill(ctx)` output SHALL require browser-dependent cases to distinguish "cannot execute" from "failed".

#### Scenario: Capability self-check required

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the WebUI recipe requires the case to detect a missing browser binary and skip rather than fail

#### Scenario: Skip is visible, suite stays green

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output requires a skipped browser case to print its reason so the skip is visible, and states that an unexecutable case MUST NOT turn the regression gate red

### Requirement: Skill carries the derivation checklist beyond functional cases

`composeFuseQASkill(ctx)` output SHALL provide project-independent QA derivation techniques.

#### Scenario: Derivation techniques enumerated

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output covers equivalence partitioning with boundary values, state transitions including idempotence on repeat, concurrency and race conditions, error injection, and re-entry after interruption

#### Scenario: Negative boundary from the proposal

- **WHEN** `composeFuseQASkill(ctx)` is called
- **THEN** the output requires reading the change proposal's Non-goals as an out-of-scope boundary, so cases are not written against explicitly excluded behavior

### Requirement: Scaffolder distributes the skill and its templates without overwriting

`scaffold(config)` SHALL write `.claude/skills/fuseqa/SKILL.md` and copy the FuseQA templates into `.claude/skills/fuseqa/templates/`, preserving any existing skill file.

#### Scenario: Skill and templates written on a fresh scaffold

- **WHEN** `scaffold(config)` completes for a new project
- **THEN** `.claude/skills/fuseqa/SKILL.md` exists and `.claude/skills/fuseqa/templates/` contains the case-schema, derivation-checklist, entry-recipes and ledger templates

#### Scenario: Existing skill file is preserved

- **WHEN** `scaffold(config)` runs against a directory that already contains `.claude/skills/fuseqa/SKILL.md` with custom content
- **THEN** that file's content is left unchanged

#### Scenario: Templates ship in the build output

- **WHEN** the package build completes
- **THEN** the FuseQA templates are present under the built `fuseqa/templates/` directory, so a scaffold run from the built CLI can copy them

#### Scenario: Non-YAML templates are copied

- **WHEN** `scaffold(config)` copies the FuseQA templates
- **THEN** Markdown templates are copied as well as YAML ones, so no template is dropped by an extension filter
