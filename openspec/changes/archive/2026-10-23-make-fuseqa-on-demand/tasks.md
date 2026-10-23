## 1. 流水线描述改为四拍（TDD）

- [x] 1.1 更新 `tests/templates/pipeline-description.test.ts`、`tests/cli-entrypoint.test.ts` 与 E2E 描述测试为四拍并禁止 FuseQA 出现在节拍列表；运行相关测试确认 RED
- [x] 1.2 更新 `src/index.ts` 的帮助文本、`composeFuseReviewSkill()` 与 `composeCLAUDEmd()` 的 FuseReview 开场枚举；重跑至 GREEN

## 2. apply 收尾改为单检查点（TDD）

- [x] 2.1 更新 `tests/templates/claude-md.test.ts`：删除 FuseQA 检查点与双决策断言，新增“只剩 FuseReview、拒绝后进入 Verify、完成只需该决策”；运行确认 RED
- [x] 2.2 修改 `renderApplyFuseReview()` 的退出序列文本并从装配中移除 FuseQA 检查点；重跑至 GREEN

## 3. FuseQA 降级为按需（TDD）

- [x] 3.1 用 `renderFuseQAOnDemand()` 替换 `renderFuseQA()` 相关断言：非节拍、无检查点、显式 `/fuseqa`、本地/CI-CD 边界；运行确认 RED
- [x] 3.2 实现 `renderFuseQAOnDemand()` 并装配到 Verify 之后；重写 FuseQA 技能模板的 frontmatter 与正文；重跑至 GREEN
- [x] 3.3 更新 `tests/templates/fuseqa-skill.test.ts` 与技能分发测试，断言技能仍安装且声明显式调用；重跑至 GREEN

## 4. 自动模式不再处理 FuseQA（TDD）

- [x] 4.1 更新 `tests/templates/specfuse-command.test.ts`：删除 FuseQA 决策，断言不自动调用 `/fuseqa`；运行确认 RED
- [x] 4.2 修改 `composeSpecfuseCommand()` 与 `renderAutoMode()`；重新生成 `.claude/commands/specfuse.md`；重跑至 GREEN
- [x] 4.3 重新生成本仓库 `CLAUDE.md` 的 FUSION 块并运行 `tests/skills/installed-claude-md.test.ts`

## 5. 文档修正（TDD）

- [x] 5.1 更新 `tests/readme-skill-tree.test.ts` 与 `tests/skills/init-specfuse-skill.test.ts`：四拍、按需 FuseQA、CI/CD 边界；运行确认 RED
- [x] 5.2 更新 `README.md` 与 `skills/init-specfuse/SKILL.md`；重跑至 GREEN

## 6. 规格 Purpose 与结构校验

- [x] 6.1 直接更新 `openspec/specs/fuseqa-checkpoint/spec.md` 的 Purpose 为按需能力
- [x] 6.2 `openspec validate make-fuseqa-on-demand --strict` 与 `openspec validate --specs --strict` 通过

## 7. E2E

- [x] 7.1 更新 `tests/e2e/pipeline-description-consistency`、`tests/e2e/scaffold-tool-boundary/skill-distribution`、`tests/e2e/specfuse-auto-mode`、`tests/e2e/fusedoc-skill-generation` 中的检查点/节拍断言；在 `tests/e2e/LEDGER.md` 记录用例修正理由
- [x] 7.2 `npm run build && npx vitest run tests/e2e` 全绿

## 8. 全量验证

- [x] 8.1 `npm run build` 成功
- [x] 8.2 `npx tsc --noEmit` 无错误
- [x] 8.3 `npx eslint .` 零警告
- [x] 8.4 `npx vitest run` 全绿
- [x] 8.5 `openspec validate --specs --strict` 通过
- [x] 8.6 记录 FuseReview 决策 `auto: entered`；FuseQA 不进入；确认不 commit、不 push

## 9. FuseReview 修复

- [x] 9.1 补齐 `fusedoc-integration` 与 `model-switch-checkpoint` 的 delta，移除双检查点与已删除导出
- [x] 9.2 直接修正 `pipeline-description-consistency` 的 Purpose 为四拍
- [x] 9.3 为 CLI 帮助增加 FuseQA 缺席断言，并用植入回归验证其会变红
- [x] 9.4 补全 README 迁移说明（fuseqa/fusereview 技能与 specfuse 命令），台账历史条目标记 superseded
- [x] 9.5 对齐 renderer/skill/delta 的措辞，消除强于实现的描述
