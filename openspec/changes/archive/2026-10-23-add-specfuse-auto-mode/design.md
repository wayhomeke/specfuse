## Context

SpecFuse 把流水线协议写在生成的 `CLAUDE.md` 中，把四个技能写在 `.claude/skills/`，斜杠命令面由 OpenSpec 自己生成。`/specfuse` 不属于 OpenSpec 的命令面，因此必须由 SpecFuse 自己分发：模板 → scaffolder → 目标项目 `.claude/commands/specfuse.md`。

约束：命令文本与 `CLAUDE.md` 的检查点规则必须同时存在且不互相矛盾；`CLAUDE.md` 对 `/opsx:*` 的 MUST 级规则保持不变；本仓库既是模板所有者，也是自身命令的安装目标。

## Goals / Non-Goals

**Goals:**

- 一个命令入口完成 brainstorm → 制品生成 → apply → FuseReview → verify → archive。
- 所有原本要问人的决策点由模型按推荐值自答，并在最终报告中留痕。
- 保持 TDD、verification evidence、FuseReview 与 FuseDoc 的约束不变。
- 命令与 `CLAUDE.md` 的自动模式声明由同一套模板生成，避免手写漂移。

**Non-Goals:**

- 不改变 `/opsx:*` 的交互行为。
- 不引入新的运行时依赖或配置系统。
- 不实现自动 commit/push/merge。
- 不替用户决定合并 worktree。

## Decisions

### D1：命令由模板生成，scaffolder 负责落盘

新增 `src/templates/specfuse-command.ts`，导出纯函数 `composeSpecfuseCommand(): string`。`scaffold()` 在写完技能后写入 `.claude/commands/specfuse.md`；目标路径已存在时不覆盖，沿用技能分发的保守策略。

否决“手写命令文件”：命令文本是随项目分发的产物，手写副本会与模板漂移；本仓库的 `installed-skills` 测试已经确立了“安装副本必须等于模板输出”的契约，命令沿用同一模式。

### D2：直接驱动 OpenSpec 阶段，不委托 `/opsx:propose` 或 `/opsx:apply`

命令体内按 OpenSpec 的 artifact 指令直接生成 proposal/specs/design/tasks，再按 tasks 实施。否决委托：`/opsx:propose` 在生成制品前要求用户确认方案，`/opsx:apply` 强制模型切换询问，委托会使自动模式被被调命令反向阻断。

### D3：`CLAUDE.md` 增加 Auto Mode 声明，而不是只靠命令文本

`src/templates/claude-md.ts` 新增 `renderAutoMode()`，作为独立段落插入融合块，位置在 Path A 之前。段落声明：`/specfuse` 下不问 brainstorm、模型切换、FuseReview、FuseQA、`/design-md` 问卷与 Path B 逐份审阅；模型默认不切换；进入 FuseReview；FuseQA 记录为跳过；verify 通过才 archive；不 commit、不 push；需要时在 worktree 内执行且不合并回主干。

否决“只写命令文件”：`CLAUDE.md` 载有 MUST 级检查点规则，缺少显式覆盖时模型只能违反其一。Auto Mode 段落是覆盖声明，不删除交互式规则。

### D4：自动决策写入最终报告

每个决策点记录 `auto: <chosen option>`。FuseReview 记为 `auto: entered`，FuseQA 记为 `auto: declined`，模型切换记为 `continue with current model`。最终报告无论成功或失败都列出全部记录，满足既有的“双决策入报告”要求。

### D5：worktree 是可选项，且永不合并

worktree 触发条件命中时，在写任何制品之前创建并进入专用 worktree，整个流水线在其中执行；否则在当前工作区执行。无论哪种情况都不 commit，因此 FuseReview 的对象是相对 baseline 的工作区 diff（含未跟踪文件），而不是 `baseline..HEAD`。worktree 结束后保持存在、保持未合并；archive 也只作用于该 worktree。自动模式不使用实现子代理：子代理的集成分支需要 merge，与禁止合并冲突。

worktree 创建失败时，降级在当前工作区执行，并把降级原因写入最终报告。

### D6：verify 失败即停止归档

`/opsx:verify`、全量测试、lint 三者全部通过才 archive。任一失败时先尽力修复；仍失败则不 archive、保留变更目录、把每项失败的原始输出写进最终报告。

### D7：本仓库 dogfood 安装

本仓库写入 `.claude/commands/specfuse.md`，并新增测试断言该文件与 `composeSpecfuseCommand()` 输出逐字节一致。安装副本是派生文件，编辑只改模板。

## 依赖关系

```
composeSpecfuseCommand() ──────────────┐
                                       ├──> scaffold()
renderAutoMode() ──> composeCLAUDEmd() │      └──> <target>/.claude/commands/specfuse.md
                                       │      └──> <target>/CLAUDE.md
.claude/skills/* (existing) ───────────┘

tests:
  command template ──> installed command equality
  claude-md        ──> auto-mode section + unchanged interactive checkpoints
  scaffolder       ──> write / preserve
  e2e CLI          ──> command lands in a real scaffold
```

## 公共 API

```ts
// src/templates/specfuse-command.ts
export function composeSpecfuseCommand(): string;

// src/templates/claude-md.ts
export function renderAutoMode(): string;
export function composeCLAUDEmd(ctx: TemplateContext): string; // 签名不变

// src/scaffolder.ts
export async function scaffold(config: ProjectConfig): Promise<void>; // 行为扩展，签名不变
```

`ProjectConfig` 不新增字段：命令分发是无条件的，与技能一致。

## 错误处理

- **空参数**：命令打印用法并停止，不创建变更、不提问。
- **写入失败**：`scaffold()` 现有的异常语义不变，错误直接上抛，由 CLI 报告。
- **worktree 创建失败**：降级到当前工作区，记录原因后继续。
- **verify 失败**：不 archive，保留变更目录，原始输出进报告。
- **FuseReview 的 Blocking 无法修复**：记录后继续 verify；verify 通常随之失败，按上一条处理。

## 状态管理与可访问性

不适用：产物是 CLI 与 Markdown 命令定义，没有前端状态或交互界面。

## Risks / Trade-offs

- **命令文本与 `CLAUDE.md` 漂移** → 两者都由模板生成，并分别有内容断言；本仓库安装副本有逐字节一致性测试。
- **无人值守决策掩盖错误选择** → 每个决策与理由写入 design 或最终报告，可事后审计。
- **不 commit 使 FuseReview 失去提交区间** → 明确改审工作区 diff（含未跟踪文件），并在命令与 `CLAUDE.md` 中写明。
- **worktree 内 archive 不更新主干 specs** → 已确认为可接受；最终报告说明结果位于未合并的 worktree。
- **旧项目升级后没有命令文件** → 重新运行 scaffolder 即可补写；已存在的命令不被覆盖。
