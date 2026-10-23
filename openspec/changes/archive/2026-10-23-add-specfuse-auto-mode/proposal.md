## Why

SpecFuse 的流水线在多个节点强制停下来问人：brainstorming 逐问、模型切换、FuseReview/FuseQA 检查点、Path B 逐份审阅。需求已经明确时，这些交互只增加往返。`/specfuse <需求描述>` 把「默认采用推荐答案 + 连续执行」固化成一条命令，同时保留 TDD、评审与验收门禁。

## What Changes

- 新增斜杠命令 `/specfuse <需求描述>`：一次调用内完成 brainstorm、全部制品生成、apply、FuseReview、verify、archive。
- 自动决策：brainstorm 不提问，模型自行给出 2–3 个方案并选推荐项，把选择与理由写进 design；`/design-md` 问卷、模型切换、两个 apply 退出检查点、Path B 逐份审阅均由模型按推荐值自答并留痕。
- 模型切换默认「继续使用当前模型」。
- apply 退出序列：进入 FuseReview；FuseQA 记录为自动跳过，不进入。
- verify 通过后 archive；verify 失败则不 archive，保留变更目录，把失败写进最终报告。
- 阻塞处理：尽力推进；FuseReview 的 Blocking 仍按 TDD 修复，并只复审修复 diff。
- 既有触发条件命中时可在 git worktree 内执行全流程；全程不合并回主干。
- 全程不 commit、不 push。
- scaffolder 写入 `.claude/commands/specfuse.md`，已存在则不覆盖；生成的 `CLAUDE.md` 增加 Auto Mode 一节声明上述覆盖；README 与 `skills/init-specfuse/SKILL.md` 的产出清单同步更新。

## Capabilities

### New Capabilities

- `specfuse-auto-mode`: `/specfuse` 的命令面、无人值守决策策略、执行顺序、worktree 隔离、失败处理，以及「不提交、不推送」约束。

### Modified Capabilities

- `apply-exit-checkpoint`: 自动模式不询问 FuseReview 检查点，直接进入评审；FuseQA 决策记录为自动跳过。
- `model-switch-checkpoint`: 自动模式不询问模型切换，默认继续使用当前模型。
- `fuseqa-checkpoint`: 自动模式不进入 FuseQA，两个决策记录齐全后继续 verify。

## Non-goals

- 不改变默认 `/opsx:*` 的交互行为，交互式流水线保持原样。
- 不削弱 TDD、`verification-before-completion`、FuseReview 或 FuseDoc 标准。
- 不自动 commit、push，也不合并 worktree 分支。
- verify 失败时不 archive。
- 不新增 UI，不触发 `/design-md`。

## Trade-offs

- **复用 `/opsx:propose` + `/opsx:apply` 驱动流程**：否决。两条命令内建人类确认（Path A 需确认方案后才生成制品，apply 强制模型切换询问），自动模式会被它们反向阻断。改为在命令内直接驱动同一套 OpenSpec 阶段。
- **只写命令文件、不改 `CLAUDE.md`**：否决。`CLAUDE.md` 载有 MUST 级检查点规则，命令与项目指令会冲突；缺少显式覆盖时，模型只能二选一。
- **用全局配置或环境变量切换模式**：否决。需求是按次调用；全局开关会污染交互式流程。

## Verification strategy

- 单元测试：命令模板包含完整顺序、自动决策清单与「不 commit / 不 push」；scaffolder 写入命令且不覆盖已有文件；`CLAUDE.md` 含 Auto Mode 覆盖，原有两个检查点文本不变。
- 本仓库安装的 `.claude/commands/specfuse.md` 与模板输出逐字节一致，沿用 installed-skills 的派生文件契约。
- E2E：通过构建后的 CLI 真实脚手架一个项目，断言命令落盘且 `CLAUDE.md` 带 Auto Mode。
- 全量 `npx vitest run`、`npx tsc --noEmit`、`npx eslint .` 通过。

## Impact

- 新增 `src/templates/specfuse-command.ts` 与 `src/templates/claude-md.ts` 中的 `renderAutoMode()`。
- 修改 `src/scaffolder.ts`（写命令、更新产出清单）、`src/templates/claude-md.ts`、`skills/init-specfuse/SKILL.md`、`README.md`。
- 新增本仓库 `.claude/commands/specfuse.md` 与 `tests/e2e/specfuse-auto-mode/`。
- 无新增依赖，无破坏性变更。
