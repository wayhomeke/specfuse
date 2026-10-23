## Why

FuseQA 作为强制节拍，要求每个变更都在本地编写并运行端到端用例。这只适合可在本地完整部署的小项目；分布式系统的本地 QA 覆盖不到真实拓扑，QA 应嵌入 CI/CD，而不是卡在开发阶段。保留 FuseQA 的方法与手动入口，把它从默认流水线中移除。

## What Changes

- 默认流水线由五拍改为四拍：Think → Do → FuseReview → Verify。
- apply 收尾只保留 FuseReview 一个检查点；完成报告不再要求 FuseQA 决策。
- 保留 `.claude/skills/fuseqa/SKILL.md` 与模板，改为按需技能：只有用户显式调用 `/fuseqa` 才执行。
- 生成的 `CLAUDE.md` 增加 On-Demand 段落，说明 FuseQA 不属于流水线、适合本地小项目，分布式场景应在 CI/CD 中运行等价检查。
- `renderFuseQA()` 改为 `renderFuseQAOnDemand()`；CLI 帮助、FuseReview 技能、README、安装技能中的节拍枚举同步改为四拍。
- `/specfuse` 不再记录或进入 FuseQA；最终报告只记录 FuseReview 决策。
- 测试与规格同步：删除检查点断言，新增“按需、非节拍、可手动调用”断言。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `apply-exit-checkpoint`: 退出序列只剩 FuseReview 一个检查点；完成报告只要求该决策。
- `fuseqa-checkpoint`: 移除强制询问、双决策与事实呈报要求；改为“按需能力、非流水线检查点”，保留方法与用例生命周期。
- `fuseqa-skill-generation`: 技能描述与正文改为显式调用、本地/分布式边界；分发行为不变。
- `pipeline-description-consistency`: 四拍枚举；FuseQA 技能不再作为节拍描述面。
- `fusedoc-integration`: 双检查点表述改为单检查点，FuseDoc 仍不引入新门禁。
- `model-switch-checkpoint`: 导出契约移除 `renderFuseQA`，改为 `renderFuseQAOnDemand`。
- `specfuse-auto-mode`: 自动模式不再记录 FuseQA 决策；只进入 FuseReview。

## Non-goals

- 不删除 FuseQA 技能、模板或 `tests/e2e/` 用例。
- 不实现 CI/CD 集成，只在文档中给出边界与建议。
- 不改变 FuseReview、TDD、verify 门禁或 `/specfuse` 的其他规则。
- 不新增 UI，不触发 `/design-md`。

## Trade-offs

- **彻底删除 FuseQA**：否决。本地小项目仍需要这套方法，用户也要求保留手动入口。
- **保留为可选检查点**：否决。检查点仍在 apply 收尾序列里，分布式项目仍会被迫本地 QA。
- **并入 Verify 自动执行**：否决。Verify 是验收门禁，不是用例编写阶段；分布式 QA 的正确位置是 CI/CD。
- **选择方案**：移出流水线，保留技能与手动调用，文档给出适用边界。

## Verification strategy

- 单元测试：四拍枚举、CLAUDE.md 无 FuseQA 检查点、On-Demand 段落存在、FuseQA 技能声明显式调用、`/specfuse` 不再记录 FuseQA。
- E2E：通过构建后的 CLI 脚手架，断言生成物为四拍、FuseQA 技能仍安装且标注按需。
- 全量 `npx vitest run`、`npx tsc --noEmit`、`npx eslint .`、`openspec validate --specs --strict`。

## Impact

- `src/templates/claude-md.ts`、`src/templates/fuseqa-skill.ts`、`src/templates/fusereview-skill.ts`、`src/templates/specfuse-command.ts`、`src/index.ts`。
- `README.md`、`skills/init-specfuse/SKILL.md`、本仓库 `.claude/skills/fuseqa/SKILL.md` 与 `CLAUDE.md` 的 FUSION 块。
- 规格：上述七个 capability 的 delta；`fuseqa-checkpoint` 与 `pipeline-description-consistency` 主 spec 的 Purpose 直接更新。
- 测试：templates、E2E、CLI 帮助与派生文件守卫。
