## Purpose

Defines how a SpecFuse-scaffolded project exposes its pipeline to DeepSeek Harness (`dsh`): which skill roots receive the shared skills, how the unattended entry points become dsh-invocable commands, how OpenSpec supplies its workflow skills to dsh, and what a real dsh session must observe.

## ADDED Requirements

### Requirement: The scaffolder installs dsh-discoverable skills under `.agents/skills`

`scaffold(config)` SHALL write `design-md`, `fusedoc`, `fusereview`, and `fuseqa` as directory bundles under `<target>/.agents/skills/`, because dsh scans that root and does not scan `.claude/skills/`. Each bundle SHALL carry the same `SKILL.md` body as its `.claude/skills/` counterpart and SHALL carry the same template or reference assets.

#### Scenario: Fresh scaffold installs both roots

- **WHEN** `scaffold(config)` completes for a new project directory
- **THEN** `.agents/skills/design-md/SKILL.md`, `.agents/skills/fusedoc/SKILL.md`, `.agents/skills/fusereview/SKILL.md`, and `.agents/skills/fuseqa/SKILL.md` exist
- **AND** the corresponding `.claude/skills/<name>/SKILL.md` files still exist

#### Scenario: Shared skill bodies are identical across roots

- **WHEN** a shared skill's `.agents/skills/<name>/SKILL.md` and `.claude/skills/<name>/SKILL.md` are compared
- **THEN** their contents are byte-identical, because one composer produced both

#### Scenario: Asset directories accompany the dsh bundles

- **WHEN** `scaffold(config)` completes
- **THEN** `.agents/skills/fusedoc/references/` contains the three reference files, and `.agents/skills/design-md/templates/` and `.agents/skills/fuseqa/templates/` contain the same files as their `.claude` counterparts

#### Scenario: Existing dsh skill is preserved

- **WHEN** `scaffold(config)` runs in a directory that already contains `.agents/skills/fuseqa/SKILL.md` with custom content
- **THEN** that file's content is unchanged after scaffolding

#### Scenario: Install listing names the dsh root

- **WHEN** `scaffold(config)` completes
- **THEN** the printed file listing names `.agents/skills/` and the dsh entry points

### Requirement: Entry-point skills declare dsh invocation policy

`scaffold()` SHALL write `.agents/skills/specfuse/SKILL.md` and `.agents/skills/specfuse-full/SKILL.md`. Each file's YAML frontmatter SHALL declare a kebab-case `name` equal to its directory, a description, `disable-model-invocation: true`, and `user-invocable: true`.

#### Scenario: Entry skill frontmatter matches dsh invocation policy

- **WHEN** `.agents/skills/specfuse/SKILL.md` and `.agents/skills/specfuse-full/SKILL.md` are parsed
- **THEN** each frontmatter carries the matching kebab-case name, `disable-model-invocation: true`, and `user-invocable: true`

#### Scenario: Entry skills are absent from the model catalog

- **WHEN** dsh builds the session skill catalog for a scaffolded project
- **THEN** `design-md`, `fusedoc`, `fusereview`, and `fuseqa` are listed, and `specfuse` and `specfuse-full` are not

### Requirement: Entry points take the requirement from trailing text

Each entry-skill body SHALL treat the text following the invocation as the requirement. With no trailing text, it SHALL print the exact usage line and stop, creating no change and writing no artifact. The `/specfuse-full` body SHALL keep the FuseReview → FuseQA → Verify → archive order and the no-commit/no-push prohibitions described in the generated `CLAUDE.md`.

#### Scenario: Missing `/specfuse` requirement prints usage and stops

- **WHEN** a user invokes `/specfuse` with no trailing requirement text
- **THEN** the response contains the exact line `SPECFUSE_USAGE: /specfuse <requirement description>`
- **AND** no change directory is created and no artifact is written

#### Scenario: Missing `/specfuse-full` requirement prints usage and stops

- **WHEN** a user invokes `/specfuse-full` with no trailing requirement text
- **THEN** the response contains the exact line `SPECFUSE_FULL_USAGE: /specfuse-full <requirement description>`

#### Scenario: Trailing text is the requirement

- **WHEN** a user invokes `/specfuse <text>` in dsh
- **THEN** the pipeline treats `<text>` as the requirement description, equivalent to `$ARGUMENTS` in the Claude Code command

#### Scenario: Full variant keeps FuseQA in sequence

