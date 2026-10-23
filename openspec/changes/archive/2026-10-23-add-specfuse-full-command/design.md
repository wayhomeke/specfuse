## Context

`/specfuse` 的模板由 `composeSpecfuseCommand()` 生成，安装在 `.claude/commands/specfuse.md`。它明确不进入 FuseQA；FuseQA 是独立技能，只能显式 `/fuseqa` 调用。新增 `/specfuse:full` 需要一套几乎相同、但多一个阶段并按 `auto: entered` 记录 FuseQA 的文本。

约束：默认命令的输出已被安装副本逐字节测试固定，重构不能改变它；scaffolder 对已存在的命令文件不覆盖；Claude Code 支持命名空间命令（`.claude/commands/<ns>/<cmd>.md` → `/<ns>:<cmd>`）。

## Goals / Non-Goals

**Goals:**

- 一条命令跑完五阶段，FuseQA 在 FuseReview 之后、Verify 之前。
- 两个命令共享同一套自动决策、TDD、verify 门禁与禁止 commit/push 规则。
- 默认 `/specfuse` 的输出与行为完全不变。
- 命令文本、安装副本、文档与测试由同一模板派生，避免漂移。

**Non-Goals:**

- 不把 FuseQA 变回检查点。
- 不改变 `/specfuse` 或 `/fuseqa` 的现有契约。
- 不实现 CI/CD 或提交/推送。

## Decisions

### D1：一个共享渲染器，两种模式

`src/templates/specfuse-command.ts` 内部使用 `renderSpecfuseCommand(mode: 'default' | 'full')`。对外保留 `composeSpecfuseCommand()`（默认模式，输出逐字节不变），新增 `composeSpecfuseFullCommand()`。两种模式共享自动决策、workspace、artifacts、apply、prohibitions 等段落；差异仅在标题、usage、FuseQA 决策行、执行顺序、worktree 列表与最终报告。

否决复制整份模板：两套文本会独立漂移，而默认命令已有逐字节一致性测试。

### D2：FuseQA 是步骤，不是检查点

全量命令在第 4 步 FuseReview 之后插入第 5 步 FuseQA，再进入 Verify。它自动执行、不调用 `AskUserQuestion`，在最终报告记录 `auto: entered`。这样 FuseQA 新写的用例会进入随后 Verify 的全量测试。

### D3：命名空间路径

命令写入 `.claude/commands/specfuse/full.md`，与既有 `.claude/commands/specfuse.md` 并存，Claude Code 将其暴露为 `/specfuse:full`。scaffolder 用 `fileExists()` 判断存在性，已存在则不覆盖。

### D4：CLAUDE.md 只增加一段说明

`renderAutoMode()` 在现有 `/specfuse` 规则之外增加一句：`/specfuse:full` 是完整变体，在 FuseReview 后、Verify 前进入 FuseQA，两个决策都记录为 `auto: entered`；其余规则不变。默认 `/specfuse` 的 FuseQA 按需声明保持不变。

## 公共 API

```ts
// src/templates/specfuse-command.ts
export function composeSpecfuseCommand(): string;      // unchanged output
export function composeSpecfuseFullCommand(): string;  // new

// src/scaffolder.ts
export async function scaffold(config: ProjectConfig): Promise<void>; // writes both command files
```

## 错误处理

无新增运行时路径：模板是纯字符串组装，scaffolder 的写入与异常语义不变。

## Risks / Trade-offs

- **默认命令输出被重构改变** → 保留 `composeSpecfuseCommand()` 的逐字节测试；共享渲染器的默认分支必须复现原文。
- **两套文本漂移** → 差异集中在少量插值点，其余段落共享。
- **命名空间路径与既有文件冲突** → `specfuse.md` 与 `specfuse/` 目录可以并存；测试覆盖两者同时写入。
- **既有项目没有新命令** → 重跑 scaffolder 即可补写；已存在的完整命令不被覆盖。
