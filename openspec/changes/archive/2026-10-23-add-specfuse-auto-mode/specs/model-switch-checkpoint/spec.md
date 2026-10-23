## MODIFIED Requirements

### Requirement: The checkpoint cannot be silently skipped

`renderApplyPhase()` output SHALL state that the checkpoint question is mandatory for `/opsx:apply` invocations and that the AI waits for an explicit user selection before proceeding. Auto-mode invocations are governed by the `specfuse-auto-mode` capability; this requirement SHALL NOT be read as applying to them.

#### Scenario: The question is normative

- **WHEN** `renderApplyPhase()` is called
- **THEN** its output contains a MUST-level instruction to ask the checkpoint question through `AskUserQuestion` for interactive invocations

#### Scenario: Waiting is required

- **WHEN** `renderApplyPhase()` is called
- **THEN** its output states that the interactive step cannot be skipped and the AI must wait for an explicit user selection before executing the following step
