## Context

`scaffold()` sets up OpenSpec in one block and prints its summary in another. The setup block has three failure branches, each calling `spinner.warn` and discarding the outcome — so the print block cannot know what happened, and the warning itself scrolls out of view behind 8 further lines. The result is a success report ending in an instruction to run a command that does not exist.

Two existing facts shape the design:

- **The Superpowers notice is the precedent.** `hasSuperpowersPlugin()` is checked at print time and emits a four-line `chalk.yellow`/`chalk.dim` block at the end. The OpenSpec notice takes the same shape, by explicit decision.
- **`hasSuperpowersPlugin()` probes the filesystem at print time; OpenSpec cannot.** Whether OpenSpec became ready is the outcome of work this run performed. A filesystem probe for `.claude/commands/opsx/` would report a directory left by an earlier run as success — masking this run's failure. Readiness must be carried, not re-derived.

## Goals / Non-Goals

**Goals:** carry the OpenSpec outcome from setup to print; annotate the one `Next steps` line that is wrong; append a notice distinguishing install failure from init failure. Exit code unchanged.

**Non-Goals:** making OpenSpec required; a `--no-openspec` flag; restructuring `Next steps`; touching the Superpowers notice; retrying installs; removing the transient `spinner.warn` calls.

## 依赖关系图

```
src/scaffolder.ts
  scaffold(config)
    │
    ├── [setup block]  if (config.initOpenspec)
    │     detectOpenspec() ──┬── true  ──> initOpenspec() ──> ok? ready : 'init-failed'
    │                        └── false ──> installOpenspec() ──┬── true  ──> initOpenspec() ──> ok? ready : 'init-failed'
    │                                                          └── false ──> 'install-failed'
    │     writes ──> openspecStatus: OpenspecStatus     [new local, single assignment per branch]
    │
    └── [print block]  reads openspecStatus
          ├── renderNextSteps()      annotates the /opsx:propose comment when not 'ready'
          └── renderOpenspecNotice() emits nothing when 'ready' or 'skipped';
                                     repair commands selected by which failure occurred
```

No new modules and no new imports. `OpenspecStatus` is local to `scaffolder.ts`; it is not part of `ProjectConfig` or `TemplateContext`, because it is a runtime outcome rather than user configuration — putting it in the config types would imply a caller could set it.

## 公共 API 表面

Unchanged. `scaffold(config: ProjectConfig): Promise<void>` keeps its signature and its resolve-always behavior. Nothing new is exported.

Internal shape:

| Symbol | Type | Purpose |
|---|---|---|
| `OpenspecStatus` | `'skipped' \| 'ready' \| 'install-failed' \| 'init-failed'` | The outcome carried from setup to print |
| `openspecStatus` | local `OpenspecStatus` | Initialized `'skipped'`; assigned once per setup branch |

`'skipped'` and `'ready'` both print the unannotated line and no notice, but they are distinct states: `'skipped'` means nothing was attempted (`initOpenspec` false), `'ready'` means it succeeded. Collapsing them into a boolean would make the notice's silence ambiguous — the spec asserts the declined case separately for this reason.

## 关键决策

**决策 1:四态枚举而非布尔。** A boolean `openspecReady` cannot select repair commands: install failure needs two, init failure needs one. The two failure states already exist implicitly — the current code has differently-worded warnings for them — so the enum records a distinction the code already makes rather than inventing one. Rejected alternative: a boolean plus a separate message string, which puts presentation in the setup block and splits one decision across two variables.

**决策 2:就地赋值,不改控制流。** The four assignments go into the existing branches. Restructuring the setup block (extracting a function returning the status) would enlarge the diff for a defect whose fix is "remember what happened", and would move the `spinner` calls out of their context.

**决策 3:注解替换尾部注释,不追加。** The annotated line replaces `# start your first change` rather than appending to it. Appending would produce a line asserting both that this is the next step and that it is not yet usable. The spec asserts `# start your first change` is absent on the failure path for this reason.

**决策 4:提示块用与 Superpowers 一致的呈现。** Same `chalk.yellow` heading + `chalk.dim` body, same position (end of output). A different visual treatment would suggest a different kind of problem; these are the same kind — a missing optional dependency with a known repair.

**决策 5:保留瞬时 `spinner.warn`。** They remain useful for someone watching the run live. The notice is additive: it makes the information survive to the end of output, it does not replace the in-flight signal.

## 错误处理策略

| 场景 | 处理 | 依据 |
|---|---|---|
| `installOpenspec()` returns false | `'install-failed'`; notice lists install + init | Both steps still needed |
| `initOpenspec()` returns false (CLI present) | `'init-failed'`; notice lists init only | CLI is installed; re-installing is noise |
| `initOpenspec()` returns false (after install) | `'init-failed'` | Same repair: the CLI is present now |
| `config.initOpenspec` false | `'skipped'`; unannotated line, no notice | Nothing attempted, nothing failed |
| `trustDirectory()` throws | Unchanged (caught, non-fatal) | Out of scope |

`initOpenspec()` already swallows its own errors and returns a boolean, so no new try/catch is introduced.

## 风险 / 权衡

- **[注解措辞与提示块措辞不一致导致读者困惑]** → the annotation names the notice's position ("see the note below"); both are emitted from the same code path, and the spec asserts the annotation and the notice appear together.
- **[将来 `Next steps` 增行时注解逻辑被绕过]** → the spec asserts the block's line sequence on both paths, so an inserted line that skips the annotation shows up as a failing comparison.
- **[E2E 环境恰好就是失败路径,可能掩盖成功路径的回归]** → the existing E2E cases run with `openspec` off `PATH` and a stubbed `npm`, i.e. always `'install-failed'`. The success path therefore needs its own coverage; the spec asserts the verbatim line and the absence of the notice, and the unit suite (where `utils/tools.js` is mocked) is where `'ready'` and `'init-failed'` are exercised.

## 迁移计划

None. No data, no dependencies, no generated-artifact changes — the scaffolded project is byte-identical; only the CLI's own stdout differs, and only on a path that was previously misleading. Rollback is reverting one file.

Version impact: user-visible output change on a failure path, no contract change — patch release.
