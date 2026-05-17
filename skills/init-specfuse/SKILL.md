---
name: init-specfuse
description: "Use when initializing a new project with OpenSpec + Superpowers fusion methodology, or when the user says 'init specfuse', 'setup specfuse', or wants to scaffold a spec-driven project"
---

# SpecFuse Project Initialization

Initialize the current directory with the OpenSpec + Superpowers fusion methodology. This skill generates all configuration files needed for spec-driven AI development with TDD enforcement.

## When to Use

- User wants to set up a new project with specfuse methodology
- User says "init specfuse", "/init-specfuse", or "set up spec-driven development"
- A project directory exists but lacks CLAUDE.md and openspec/ configuration

## When NOT to Use

- Project already has a CLAUDE.md with `<!-- FUSION:START -->` marker
- User just wants to explore or brainstorm (use `/opsx:explore` instead)

## Process

### Step 1: Detect Existing State

Check what already exists:

```bash
test -f CLAUDE.md && echo "CLAUDE.md exists" || echo "no CLAUDE.md"
test -d openspec && echo "openspec/ exists" || echo "no openspec/"
test -f .claude/settings.local.json && echo "settings exists" || echo "no settings"
test -d .git && echo "git repo" || echo "not a git repo"
```

If CLAUDE.md already contains `<!-- FUSION:START -->`, warn the user and ask if they want to overwrite.

### Step 2: Ask the User One Question

Use AskUserQuestion to ask which tech stack they want. Offer these built-in options plus a custom option:

1. **Rust** — cargo build/test, clippy, Clean Architecture
2. **Go** — go build/test, golangci-lint, Clean Architecture
3. **TypeScript + React** — npm/vitest, eslint, Component-based
4. **Python + FastAPI** — pytest, ruff, Layered Architecture
5. **Custom** — user provides their own build/test/lint commands

If user picks "Custom", ask follow-up questions one at a time:
- Language name?
- Build command?
- Test command?
- Lint command?
- Architecture style?

### Step 3: Generate Files

Generate the following files. Use the stack profile reference below to fill in stack-specific values.

#### 3a. `.gitignore`

Write a .gitignore with stack-specific build/dependency patterns plus these shared patterns:

```
# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local
.env.*.local

# Logs
*.log

# Temporary
/tmp/
```

Stack-specific patterns to prepend:
- **Rust**: `/target/`
- **Go**: `/bin/`, `/dist/`, `/vendor/`
- **TypeScript+React**: `node_modules/`, `/dist/`, `/build/`, `.next/`, `*.tsbuildinfo`
- **Python+FastAPI**: `__pycache__/`, `*.egg-info/`, `.venv/`, `*.pyc`, `.mypy_cache/`, `.ruff_cache/`, `/dist/`

#### 3b. `CLAUDE.md`

Generate a CLAUDE.md with this exact structure. Replace `{{test_cmd}}` and `{{lint_cmd}}` with the stack's actual commands:

