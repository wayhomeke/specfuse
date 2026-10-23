## Why

`/specfuse` 明确不进入 FuseQA：它服务多数项目，本地 QA 在分布式场景没有意义。但能在本地完整部署的小项目需要一次跑完五阶段，而不必在 `/specfuse` 之后手动追加 `/fuseqa`。把 FuseQA 塞进 `/specfuse` 参数会与“默认不进入 FuseQA”的契约冲突，因此新增一条独立命令。

## What Changes

- 新增命名空间命令 `/specfuse:full <需求描述>`，安装为 `.claude/commands/specfuse/full.md`。
- 执行顺序：brainstorm → proposal/specs/design/tasks → apply → FuseReview → **FuseQA** → verify → archive。
- FuseQA 放在 FuseReview 之后、Verify 之前，作为显式步骤而非检查点；最终报告同时记录 `auto: entered` 的 FuseReview 与 FuseQA 决策。
- 自动决策策略、TDD、verify 失败不 archive、不 commit/push 与 `/specfuse` 一致。
- `/specfuse` 保持四拍不变；FuseQA 仍只能通过显式 `/fuseqa` 单独调用。
- 生成的 `CLAUDE.md` 在 Auto Mode 段说明 `/specfuse:full` 是进入 FuseQA 的完整变体。
- scaffolder 写入新命令、保留已有文件并在产出清单中列出；README、安装技能与测试同步。

## Capabilities

### New Capabilities

- `specfuse-full`: `/specfuse:full` 的命令面、完整执行顺序、FuseQA 自动进入与双决策报告、分发与文档契约。

### Modified Capabilities

- `fuseqa-checkpoint`: 把“自动调用”的禁止限定到 `/specfuse`，并声明 `/specfuse:full` 是进入 FuseQA 的完整变体。
- `specfuse-auto-mode`: 把 FuseQA 按需表述限定到 `/specfuse`，并在 Auto Mode 段命名完整变体。

## Non-goals

- 不改变 `/specfuse` 的四拍行为。
- 不把 FuseQA 重新变成检查点，不新增询问。
- 不实现 CI/CD，也不 commit/push。
- 不新增 UI，不触发 `/design-md`。

## Trade-offs

- **在 `/specfuse` 参数中解析 FuseQA 开关**：否决。自由文本参数会产生歧义，并与“默认不进入”硬冲突。
- **要求用户手动串联 `/specfuse` + `/fuseqa`**：否决。不是无人值守，顺序也容易错。
- **新增独立命令 `/specfuse:full`**：选中。语义单一，默认命令的契约完全不动。

## Verification strategy

- 单元测试：完整命令模板的 frontmatter、五阶段顺序、FuseQA 决策、无询问、无 commit/push；默认命令输出保持不变。
- scaffolder：写入 `.claude/commands/specfuse/full.md`、不覆盖已有文件、清单包含该路径。
- 派生文件：本仓库安装副本与模板输出逐字节一致；`CLAUDE.md` 的 Auto Mode 段提到完整变体。
- E2E：构建后的 CLI 真实脚手架一个项目，断言完整命令落盘且内容含 FuseQA 步骤。
- 全量 `npx vitest run`、`npx tsc --noEmit`、`npx eslint .`、`openspec validate --specs --strict`。

## Impact

- 新增 `composeSpecfuseFullCommand()`，复用默认命令的共享文本。
- 修改 `src/scaffolder.ts`、`src/templates/claude-md.ts`、`README.md`、`skills/init-specfuse/SKILL.md`。
- 新增本仓库 `.claude/commands/specfuse/full.md`、`openspec/specs/specfuse-full/`、`tests/e2e/specfuse-full/`。
- 无新增依赖，无破坏性变更。
