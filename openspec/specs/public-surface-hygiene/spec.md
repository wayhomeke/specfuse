# public-surface-hygiene Specification

## Purpose
Defines the public-surface rule that keeps personal environment details out of the repository's shipped documentation, the real-model E2E source, and the dsh capability spec, and the guard that mechanically detects a reintroduced marker.

## Requirements

### Requirement: Public surfaces exclude personal environment identifiers

The public surfaces scanned by `tests/public-surface-hygiene.test.ts` SHALL NOT contain a personal environment file name, a vendor-specific credential variable name, an absolute home-directory path, or a specific versioned model id. A versioned model id is a model-family token followed by a dot-separated numeric version.

#### Scenario: Scanned surfaces

- **WHEN** the guard enumerates its surfaces
- **THEN** it reads `README.md`, `docs/**`, the real-model E2E source, `tests/e2e/LEDGER.md`, and `openspec/specs/dsh-harness-compatibility/spec.md`

#### Scenario: README uses generic endpoint variables

- **WHEN** `README.md` is inspected
- **THEN** it names `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, and `SPECFUSE_DSH_MODEL`, and contains no personal environment file path, vendor-specific credential variable, or specific versioned model id

#### Scenario: The dsh guide uses placeholders

- **WHEN** `docs/dsh.md` is inspected
- **THEN** its `cordis.patch.yml` example uses a model placeholder rather than a concrete versioned model id, and its E2E section reads only process environment variables

#### Scenario: The real-model E2E source stays generic

- **WHEN** `tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts` is inspected
- **THEN** it reads `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, and `SPECFUSE_DSH_MODEL` from the process environment, and contains no personal file name, vendor-specific credential variable, or concrete versioned model id

#### Scenario: The dsh capability spec stays generic

- **WHEN** `openspec/specs/dsh-harness-compatibility/spec.md` is inspected
- **THEN** its documentation requirement describes generic endpoint variables and a model placeholder, and contains no personal file name or concrete versioned model id

### Requirement: Public dsh variables and tool defaults are permitted

The guard SHALL NOT flag `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, `SPECFUSE_DSH_MODEL`, `~/.dsh`, or `~/.claude.json`.

#### Scenario: Public variables pass the guard

- **WHEN** the scanner is given a fixture containing those names
- **THEN** it reports no prohibited marker

### Requirement: The hygiene guard is mechanically enforced

`tests/public-surface-hygiene.test.ts` SHALL scan the public surfaces named above for the prohibited markers and SHALL fail when one is present. A fixture containing each prohibited marker SHALL make the scanner report it, so the guard cannot pass by scanning nothing.

#### Scenario: Current surfaces pass

- **WHEN** `npx vitest run tests/public-surface-hygiene.test.ts` runs against the repository
- **THEN** every scanned surface reports no prohibited marker

#### Scenario: A reintroduced marker fails

- **WHEN** the scanner is given a fixture containing a personal environment file name, a vendor-specific credential variable, an absolute home path, or a specific versioned model id
- **THEN** it reports that marker, and the guard's assertion fails

### Requirement: The real-model E2E gate is generic and visible

The real-model E2E SHALL require `SPECFUSE_DSH_E2E=1`, Node 24.9+, `DEEPSEEK_BASE_URL`, `DEEPSEEK_API_KEY`, and `SPECFUSE_DSH_MODEL`. It SHALL skip with a printed reason when any is absent, and SHALL write the model id from `SPECFUSE_DSH_MODEL` into its patch file. It SHALL run asynchronously and SHALL retry at most once, only when the process exits 0 and the expected output is absent.

#### Scenario: Missing model variable skips visibly

- **WHEN** `SPECFUSE_DSH_MODEL` is absent while the other gate inputs are present
- **THEN** the suite reports a skip reason naming the missing input and remains green

#### Scenario: The patch uses the selected model

- **WHEN** the gate is enabled with `SPECFUSE_DSH_MODEL` set
- **THEN** the generated `cordis.patch.yml` declares that model id and the default model selection uses it

#### Scenario: Output variance may retry once

- **WHEN** dsh exits 0 but the expected line is absent
- **THEN** at most one additional run is allowed

#### Scenario: A process failure is not retried

- **WHEN** dsh exits non-zero or times out
- **THEN** the case fails without a second attempt

### Requirement: No credential values are committed

The public surfaces SHALL NOT contain an API key, token, or password value. Environment variable references are permitted; literal credential values are not.

#### Scenario: Credential audit

- **WHEN** the public surfaces are searched for assignment-shaped credential values
- **THEN** no credential value is found
