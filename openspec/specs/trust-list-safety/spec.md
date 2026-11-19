# trust-list-safety Specification

## Purpose
Defines how the scaffolder's Claude Code trust write treats the user's global `~/.claude.json`: creating a missing file, merging into a valid one, and preserving an unreadable or malformed one instead of overwriting it.

## Requirements

### Requirement: A missing trust file is created

When `~/.claude.json` does not exist, `trustDirectory()` SHALL create it and write the scaffolded directory's `projects[<path>].hasTrustDialogAccepted = true` entry.

#### Scenario: Missing file gets the trust entry

- **WHEN** the scaffold runs with no `~/.claude.json`
- **THEN** the file is created and contains the target path with `hasTrustDialogAccepted: true`

### Requirement: An unparseable trust file is preserved

When `~/.claude.json` exists but cannot be read or parsed, `trustDirectory()` SHALL leave the file byte-identical, SHALL skip the trust write, and SHALL emit a warning that names the path and states that the file was left unchanged.

#### Scenario: Invalid JSON is preserved

- **WHEN** `~/.claude.json` contains invalid JSON and the scaffold runs
- **THEN** the file's bytes are unchanged, the target directory is not added to `projects`, and a warning names the path

#### Scenario: A non-object root is preserved

- **WHEN** `~/.claude.json` parses to an array, string, number, or `null`
- **THEN** the file's bytes are unchanged, the trust write is skipped, and a warning names the path

#### Scenario: The warning does not expose contents

- **WHEN** an unparseable file triggers the warning
- **THEN** the warning does not include the file's contents, because the global file may contain credentials or other private values

### Requirement: A parseable trust file is merged without losing data

When `~/.claude.json` parses to a JSON object, `trustDirectory()` SHALL preserve every unknown top-level key and every unrelated project entry, and SHALL add or update only the target path's `hasTrustDialogAccepted`.

#### Scenario: Unknown keys and other projects survive

- **WHEN** a valid `~/.claude.json` contains unknown keys and other project entries
- **THEN** the written file retains them and adds the target entry

#### Scenario: A falsy projects field self-heals

- **WHEN** the parsed object has a falsy `projects` value such as `0`, `''`, `false`, or `null`
- **THEN** `projects` becomes an object, other top-level keys survive, and the target entry is written

#### Scenario: A truthy non-object projects field is preserved

- **WHEN** the parsed object has a truthy non-object `projects` value such as a string, number, or array
- **THEN** the file's bytes are unchanged, the trust write is skipped, and a warning names the path

#### Scenario: A non-object target entry is preserved

- **WHEN** `projects[<target>]` is a string, number, boolean, or array
- **THEN** the file's bytes are unchanged, the trust write is skipped, and a warning names the path

### Requirement: A skipped trust write does not fail scaffolding

A skipped trust write SHALL NOT make `scaffold()` throw or exit non-zero. The scaffold SHALL complete, and the warning SHALL be visible on stderr.

#### Scenario: Scaffolding completes with the warning

- **WHEN** an unparseable `~/.claude.json` causes the trust write to be skipped
- **THEN** scaffolding completes successfully and the warning is printed
