## Why

Grill（实施前拷问）的完整协议——一问一答、`.grill-backup/` 备份、9 问软上限、双向一致性扫描——对多数变更（尤其小变更）过重，性价比不足。经裁决：彻底移除该拍，流水线简化为 **Think → Do → FuseReview → Verify**。实施前的质量把关改由既有机制承接：Path A 的方案确认、Path B 的逐制品审阅、apply 入口的模型切换节拍、apply 出口的 FuseReview 检查点。

## What Changes

- **删除** `src/templates/grill-me-skill.ts` 及其测试 `tests/templates/grill-me-skill.test.ts`。
- **移除** `src/scaffolder.ts` 的 grill-me 分发块（约 8 处引用）与 `tests/scaffolder.test.ts` 的 2 个 grill-me 用例。
- **删除** `src/templates/claude-md.ts` 的 `renderGrillReview()` 整个段落及 `composeCLAUDEmd()` 中的接线；改写 `renderDesignTokensRules()` 中"会破坏 Grill 一致性扫描"的论证措辞（前向引用问题仍成立，不再引用 Grill 作为执行机制）；同步删除 `tests/templates/claude-md.test.ts` 的 renderGrillReview 块与段落顺序断言中的 Grill 项。
- **级联措辞**：`src/templates/fusereview-skill.ts` 与 `renderApplyFuseReview()` 中"第五拍 / Grill reviews design"改为四拍序列；`src/index.ts` CLI 描述的拍序更新；`src/templates/gitignore.ts` 移除 `.grill-backup/` 模式（仅影响新生成项目）。
- **主 specs 移除**：5 个 grill 系能力经 delta REMOVED 移除。
- **自举清理**：删除本仓库 `.claude/skills/grill-me/`，重渲染本仓库 `CLAUDE.md`。
- **存量重装行为**（无专门迁移代码，由既有合并机制决定）：技能文件**保留**（脚手架无删除逻辑）；`CLAUDE.md` 的 Grill 段落**随 FUSION 块替换消失**；`.gitignore` 已有 `.grill-backup/` 行保留。终态：存量项目的 `/grill-me` 退化为纯手动技能。

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

<!-- None：无既有能力的要求被修改。 -->

### Removed Capabilities

- `grill-me-skill-generation`：grill-me 技能的生成与分发契约，整体移除。
- `grill-review-section`：CLAUDE.md Grill 协议段落的渲染契约，整体移除。
- `grill-review-protocol`：协议与技能同步契约（维度表、软上限、一致性扫描），整体移除。
- `grill-review-dimensions`：按工件分组的审查面契约，整体移除。
- `grill-review-resilience`：技能独立于宿主文档的兜底契约，整体移除。

## Impact

- `src/templates/grill-me-skill.ts`（删除）、`src/templates/claude-md.ts`、`src/templates/fusereview-skill.ts`、`src/templates/gitignore.ts`、`src/scaffolder.ts`、`src/index.ts`。
- 测试：`tests/templates/grill-me-skill.test.ts`（删除）、`tests/templates/claude-md.test.ts`、`tests/templates/fusereview-skill.test.ts`、`tests/templates/templates.test.ts`（如含 `.grill-backup/` 断言）、`tests/scaffolder.test.ts`。
- `openspec/specs/`：5 个目录移除（经同步）。
- 本仓库：`.claude/skills/grill-me/`、`CLAUDE.md`、`README.md` 流水线章节。
- 无新增依赖；不改 Think/Do/FuseReview/Verify 各拍的内部机制。

## Non-goals

- 不追溯清理存量目标项目的 `.claude/skills/grill-me/` 或 `.gitignore` 已有行（脚手架只加不删）。
- 不改写历史文档（`docs/design-philosophy.md`、`docs/blog-*` 为历史记录）。
- 不动归档变更（冻结历史，含 `2026-08-05-improve-grillme-review`）。
- 不改变 FuseReview 的机制与触发方式（仅级联措辞更新）。

## Trade-offs

- **彻底移除（chosen）vs 降级为人工检查点**：检查点方案保留能力、爆炸半径小，且与 FuseReview 检查点同构——但用户裁决动机是"流程太重"且接受"永久失去实施前审查"的代价；保留一个极少使用的检查点只会把复杂度从协议挪进决策负担。
- **彻底移除（chosen）vs 瘦身但保持强制**：3-5 问快速过堂仍保留"必须停下来被审"的强制感，不解决"太重"的体感来源。
- **停止分发但保留模板源码（rejected）vs 删除源码**：保留无人分发的模板是死代码；彻底删除与"移除"语义一致，历史可从 git 找回。

## Verification strategy

- 删除断言：`composeCLAUDEmd()` 输出不含 "Grill"/"grill-me"；scaffolder 不再写 `.claude/skills/grill-me/`；`composeGitignore()` 输出不含 `.grill-backup/`。
- 级联断言：fusereview 技能与检查点文本呈四拍序列且不含 "Grill"。
- `npx vitest run` 全量、`npx tsc --noEmit`、`npm run build`。
- 重渲染本仓库 `CLAUDE.md` 并走查；`openspec validate --specs` 对移除后的主 specs 通过。
