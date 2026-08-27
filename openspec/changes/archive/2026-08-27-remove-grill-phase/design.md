## Context

Grill 是流水线的实施前拷问拍：制品完成后强制提示 `/grill-me`，执行备份、一问一答、9 问软上限、双向一致性扫描。经裁决该拍过重，彻底移除。移除后流水线为 **Think → Do → FuseReview → Verify**，实施前的把关由 Path A 方案确认、Path B 逐制品审阅、模型切换节拍、FuseReview 检查点承接。

当前 Grill 的存在形态（即移除对象）：

```
生成侧（本仓库）                          目标项目侧（存量重装行为）
├── src/templates/grill-me-skill.ts      ├── .claude/skills/grill-me/SKILL.md   ← 保留（无删除逻辑）
│        ↓ composeGrillMeSkill()         ├── CLAUDE.md FUSION 块内 Grill 段落   ← 随块替换消失
├── src/templates/claude-md.ts           ├── .gitignore 的 .grill-backup/ 行    ← 保留（追加式合并）
│        ↓ renderGrillReview()           └── /grill-me 命令                     ← 退化为纯手动技能
├── src/scaffolder.ts（分发块）
├── src/templates/gitignore.ts（.grill-backup/）
├── src/index.ts（CLI 描述拍序）
└── openspec/specs/grill-*（5 个能力）
```

## Goals / Non-Goals

**Goals:**
- 生成物中彻底移除 Grill：模板、分发、协议段落、主 specs。
- 级联措辞收敛到四拍序列，不留悬空引用（"第五拍"、"Grill 一致性扫描"等）。
- 存量重装行为由既有合并机制自然决定，零迁移代码。
- 移除以 TDD 驱动：先写删除断言（RED），再删代码（GREEN）。

**Non-Goals:**
- 不清理存量目标项目的技能文件与 `.gitignore` 行。
- 不改写历史文档与归档变更。
- 不改 FuseReview/Think/Do/Verify 的机制。

## Decisions

### 1. 删除单位与顺序

按"测试先行"反转的 TDD 执行：先写断言渲染产物**不含** Grill 痕迹的失败测试，再执行删除。删除单位：

| 单位 | 动作 |
|---|---|
| `src/templates/grill-me-skill.ts` | 整文件删除 |
| `tests/templates/grill-me-skill.test.ts` | 整文件删除 |
| `src/scaffolder.ts` grill-me 分发块 | 移除（含 import） |
| `src/templates/claude-md.ts` `renderGrillReview()` | 函数与接线删除 |
| `src/templates/gitignore.ts` `.grill-backup/` | 移除（含共享模式与测试断言） |
| `src/index.ts` CLI 描述 | 拍序更新为四拍 |
| 本仓库 `.claude/skills/grill-me/` | 删除 |
| `README.md` 流水线章节 | 更新为四拍 |

### 2. 级联措辞策略

- **四拍序列单点化**：`fusereview-skill.ts` 技能首段与 `renderApplyFuseReview()` 的"第五拍/Grill reviews design"改为"Think 审方向，Do 出代码，FuseReview 审实现，Verify 验全局"（FuseReview 为第四拍）；`fusereview-skill.ts` frontmatter description 的 "fifth pipeline beat" 同步改为 "fourth"。
- **design-md 触发论证改写**：`renderDesignTokensRules()` 中"deferring generation ... breaks the Grill consistency scan"改为不依赖 Grill 的表述——保留核心论证（design.md/tasks.md 前向引用 DESIGN-TOKENS.md，令牌文件必须先于制品存在），只移除对一致性扫描这一执行机制的引用。三道门逻辑本身不变。

### 3. 公共 API 面

纯删减，无新增导出：

- 移除导出：`composeGrillMeSkill()`（grill-me-skill.ts）、`renderGrillReview()`（claude-md.ts）。
- 保留不变：`composeCLAUDEmd(ctx)`、`renderApplyFuseReview()`、`composeFuseReviewSkill(ctx)`、`composeGitignore(stack)`、`scaffold(config)`——签名均不变，仅输出内容变化。

### 4. 主 specs 移除

5 个能力各以一份 delta spec 表达，`## REMOVED Requirements` 逐条列出被移除的 Requirement；同步阶段从 `openspec/specs/` 删除对应目录。

### 5. 存量重装行为

不写任何迁移代码。依据既有合并机制推导并在 proposal 中声明：技能文件保留、FUSION 块替换导致协议段落消失、`.gitignore` 追加式合并保留旧行。终态为"手动技能"，属体面的自然退化。

### 6. 错误处理策略

无新增运行时路径。脚手架删除分发块后，既有写入路径（其余文件）的失败语义不变；技能目录不再创建即不再有可能失败的创建。

## Risks / Trade-offs

- **失去实施前审查**（已接受）：制品矛盾、不可测 spec 到 apply 才暴露；缓解为逐制品审阅 + FuseReview 兜底。
- **存量项目分化**：装过旧版的项目保留 grill-me 技能文件而新项目没有——接受，符合"脚手架只加不删"哲学。
- **措辞残留风险**：Grill 字符串可能藏在未清点处；以全局 `grep -ri grill src/ tests/` 归零断言兜底（`README`/`docs`/归档除外）。
- **本仓库自身依赖**：本仓库 `.claude/skills/grill-me/` 删除后，历史对话中引用 `/grill-me` 的纪律不再可用——与移除语义一致。