```markdown
# Project CLAUDE.md

## Tech Stack
[Fill from stack profile: language, framework, architecture, build/test/lint/format commands]

## Commit Convention
- Use conventional commits: feat:, fix:, refactor:, test:, docs:, chore:
- All commit messages in English

---

<!-- FUSION:START -->
## OpenSpec & Superpowers Composite Workflow Constraints

This project enforces a fused OpenSpec + Superpowers engineering pipeline.
AI agents MUST follow these rules without exception.

### Path A: One-Shot Proposal

When `/opsx:propose` is invoked:

1. **MUST activate Superpowers `brainstorming` as a pre-requisite skill.**
   - Ask ONE question at a time (Socratic method). Never fire multiple questions in a single turn.
   - Proactively present 2-3 architectural alternatives with explicit trade-offs.
   - Only after human confirms the approach, generate ALL artifacts (proposal -> design -> specs -> tasks) in one pass.

2. Every proposal artifact MUST contain:
   - **Non-goals** section (what this change explicitly does NOT do)
   - **Trade-offs** section (alternatives considered and why they were rejected)
   - **Verification strategy** (how we know this change works)

### Path B: Step-by-Step Change

When `/opsx:new` is invoked:

1. **MUST activate Superpowers `brainstorming` as a pre-requisite skill BEFORE creating the change.**
   - Use Socratic questioning to clarify the user's intent and scope.
   - Do NOT rush to `openspec new change`. First understand WHAT and WHY.
   - Only after the user confirms scope, derive a kebab-case name and create the change directory.

2. After `openspec new change`, STOP at showing the first artifact template.
   - Do NOT auto-generate any artifact content. Wait for user direction.
   - Show the schema workflow, artifact sequence, and current status.

3. When `/opsx:continue` is invoked to advance to the next artifact:
   - Read current `openspec status --change <name>` to find the next "ready" artifact.
   - Fetch instructions via `openspec instructions <artifact-id> --change <name>`.
   - For **proposal** artifacts: apply brainstorming rules (Non-goals, Trade-offs, Verification strategy).
   - For **design** artifacts: MUST include dependency diagram, public API surface, error handling strategy.
   - For **specs** artifacts: each spec must be independently testable with success + failure behaviors.
   - For **tasks** artifacts: enforce TDD order, max 2-hour chunks, verification commands per task.
   - After drafting each artifact, STOP and wait for user review before advancing.

4. **Pace control: one artifact per `/opsx:continue` invocation.**
   - Never auto-advance to the next artifact without explicit user confirmation.

### Exploration

When `/opsx:explore` is invoked:

1. Enter thinking-partner mode. No artifact creation, no directory scaffolding.
2. Activate Superpowers `brainstorming` for structured exploration.
3. Output is conversational — conclusions can later feed into Path A or Path B.

### Phase 2: Apply / Implement

When `/opsx:apply` is invoked:

1. **MUST activate Superpowers `test-driven-development` as a pre-requisite skill.**
   - For every task in `tasks.md`, follow strict Red-Green-Refactor:
     a. Write a failing test FIRST
     b. Write minimal code to make it pass
     c. Refactor while keeping tests green

2. **MUST activate Superpowers `verification-before-completion` before marking ANY task done.**
   - **IRON LAW: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**
   - Before checking off a task `[x]`, you MUST:
     a. Run the actual verification command in the terminal (`{{test_cmd}}`)
     b. Paste the raw output as evidence
     c. Only then mark the task complete
   - "I believe it works" or "it should pass" is NEVER acceptable.

3. **Subagent discipline** (when using parallel agents):
   - Each subagent works in its own git worktree
   - Each subagent runs its own tests independently
   - Main agent verifies integration after merging subagent work

### Phase 3: Verify / Archive

Before `/opsx:archive`:

1. Run `/opsx:verify` to validate implementation matches all specs
2. Run full test suite (`{{test_cmd}}`) and paste evidence
3. Run linter (`{{lint_cmd}}`) with zero warnings

### General Rules

- **Never skip TDD.** Even for "simple" changes. Especially for "simple" changes.
- **Never trust memory over terminal output.** Always verify current state.
- **One concern per commit.** Keep commits atomic and reversible.
- **Fail loud, fail early.** Prefer compile-time errors over runtime surprises.
- **Dependencies flow inward.** Domain logic never imports infrastructure.
<!-- FUSION:END -->
```

#### 3c. `.claude/settings.local.json`

Generate with stack-specific permissions plus these shared permissions:

```json
{
  "permissions": {
    "allow": [
      "...stack-specific permissions...",
      "Bash(git status *)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git branch *)",
      "Bash(git add *)",
      "Bash(git stash *)",
      "Bash(git worktree *)",
      "Bash(git init *)",
      "Bash(git clone *)",
      "Bash(openspec *)",
      "Bash(find *)",
      "Bash(ls *)",
      "Bash(rg *)",
      "Bash(grep *)",
      "Bash(wc *)",
      "Bash(tree *)",
      "WebSearch"
    ]
  }
}
```

