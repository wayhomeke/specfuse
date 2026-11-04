## MODIFIED Requirements

### Requirement: The notice distinguishes install failure from init failure

`scaffold(config)` SHALL report which of the two failure modes occurred, because they require different repair steps. Repair commands SHALL name the dual-adapter initialization `openspec init --tools claude,agents --force`, so a repair produces both the Claude Code command surface and the dsh-discoverable skills.

#### Scenario: Install failure lists both commands

- **WHEN** the OpenSpec CLI is absent and installing it fails
- **THEN** the notice contains both `npm i -g @fission-ai/openspec` and `openspec init --tools claude,agents --force`

#### Scenario: Init failure lists only the init command

- **WHEN** the OpenSpec CLI is present or was installed successfully, but `openspec init` fails
- **THEN** the notice contains `openspec init --tools claude,agents --force` and does NOT instruct the user to install the CLI again

#### Scenario: Readiness is tracked, not inferred from the filesystem

- **WHEN** `scaffold(config)` determines what to print
- **THEN** the decision derives from the outcome recorded by the OpenSpec setup step, not from probing for `.claude/commands/opsx/`, so a pre-existing directory from an earlier run cannot mask a failure in this one
