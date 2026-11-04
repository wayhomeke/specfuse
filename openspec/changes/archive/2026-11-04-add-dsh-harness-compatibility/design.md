## Context

See `proposal.md` for motivation. Two current properties shape the approach. First, `scaffold()` writes every skill through a composer and every entry point through a composer, so both harnesses can share one source of truth. Second, dsh's skill provider scans one directory level under `.dsh/skills` and `.agents/skills`, reads `CLAUDE.md` as an instruction file, and treats a whitespace-bounded `/name` token naming a user-invocable skill as an explicit invocation that injects the skill body without a model round trip.

The OpenSpec 1.12 CLI already ships a `claude,agents` adapter pair: one `openspec init --tools claude,agents --force` writes `.claude/commands/opsx/`, `.claude/skills/openspec-*/`, and `.agents/skills/openspec-*/`. No new OpenSpec integration is needed.

## Goals / Non-Goals

**Goals:**

- A project scaffolded once carries a working pipeline in both Claude Code and dsh.
- One composer per artifact; no second authored copy of a skill body.
- The dsh entry points behave like the Claude commands: explicit invocation, requirement from trailing text, no questions.
- Real dsh execution evidence is reproducible without committing credentials.

**Non-Goals:**

- A dsh plugin package or a `ctx.commands` registration. SpecFuse remains a scaffolder that writes files.
- Reimplementing the Superpowers skills for dsh. The pipeline prose already states its TDD and verification rules inline.
- Supporting dsh SDK, ACP, or Web profiles beyond what the shared `.agents/skills` root provides.
- Auto-installing dsh or writing user credentials.
- Changing the Claude Code command surface.

## Decisions

### D1 — Install shared skills under `.agents/skills/`

dsh scans `<projectRoot>/.dsh/skills` (rank 100) and `<projectRoot>/.agents/skills` (rank 200). OpenSpec's `agents` adapter writes `.agents/skills/openspec-*`, and the same root is readable by other AGENTS-compatible harnesses.

Alternatives: `.dsh/skills` ranks higher but splits the dsh skills from the OpenSpec skills into two roots; writing both roots duplicates every skill and creates two drift surfaces; symlinking `.dsh/skills` to `.agents/skills` depends on platform symlink support and is not preserved by every checkout. Chosen: `.agents/skills`.

### D2 — Entry points are user-invocable, model-disabled skills

dsh's `/name` gesture loads a user-invocable skill into the step even when `disable-model-invocation: true`. That gives command semantics without a runtime plugin: the user chooses the pipeline, the model cannot start it on its own, and the text after the token remains available as the requirement.

Alternatives: a dsh plugin registering `ctx.commands` would need a published package, a profile patch, and lifecycle ownership; plain prose in `AGENTS.md` would make the entry points model-invoked and repository-wide. Chosen: two skills, `specfuse` and `specfuse-full`, both `user-invocable: true` and `disable-model-invocation: true`.

The bodies share the Claude command's pipeline body. They differ in the invocation phrase, the FuseDoc path, the OpenSpec verify invocation, and the missing-requirement line. The shared renderer takes a harness argument so order and prohibitions cannot drift.

### D3 — One composer per skill body, rendered twice

`composeDesignMdSkill`, `composeFuseDocSkill`, `composeFuseReviewSkill`, and `composeFuseQASkill` render both roots. The scaffolder copies each rendered body to `.claude/skills/<name>/SKILL.md` and `.agents/skills/<name>/SKILL.md`, then copies the same assets to both roots. Tests compare the two copies byte for byte.

Alternatives: separate dsh templates would permit harness-specific wording but double the maintenance and the tests; symlinks are rejected as in D1. Chosen: one composer, two destinations.

### D4 — Request both OpenSpec adapters in one subprocess

`initOpenspec(cwd)` becomes `openspec init --tools claude,agents --force`. OpenSpec initializes both adapter sets in one run, reports both in its summary, and keeps one readiness outcome for the scaffolder. Two sequential init calls would double the subprocess budget and could leave a half-initialized project when the second call fails.

### D5 — The real-model E2E is opt-in and self-skipping

The case reads `SPECFUSE_DSH_E2E=1`, checks Node 24.9+, checks that `~/private.env` exists, and otherwise prints a skip reason. It writes its scratch project and `DSH_HOME` under the repository's ignored `tmp/` tree. The model route is configured through `DEEPSEEK_BASE_URL` and `DEEPSEEK_API_KEY`, mapped in the test process from `SOURCE_BASE_URL` and `SOURCE_AUTH_TOKEN`; no credential value enters a file.