Stack-specific permissions:
- **Rust**: `Bash(cargo test *)`, `Bash(cargo build *)`, `Bash(cargo clippy *)`, `Bash(cargo fmt *)`
- **Go**: `Bash(go test *)`, `Bash(go build *)`, `Bash(go vet *)`, `Bash(golangci-lint *)`, `Bash(gofmt *)`
- **TypeScript+React**: `Bash(npm test *)`, `Bash(npm run *)`, `Bash(npx vitest *)`, `Bash(npx tsc *)`, `Bash(npx eslint *)`, `Bash(npx prettier *)`
- **Python+FastAPI**: `Bash(python -m pytest *)`, `Bash(pip install *)`, `Bash(ruff *)`, `Bash(mypy *)`, `Bash(uvicorn *)`, `Bash(python *)`

#### 3d. `openspec/config.yaml`

```yaml
schema: spec-driven

context: |
  [Stack-specific context: tech stack, build/test/lint tools, architecture, error handling, concurrency]

rules:
  proposal:
    - Always include a "Non-goals" section
    - Include "Trade-offs" section with at least 2 alternatives considered
    - Must reference affected modules/packages by name
    - Keep proposals under 800 words
  design:
    - Must include a dependency diagram (ASCII or mermaid)
    - Must specify public API surface
    - Must address error handling strategy
    - Must address concurrency implications if applicable
  specs:
    - Each spec must be independently testable
    - Specs must define both success and failure behaviors
    - Include boundary conditions and edge cases
    - Reference specific types/interfaces, not vague descriptions
  tasks:
    - Break tasks into chunks of max 2 hours
    - Each task must have a clear "done" definition verifiable by running a command
    - Tasks must follow TDD order - write test first, then implement, then refactor
    - Every task must include a verification command
    - Mark blocking dependencies explicitly between tasks
```

#### 3e. OpenSpec Directory Structure

```bash
mkdir -p openspec/specs openspec/changes/archive
```

### Step 4: Try OpenSpec Init

If `openspec` CLI is available, run it to install skills and commands:

```bash
openspec init --tools claude --force
```

If not available, inform the user:
> OpenSpec CLI not found. To install skills and commands, run:
> `npm i -g @fission-ai/openspec && openspec init`

### Step 5: Summary

Show the user what was created:

```
Project initialized with SpecFuse methodology!

  CLAUDE.md                         Bridge declaration (fusion workflow constraints)
  .gitignore                        [Stack] patterns
  .claude/settings.local.json       Permission allowlist
  openspec/config.yaml              Spec-driven config with [Stack] context

Next steps:
  /opsx:propose    Start your first change (fast mode)
  /opsx:new        Start your first change (step-by-step mode)
  /opsx:explore    Think through an idea first
```

## Stack Profiles Quick Reference

| Field | Rust | Go | TypeScript+React | Python+FastAPI |
|-------|------|----|-----------------|----------------|
| Build | `cargo build` | `go build ./...` | `npm run build` | `pip install -e .` |
| Test | `cargo test` | `go test ./...` | `npx vitest run` | `python -m pytest tests/ -v` |
| Lint | `cargo clippy -- -D warnings` | `golangci-lint run` | `npx eslint .` | `ruff check .` |
| Format | `cargo fmt` | `gofmt -w .` | `npx prettier --write .` | `ruff format .` |
| Architecture | Clean / Hexagonal | Clean / Hexagonal | Component / Feature-sliced | Layered (API->Service->Repo) |
| Error handling | Result\<T,E\> | if err != nil | strict mode + Error boundaries | exceptions + HTTPException |
| Concurrency | tokio async + channels | goroutines + channels | React concurrent + async/await | asyncio + async endpoints |
