# cli-version-banner Specification

## Purpose
Defines the version line the scaffolder prints at startup: a single `SpecFuse v<semver>` line derived from `package.json`, visible in interactive and non-interactive runs, without changing `--version` or `--help`.

## Requirements

### Requirement: Scaffolder startup prints the version line

When the CLI runs its scaffolding action, it SHALL print exactly one line `SpecFuse v<semver>` before prompting the user or scaffolding, with the version read from `package.json`. The line SHALL appear in both interactive and `--yes` runs.

#### Scenario: Non-interactive run prints the banner

- **WHEN** the built CLI is invoked with a project name and `--yes`
- **THEN** stdout contains `SpecFuse v<version>` matching `package.json`

#### Scenario: Interactive run prints the banner before prompts

- **WHEN** the CLI starts the scaffolding action without `--yes`
- **THEN** the banner is printed before the first prompt

#### Scenario: Banner is printed once

- **WHEN** the scaffolding action runs
- **THEN** `SpecFuse v<version>` appears exactly once on stdout

### Requirement: Version and help outputs are unchanged

`--version` SHALL continue to print only the version string, and `--help` SHALL NOT print the banner.

#### Scenario: Version output stays bare

- **WHEN** the built CLI is invoked with `--version`
- **THEN** stdout is only the version string and contains no `SpecFuse v` banner

#### Scenario: Help output stays banner-free

- **WHEN** the built CLI is invoked with `--help`
- **THEN** stdout does not contain the `SpecFuse v<version>` startup line