- **WHEN** the `/specfuse-full` entry skill is read
- **THEN** its phase order is FuseReview, then FuseQA, then Verify, then archive, and it records `auto: entered` for both review decisions

### Requirement: OpenSpec initialization installs the Claude Code and shared-agents adapters together

`initOpenspec(cwd)` SHALL invoke `openspec init --tools claude,agents --force` in one subprocess, so a successful initialization supplies `.claude/commands/opsx/`, `.claude/skills/openspec-*/`, and `.agents/skills/openspec-*/`. The function SHALL retain its existing failure contract: a non-zero exit resolves to `false`, and scaffolding continues.

#### Scenario: One invocation installs both adapters

- **WHEN** `initOpenspec(cwd)` succeeds against the OpenSpec CLI
- **THEN** `<cwd>/.claude/commands/opsx/` contains the opsx commands
- **AND** `<cwd>/.agents/skills/openspec-propose/SKILL.md` exists

#### Scenario: The adapter list is requested in one call

- **WHEN** the subprocess command string spawned by `initOpenspec(cwd)` is inspected
- **THEN** it contains `openspec init --tools claude,agents --force`

#### Scenario: Init failure stays non-fatal

- **WHEN** the OpenSpec CLI exits non-zero during `initOpenspec(cwd)`
- **THEN** `initOpenspec(cwd)` resolves to `false`, and `scaffold(config)` still completes and writes every non-OpenSpec artifact

### Requirement: Installed skill prose resolves within its own root

A shared skill body SHALL NOT contain a path reference that resolves only under `.claude/skills/`. References to a skill's own directory SHALL be relative to the directory containing that `SKILL.md`.

#### Scenario: FuseDoc self-reference is root-agnostic

- **WHEN** `composeFuseDocSkill()` output is inspected
- **THEN** it identifies its own directory without naming `.claude/skills/fusedoc/`

#### Scenario: dsh entry skills point at their own root

- **WHEN** the dsh entry-skill bodies reference FuseDoc, FuseReview, or FuseQA
- **THEN** each reference names `.agents/skills/` or the user-invocable skill name, not `.claude/skills/`

### Requirement: A real dsh session can discover and invoke the pipeline

A verifiable dsh session SHALL expose the four shared skills in its catalog, SHALL hide the two entry skills from that catalog, and SHALL accept `/specfuse` as a user-invocable entry that stops on missing requirement text. The verification SHALL use the built scaffolder, a real `dsh` process from `npx`, and the configured model route. When dsh, Node 24.9+, the endpoint environment, or the opt-in switch is absent, the case SHALL skip visibly and SHALL NOT fail the suite.

#### Scenario: Catalog contains the shared skills

- **WHEN** dsh runs a task that asks for the available skill names in a scaffolded project
- **THEN** the answer contains `design-md`, `fusedoc`, `fusereview`, and `fuseqa`

#### Scenario: Entry skills remain user-only

- **WHEN** the same catalog listing is inspected
- **THEN** it does not contain `specfuse` or `specfuse-full`

#### Scenario: User gesture reaches the entry skill

- **WHEN** dsh runs a task whose text is `/specfuse` with no requirement
- **THEN** stdout contains `SPECFUSE_USAGE: /specfuse <requirement description>`

#### Scenario: Missing preconditions skip visibly

- **WHEN** the real dsh verification cannot execute because a precondition is absent
- **THEN** it reports the reason and the suite remains green

### Requirement: Documentation states the dsh setup and mapping

`README.md` and `docs/dsh.md` SHALL state the dsh version requirement (Node 24.9+), the `npx @deepseek-ai/dsh` launch forms, the `.agents/skills/` root, the command mapping, and the endpoint configuration needed to run the real-model verification. The documentation SHALL NOT contain credential values.

#### Scenario: README documents the dsh root and entry points

- **WHEN** `README.md` is inspected
- **THEN** it names `.agents/skills/`, `/specfuse`, `/specfuse-full`, and the `/openspec-*` equivalents

#### Scenario: The dsh guide documents endpoint configuration

- **WHEN** `docs/dsh.md` is inspected
- **THEN** it states how `DEEPSEEK_BASE_URL` and `DEEPSEEK_API_KEY` map from an vendor-specific environment file, shows a `cordis.patch.yml` model entry for `your-model-id`, and names the `SPECFUSE_DSH_E2E=1` switch

#### Scenario: No credentials are committed

- **WHEN** the change's files are searched for an Anthropic token, API key value, or the literal contents of `~/private.env`
- **THEN** no credential value is present
