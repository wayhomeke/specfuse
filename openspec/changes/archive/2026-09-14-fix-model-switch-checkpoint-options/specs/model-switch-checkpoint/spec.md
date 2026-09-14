## Purpose

Defines the apply-entrance model switch checkpoint: the option set the AI must offer through `AskUserQuestion`, the follow-up behavior of each branch, and the checkpoint's non-skippable status.

## ADDED Requirements

### Requirement: Option set satisfies the tool's input schema

`renderApplyPhase()` output SHALL instruct the AI to supply between 2 and 4 options to `AskUserQuestion`, SHALL name at least two concrete options, and SHALL NOT place a specific model identifier in the option set. The 2–4 bound SHALL be stated in the output itself, so a future edit that drops back to a single option is caught by the text.

#### Scenario: At least two options are named

- **WHEN** `renderApplyPhase()` is called
- **THEN** its output names at least two options for the checkpoint question — `继续使用当前模型` and `切换模型` — so the tool's minimum of two is satisfied and a single-element `options` payload is never constructed

#### Scenario: The upper bound is stated

- **WHEN** `renderApplyPhase()` is called
- **THEN** its output states that the option count MUST NOT exceed four, matching the tool's `maxItems` of 4

#### Scenario: The 2–4 bound is asserted in the rendered text

- **WHEN** `renderApplyPhase()` is called
- **THEN** its output states the option-count constraint as a normative requirement on the AI, rather than expressing the option list as a single example

#### Scenario: No model identifier appears in the option set

- **WHEN** `renderApplyPhase()` is called
- **THEN** neither option is a specific model name, because the generated `CLAUDE.md` is distributed to every project and SHALL NOT bind model identifiers the target project never chose

### Requirement: Continue and switch branches have defined behavior

`renderApplyPhase()` output SHALL define the follow-up behavior for selecting `继续使用当前模型` and for selecting `切换模型` or entering a command through the Other field, and SHALL merge the latter two into a single behavior rather than describing them separately.

#### Scenario: Continue proceeds to the next step

- **WHEN** the rendered protocol is followed and the user selects `继续使用当前模型`
- **THEN** the AI proceeds to the TDD activation step without asking again

#### Scenario: Switch and Other share one behavior

- **WHEN** the user selects `切换模型` OR enters a model command through the Other field
- **THEN** both paths produce the same instruction — prompt the user to run `/model <name>` manually, then re-run `/opsx:apply` — so the switch path does not diverge into two descriptions

#### Scenario: A switch selection stops the AI

- **WHEN** the user selects `切换模型` or enters a model command through the Other field
- **THEN** the rendered protocol requires the AI to stop and SHALL NOT continue to the TDD activation step in the same run

### Requirement: The checkpoint cannot be silently skipped

`renderApplyPhase()` output SHALL state that the checkpoint question is mandatory and that the AI waits for an explicit user selection before proceeding.

#### Scenario: The question is normative

- **WHEN** `renderApplyPhase()` is called
- **THEN** its output contains a MUST-level instruction to ask the checkpoint question through `AskUserQuestion`

#### Scenario: Waiting is required

- **WHEN** `renderApplyPhase()` is called
- **THEN** its output states the step cannot be skipped and the AI must wait for an explicit user selection before executing the following step

### Requirement: The section is exported and assembled in place

`src/templates/claude-md.ts` SHALL export `renderApplyPhase()` so the checkpoint contract can be asserted directly, and the assembled `CLAUDE.md` SHALL carry the checkpoint inside the Apply phase section.

#### Scenario: Named export present

- **WHEN** the module `src/templates/claude-md.ts` is imported
- **THEN** `renderApplyPhase` is among its named exports, alongside `renderApplyFuseReview`, `renderFuseQA`, and `renderVerifyPhase`

#### Scenario: Checkpoint sits at the apply entrance

- **WHEN** `composeCLAUDEmd(ctx)` is called
- **THEN** the model switch checkpoint appears within the Apply phase section and before the step that activates TDD

#### Scenario: Export does not alter assembly

- **WHEN** `composeCLAUDEmd(ctx)` output is compared before and after the export is added
- **THEN** the Apply phase content is unchanged by the export, so the assertion seam introduces no behavioral difference
