## Why

SpecFuse 流水线对 diff 本身没有语义评审：Grill 审制品（代码尚不存在），Verify 做机械对照（"实现符合 spec" ≠ "实现是对的"），两者都抓不住"绿但是错"——永真式断言、复述实现的测试、spec 之外的无主代码、应有而缺失的错误路径。同时 `CLAUDE.md` 中 subagent 两阶段评审的"代码质量"阶段是悬空引用，无定义可执行。

对 dsh-code-review 及其引用权威文档（`defensive-patterns.md` 七条缺陷分类学、`testing.md` 测试哲学、根 `AGENTS.md` 约定）的评估表明：其中约六成内容是纯便携的工程知识，可融合为 SpecFuse 生成的评审技能。本变更新增流水线第五拍 **FuseReview**：apply 完成后的人工检查点 + 独立上下文冷读评审。

## What Changes

- 新增 `src/templates/fusereview-skill.ts`：`composeFuseReviewSkill(ctx)` 生成自包含评审技能（11 项检查 + 内联实质），消费 `StackProfile.errorHandling`/`concurrency` 生成栈特化检查。
- `src/templates/claude-md.ts`：新增 `renderApplyFuseReview()` 检查点协议并接入 `composeCLAUDEmd()`——apply 完成后 MUST 提问（呈事实不裁决）、跳过留痕、blocking 走 TDD、修复只复审修复 diff、基线记录、subagent 合并闸指向技能。
- `src/scaffolder.ts`：分发 `.claude/skills/fusereview/SKILL.md`（已存在则跳过）。
- 同步测试：新增 `tests/templates/fusereview-skill.test.ts`，扩展 `tests/templates/claude-md.test.ts`、`tests/scaffolder.test.ts`。

## Capabilities

### New Capabilities

- `fusereview-skill-generation`：自包含评审技能的生成与分发——11 项检查（测试强度、缺失检测、范围吻合、真实入口、接口两侧、生命周期与并发、强制路径、配置选择、能力消费者匹配、借用状态边界、边界值）、内联实质（七条缺陷分类学、"引入回归看红回滚"配方、验证边界判据）、输出纪律（缺陷/位置/影响/证据、阻塞建议分离、不重复机械门禁）。
- `apply-exit-checkpoint`：生成版 `CLAUDE.md` 的检查点协议——MUST 提问、呈事实不裁决、跳过留痕、发现处理与终止条件、基线记录、subagent 合并闸衔接。

### Modified Capabilities

<!-- None：openspec/specs/ 中无覆盖 apply 阶段的既有能力。 -->

## Impact

- `src/templates/fusereview-skill.ts` — 新文件。
- `src/templates/claude-md.ts` — 新增渲染函数并接入组装。
- `src/scaffolder.ts` — 新增技能分发步骤。
- `tests/templates/fusereview-skill.test.ts`（新）、`tests/templates/claude-md.test.ts`、`tests/scaffolder.test.ts` — 断言。
- 无新增依赖；不新增 CLI 选项；不改 Think/Grill/Verify 三拍。

## Non-goals

- 不做 hook 运行时强制（路线图议题，声明式纪律不变）。
- 不改 `/opsx:verify`、`/opsx:archive` 语义；archive 证据铁律（NO ARCHIVE WITHOUT VERIFY EVIDENCE）另起变更。
- 不引入 GitHub 概念（PR、stack、gh CLI）——评审对象是本地 `基线..HEAD`。
- 不做多平台技能格式（v0.3 议题）。
- 不回溯改名存量技能（`grill-me`、`design-md` 保持无品牌）。
- 不做自动规模分级——删除"≥6 任务/破坏性"自动判定，是否评审由检查点的人工裁决决定。

## Trade-offs

- **人工检查点（chosen）vs apply 内自动闸门（含规模分级）**：自动闸门让 AI 用粗糙启发式（任务数、破坏性）做价值判断，且给小变更增加固定开销；检查点把裁决还给掌握全量上下文的用户。跳过的风险用三条保真条件对冲：提问本身 MUST（关闭静默跳过）、AI 只呈事实、跳过写入收尾报告留痕。与项目三处先例同构：模型切换节拍（MUST 提问）、Grill blocking 覆盖（明确确认可覆盖）、Path B 节奏控制。
- **检查点放 apply 之后（chosen）vs 嵌入 Verify**：Verify 的语义是机械对照 + 证据铁律，混入判断性评审会稀释其纯度；且评审引出的修复必须发生在 Verify 之前，否则 Verify 证据失效。
- **C 全集 + 实质内联（chosen）vs 最小 4 项集**：用户决策首版全量上线、基于真实使用数据缩减；内联实质（而非路由引用）因目标项目无 dsh 式文档垫层，沿用 `845b8b0` grill 自包含化先例。
- **命名 `fusereview`（chosen）vs `code-review`/`apply-review`/`Vet`**：品牌出身可见、零撞名（`code-review` 与 Claude Code 生态内置技能冲突）；接受与两个无品牌兄弟技能的命名差异，不回溯改名。

## Verification strategy

- `npx vitest run` — 全量测试，含新增断言（11 项检查标记、缺陷分类学标记、检查点措辞、跳过留痕、基线记录、合并闸引用）。
- `npx tsc --noEmit` — 类型检查。
- `npm run build` — 构建。
- 渲染演练 — 重新渲染 specfuse 自身的 `CLAUDE.md` apply/checkpoint 段落，并用一个假想大变更（8 任务 + subagent）走查检查点流程文本。
- 数据流完整性 — 每个 spec 输入（ctx.stack、基线、发现清单）在声明签名中有承载位。