Alternatives: always-run would make the default suite network-dependent and nondeterministic; a manual script would sit outside the regression gate. Chosen: gated test, so Verify can run it by setting the switch while ordinary runs stay hermetic.

The patch file sets only the model catalog and the default selection:

```yaml
- id: llm-deepseek
  config:
    models:
      - id: your-model-id
- id: agent-default-model
  config:
    provider: deepseek-official
    model: your-model-id
```

The endpoint and key stay in the environment. Setting `apiKeyEnv: SOURCE_AUTH_TOKEN` was rejected because it couples the artifact to one environment file's variable name.

### Component and data flow

```
src/templates/specfuse-command.ts
  ├─ composeSpecfuseCommand()               -> .claude/commands/specfuse.md
  ├─ composeSpecfuseFullCommand()           -> .claude/commands/specfuse/full.md
  ├─ composeSpecfuseDshSkill('default')     -> .agents/skills/specfuse/SKILL.md
  └─ composeSpecfuseDshSkill('full')        -> .agents/skills/specfuse-full/SKILL.md

src/templates/{design-md,fusedoc,fusereview,fuseqa}-skill.ts
  ├─ compose*Skill()                        -> .claude/skills/<name>/SKILL.md
  └─ compose*Skill()                        -> .agents/skills/<name>/SKILL.md

src/scaffolder.ts
  ├─ installSharedSkill(root, name)         -> writes both roots, copies assets
  ├─ installEntrySkill(root, name)          -> writes only if absent
  └─ print listing                          -> names both roots

src/utils/tools.ts
  └─ initOpenspec(cwd)                      -> openspec init --tools claude,agents --force
```

### Public API surface

```ts
type SpecfuseMode = 'default' | 'full';

export function composeSpecfuseCommand(): string;              // unchanged
export function composeSpecfuseFullCommand(): string;          // unchanged
export function composeSpecfuseDshSkill(mode: SpecfuseMode): string;

export function initOpenspec(cwd: string): Promise<boolean>;   // contract unchanged
```

`TemplateContext` is unchanged. No CLI flag is added; dsh support is unconditional, like Claude Code support.

### Error handling

- A missing template source directory remains fatal; a skill that references uncopied assets fails at scaffold time rather than at first use.
- An existing `.agents/skills/<name>/SKILL.md` is preserved, including a zero-byte file, matching the `.claude` rule.
- OpenSpec init failure remains non-fatal: the scaffolder records `install-failed` or `init-failed`, writes every non-OpenSpec artifact, and prints the dual-adapter repair command.
- The real-model E2E distinguishes "cannot execute" from "failed": missing dsh, Node, endpoint, or switch prints a skip reason; an executed dsh run with a non-zero exit or a missing expected skill fails the case.
- The patch file contains no secret, so a failed model call reports an endpoint or credential problem without exposing a key.

## Risks / Trade-offs

- **`.agents/skills` is a shared harness root.** Another AGENTS-compatible harness will also see these skills. The bodies are standard `SKILL.md` and the names are project-scoped; the trade-off is visibility in exchange for one root shared with OpenSpec. → Document the root and keep the skill names stable.
- **The real-model E2E depends on model compliance.** The missing-requirement case relies on the model printing an exact line. The skill body states the line verbatim, the case asserts a substring, and the case is gated. → If compliance proves unreliable, move the assertion to the catalog and keep the invocation case as a recorded manual check; do not loosen it into a generic "model answered" assertion.
- **OpenSpec's adapter output can change.** The deterministic E2E asserts `.agents/skills/openspec-propose/SKILL.md`, a stable adapter artifact. → A future OpenSpec rename turns the case red at the upgrade boundary, which is the correct signal.
- **Two copies of each skill in a project.** Disk cost is small; the alternative is harness-specific duplication or symlinks. → Byte-equality tests keep them from drifting.

## Migration Plan

Existing projects rerun `npm create specfuse@latest .`; the scaffolder adds `.agents/skills/` and leaves existing `.claude` files untouched. To refresh generated dsh skills after a template change, delete `.agents/skills/{design-md,fusedoc,fusereview,fuseqa,specfuse,specfuse-full}` and rerun the scaffolder. Rollback is deleting `.agents/`; the Claude Code surface is unaffected.

## Open Questions

None. The automatic decisions in this change selected `.agents/skills`, user-invocable entry skills, one composer for both roots, the dual OpenSpec adapter call, and the opt-in real-model E2E.
