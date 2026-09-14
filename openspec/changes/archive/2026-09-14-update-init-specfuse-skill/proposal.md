## Why

`skills/init-specfuse/SKILL.md` 是 SpecFuse 的**非 Claude agent 交付渠道**：面向那些拿不到 npm 包（`skills/` 被 `files` 与 `.npmignore` 双重排除）、也不走 CLI 的 agent。消费方式是 clone 内部仓库后，由大模型读取本文件自行生成项目——**能拿到整个仓库**这一点，正是本次修复得以成立的前提。

该文件现在有三处问题：

1. **副本漂移。** 316 行里约 195 行是 `src/templates/*.ts` 的手抄副本（FUSION 块 92 行、`.gitignore` 34、settings 37、openspec config 32）。没有任何机制连接两者，所以它自 `6c559a5`（初始发布）以来**从未更新**：缺 Step 0 模型切换检查点、缺 Phase 2.5 FuseReview、缺 Phase 2.6 FuseQA——五拍缺三拍。
2. **栈层残留。** 全文 14 行 / 16 处含 `stack`（不分大小写），含 Step 2 的技术栈五选一（Rust / Go / TS+React / Python+FastAPI / Custom）、3a–3d 的 "stack-specific" 分支、末尾 `## Stack Profiles Quick Reference`。该概念已由 `remove-stack-selection` 从产品整体删除。**注意口径**：其中 6 行只含大写 `Stack`，大小写敏感的检查会放它们过去——包括最该删的那一节。
3. **假门禁的非 Claude 版本。** Step 4 中 `openspec` 尝试失败时只打印一行手工安装提示，Step 5 **仍然**输出 `/opsx:propose  Start your first change`。上一变更 `openspec-init-failure-visibility` 治了 CLI 的那一半，非 Claude 这一半原样留着。

## What Changes

`skills/init-specfuse/SKILL.md` 由**副本式**重写为**指针式**：

- **方法论来源改为引用**：读 `composeCLAUDEmd()`（`src/templates/claude-md.ts`）作为权威文本，并注明它是 Claude Code 方言、需翻译而非照抄；约 195 行内联副本删除。**副本消失，漂移根因随之消失。**
- **三项运行时检查取代硬编码平台清单**：本平台是否 OpenSpec 支持（`openspec init --help` 自述工具 id）；是否 Superpowers 支持（装没装本平台自知）；指令文件名换成该 agent 的（`AGENTS.md` / `.cursor/rules` / `copilot-instructions.md` / `GEMINI.md` …）。
- **降级只在必要时发生**：不支持 Superpowers 才把那几项纪律展开为散文；不支持 OpenSpec 才把工作流内联。`subagent`（17 处）与 `git worktree`（8 处）**不单独降级**——它们由 Superpowers 提供，平台适配由 Superpowers 自己负责。
- **两问照搬 CLI 语义**：git 仅在**新建目录**时问（已存在目录不问不建）；OpenSpec 总是问。用户**拒绝** → `/opsx:*` 原样不注解；**尝试失败** → 加注解 + 尾部通知，与 CLI 一致。
- **补齐合并语义**：读 `src/scaffolder.ts` 的 `mergeFusionIntoCLAUDEmd` / `mergeGitignore` / `mergeClaudeSettings`，对已有项目按同样保守规则处理。当前技能完全没写这段，导致 brownfield 行为与 CLI 不一致。
- **删除整个栈层**：Step 2 的栈问题改为 CLI 的两问；3a–3d 的 stack-specific 内容去掉；`## Stack Profiles Quick Reference` 删除。

新增 `tests/skills/init-specfuse-skill.test.ts` 守护上述契约。

## Non-goals

- **不删该技能。** 它是面向非 Claude agent 的活渠道，不是死副本（我最初误判如此，此处记录以免误读）。
- **不新建 `templates/` 目录、不写生成器、不改 `package.json`。** 曾考虑预渲染产物入库，被否：那会造出第三份副本，用机械保障去治"本不该有副本"的病。
- **不硬编码 OpenSpec / Superpowers 的平台清单。** 两者都能运行时自述；硬编码会随上游增删而漂移，正是本次在治的病。
- **不改 `src/**` 任何生产代码。** 本技能是模板层的消费者，不是它的修改者。
- **不给 `docs/samples/` 补同类守护。** `npm run samples` 的入库产物同样无守护（同一种风险），但属独立关注点，本次只记录。
- **不改 npm 包与 GitHub 镜像的分发范围。** `skills/` 继续两头都排除——与"只发给 clone 内部仓库的 agent"这一消费方式一致。
- **不移植 Superpowers 正文。** 它不在本仓库；技能只说明"不支持时直接执行该纪律"并举其要求（脑暴先行 / 先写失败测试 / 完成前须有新鲜证据）。

## Trade-offs

**备选 1 — 只手改 `SKILL.md`：补三拍、去栈层，不建守护。** 否决：这正是过去四个月的做法，下一次模板变更会再漂移一次。

**备选 2 — 预渲染产物入库（`skills/.../templates/` + 生成器 + 守护）。** 否决：消费方已能 clone 整个仓库，权威来源就在库里；预渲染等于给副本再加一层保险，而非消除副本。附带代价是新增目录、生成脚本与 `package.json` 改动。

**备选 3 — 读 `src/templates/*.ts` 并照抄，不做翻译。** 否决：生成文本是 Claude Code 方言（`/opsx:*` 15 处、`.claude/skills` 4 处、`CLAUDE.md`、`AskUserQuestion`），照抄会把 Claude 的方言强加给别的 agent。必须"读方法论、落成本平台形状"。

**备选 4 — 只改文件名，不做能力降级。** 否决（经裁决）：形态之外还需能力降级——平台没有对应能力时，方法论文字要改写成该平台可执行的等价约束。

## Capabilities

### New Capabilities

- `init-specfuse-skill` — 非 Claude agent 交付渠道的技能契约：方法论来源为指针而非副本、平台形状翻译与能力降级规则、两问与门禁报告语义、已有项目的合并语义、以及"无内联副本"的不变量。

### Modified Capabilities

无。本技能此前无规格覆盖，非对既有 requirement 的修订。

## Impact

**Modified:** `skills/init-specfuse/SKILL.md`（重写，316 行 → 预计显著缩短）。

**New:** `tests/skills/init-specfuse-skill.test.ts`。

**不改:** `src/**`、`package.json`、`scripts/**`、`docs/samples/`、npm 包与 GitHub 镜像的分发范围。

**用户可见:** 非 Claude agent 经此技能初始化出的项目将首次包含完整五拍、不再带栈概念，且 OpenSpec 不可用时报错方式与 CLI 一致（注解 + 通知，而非承诺不存在的命令）。

## Verification strategy

- **TDD 红→绿**：先写守护测试，断言 `SKILL.md` 中 `stack` 计数为 0、不含内联 `### Phase 2: Apply / Implement`、且含运行时自述检查字样。当前三项皆红；重写后转绿。
- **指针有效性**：断言技能点名的每个 `src/...` 路径与符号真实存在，防改名 / 搬家后指针静默失效。
- **反例验证**：临时把 `src/templates/claude-md.ts` 的 `composeCLAUDEmd` 改名 → 守护必须转红 → 还原转绿。无法被弄红的断言不守任何东西。
- `npx vitest run` 全量绿（**须带 `HOME` 覆盖**，否则全量套件会向真实 `~/.claude.json` 写入约 35 条 trust 记录，见 `tests/e2e/LEDGER.md` 的 Correction 条目）；`npx tsc --noEmit` 干净；`npx eslint .` 零警告。三者原始输出作为完成证据。
