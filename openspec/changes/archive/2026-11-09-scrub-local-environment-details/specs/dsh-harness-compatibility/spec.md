## MODIFIED Requirements

### Requirement: Documentation states the dsh setup and mapping

`README.md` and `docs/dsh.md` SHALL state the dsh setup, command mapping, and generic endpoint configuration needed to run the real-model verification. Configuration examples SHALL use a model placeholder and SHALL NOT contain credential values, a personal environment file name, a vendor-specific credential variable, or a concrete versioned model id.

#### Scenario: README documents the dsh root and entry points

- **WHEN** `README.md` is inspected
- **THEN** it names `.agents/skills/`, `/specfuse`, `/specfuse-full`, and the `/openspec-*` equivalents

#### Scenario: The dsh guide documents endpoint configuration

- **WHEN** `docs/dsh.md` is inspected
- **THEN** it states `DEEPSEEK_BASE_URL` and `DEEPSEEK_API_KEY` as the endpoint and credential variables, shows a `cordis.patch.yml` model entry with a placeholder model id, and names the `SPECFUSE_DSH_E2E=1` switch and `SPECFUSE_DSH_MODEL`

#### Scenario: No credentials are committed

- **WHEN** `README.md`, `docs/dsh.md`, the real-model E2E source, and the dsh capability spec are searched for a credential value, a personal environment file name, a vendor-specific credential variable, or a concrete versioned model id
- **THEN** none is present
