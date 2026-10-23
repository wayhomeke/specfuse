# cli-help-links Specification

## Purpose
Defines the help-footer contract for the CLI: every `create-specfuse --help` invocation names the public repository and the README documentation by absolute URL, so a user can reach the source and the docs from the terminal.

## Requirements

### Requirement: Help output links to the repository and README

The built CLI's `--help` output SHALL contain the absolute GitHub repository URL and the absolute README documentation URL. The links SHALL appear in the help footer, and SHALL NOT alter the description, arguments, options, or `--version` output.

#### Scenario: Repository link present

- **WHEN** the built CLI is invoked with `--help` through its real entry path
- **THEN** the output contains `https://github.com/wayhomeke/specfuse`

#### Scenario: README link present

- **WHEN** the built CLI is invoked with `--help` through its real entry path
- **THEN** the output contains `https://github.com/wayhomeke/specfuse/blob/main/README.md`

#### Scenario: Version output unchanged

- **WHEN** the built CLI is invoked with `--version`
- **THEN** the output is only the version string, with no repository or documentation URL

#### Scenario: Links are absolute

- **WHEN** the help output is inspected
- **THEN** both links are absolute HTTPS URLs pointing at the public repository, not relative paths or placeholders
