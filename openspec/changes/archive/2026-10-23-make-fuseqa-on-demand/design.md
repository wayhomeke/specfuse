## Context

当前流水线是五拍：Think → Do → FuseReview → FuseQA → Verify。FuseQA 是 apply 退出序列的第二个强制检查点，完成报告必须同时记录 FuseReview 与 FuseQA 两个决策。它的方法绑定在 `.claude/skills/fuseqa/SKILL.md`，由 scaffolder 分发。

约束：已有项目采用保守合并策略，技能文件已存在则不覆盖；`CLAUDE.md` 的 FUSION 块会随重新运行 scaffolder 更新。FuseQA 的方法本身仍有价值，本次只改变它在流程中的位置。

## Goals / Non-Goals

**Goals:**

- 默认流水线与退出序列只保留 FuseReview 一个检查点。
- FuseQA 技能与模板继续分发，只在显式调用时执行。
- 生成文档明确 FuseQA 的适用边界：本地小项目可用，分布式场景应放进 CI/CD。
- 所有派生文件（模板输出、安装副本、README、E2E 断言）保持一致。

**Non-Goals:**

- 不删除 FuseQA 技能、模板或既有 E2E 用例。
- 不在本变更中实现 CI/CD 流水线。
- 不改变 FuseReview 的评审方法或 verify 门禁。

## Decisions

### D1：流水线固定为四拍

所有描述面统一为 Think → Do → FuseReview → Verify。节拍枚举不再包含 FuseQA；位置序数继续禁止。

否决“可选检查点”：只要 FuseQA 仍在退出序列里，分布式项目就会被要求做无意义的本地 QA。否决“彻底删除”：用户明确要求保留手动入口。

### D2：单检查点退出序列

`composeCLAUDEmd()` 不再装配 FuseQA 检查点。apply 完成报告只记录 FuseReview 决策（进入或记录跳过）。`renderApplyFuseReview()` 的“declining does not end the exit sequence”改为“记录跳过并进入 Verify”。

### D3：`renderFuseQA()` 改为 `renderFuseQAOnDemand()`

新段落标题为 `### On-Demand: FuseQA (E2E Verification)`，明确：不是节拍、没有检查点、不参与 apply 完成条件、仅显式 `/fuseqa` 调用；本地小项目适用，分布式场景应在 CI/CD 运行等价检查。函数改名以阻止旧语义被继续引用。

### D4：技能保留，语义改为按需

`composeFuseQASkill()` 的 frontmatter 描述改为显式请求触发，不再声称“in-flow”或“post-apply beat”。正文保留决策树、用例契约、入口配方、归因分级与台账，新增适用边界段落。技能继续由 scaffolder 安装到 `.claude/skills/fuseqa/`。

### D5：自动模式只记录 FuseReview

`/specfuse` 的命令模板删除 FuseQA 决策行，最终报告只记录 `auto: entered` 的 FuseReview 决策。`specfuse-auto-mode` 规格同步；自动模式不调用 `/fuseqa`。

### D6：既有项目的迁移边界

重新运行 scaffolder 会替换 `CLAUDE.md` 的 FUSION 块，从而移除 FuseQA 检查点；但已存在的技能与命令文件不会被覆盖，旧技能的“检查点”措辞与旧命令的 `auto: declined` 记录会保留。迁移方式是删除 `.claude/skills/fuseqa/SKILL.md`、`.claude/skills/fusereview/SKILL.md` 和 `.claude/commands/specfuse.md`，再运行 scaffolder。该限制写入 README 与最终报告。

## 依赖关系

```
composeCLAUDEmd() ── renderFuseQAOnDemand() ──> CLAUDE.md
composeFuseReviewSkill() ─────────────────────> .claude/skills/fusereview/SKILL.md
composeFuseQASkill() ────────────────────────> .claude/skills/fuseqa/SKILL.md (on demand)
composeSpecfuseCommand() ────────────────────> .claude/commands/specfuse.md
src/index.ts description ────────────────────> CLI --help
```

## 公共 API

```ts
// src/templates/claude-md.ts
export function renderFuseQAOnDemand(): string; // replaces renderFuseQA()
export function composeCLAUDEmd(ctx: TemplateContext): string; // signature unchanged

// src/templates/fuseqa-skill.ts
export function composeFuseQASkill(ctx: TemplateContext): string; // signature unchanged

// src/templates/specfuse-command.ts
export function composeSpecfuseCommand(): string; // signature unchanged
```

`scaffold()` 与 `ProjectConfig` 不变。

## 错误处理

本变更没有新增运行时路径：模板是纯字符串组装，scaffolder 的写入与异常语义不变。规格与文档的一致性由测试和 `openspec validate --strict` 保证。

## Risks / Trade-offs

- **既有项目保留旧技能措辞** → 在 README 写明需手动替换技能文件；不破坏用户自定义内容。
- **FuseQA 能力被误删** → 明确 Non-goals，保留技能、模板与 E2E 用例；新增测试断言技能仍被安装且声明按需。
- **节拍枚举漏改** → `pipeline-description-consistency` 同时守卫 CLI、CLAUDE.md 与 FuseReview 技能，并新增 E2E 断言。
- **双决策断言残留** → 全量测试会暴露；逐项改为单检查点断言。
