## 1. 命令模板（TDD）

- [x] 1.1 新建 `tests/templates/specfuse-command.test.ts`，断言 `composeSpecfuseCommand()` 含 frontmatter、`$ARGUMENTS`、连续执行顺序与全部自动决策点；运行 `npx vitest run tests/templates/specfuse-command.test.ts` 确认 RED
- [x] 1.2 实现 `src/templates/specfuse-command.ts` 的 `composeSpecfuseCommand()`；重跑该测试至 GREEN
- [x] 1.3 扩展测试覆盖空参数用法、worktree 不合并、工作区 diff 审阅对象、不 commit/不 push；运行确认 RED
- [x] 1.4 补齐模板中的边界条款；重跑该测试至 GREEN

## 2. CLAUDE.md Auto Mode（TDD）

- [x] 2.1 在 `tests/templates/claude-md.test.ts` 增加断言：`composeCLAUDEmd()` 含 `### Auto Mode: /specfuse`，且交互式检查点文本与“恰好两个 MUST 询问”不变；运行 `npx vitest run tests/templates/claude-md.test.ts` 确认 RED
- [x] 2.2 在 `src/templates/claude-md.ts` 新增 `renderAutoMode()` 并插入融合块（Path A 之前）；重跑该测试至 GREEN
- [x] 2.3 运行完整 `npx vitest run tests/templates` 确认无回归

## 3. Scaffolder 分发（TDD）

- [x] 3.1 在 `tests/scaffolder.test.ts` 增加用例：新项目写入 `.claude/commands/specfuse.md`，已有文件不被覆盖；运行 `npx vitest run tests/scaffolder.test.ts` 确认 RED
- [x] 3.2 在 `src/scaffolder.ts` 实现命令写入与产出清单打印；重跑至 GREEN
- [x] 3.3 断言 stdout 文件清单包含命令路径；重跑至 GREEN

## 4. 本仓库安装副本（TDD）

- [x] 4.1 新建 `tests/skills/installed-commands.test.ts`，断言 `.claude/commands/specfuse.md` 等于 `composeSpecfuseCommand()`；运行确认 RED（文件缺失）
- [x] 4.2 用模板输出创建 `.claude/commands/specfuse.md`；重跑至 GREEN

## 5. 文档与安装技能

- [x] 5.1 更新 `tests/skills/init-specfuse-skill.test.ts` 的 `SOURCES` 与 `tests/readme-skill-tree.test.ts`，要求指向 `src/templates/specfuse-command.ts` / `composeSpecfuseCommand` 且 README 列出命令路径；运行确认 RED
- [x] 5.2 更新 `skills/init-specfuse/SKILL.md` 的产出表与说明；运行 `npx vitest run tests/skills/init-specfuse-skill.test.ts` 至 GREEN
- [x] 5.3 更新 `README.md` 的目录树、命令面与流水线说明；运行 `npx vitest run tests/readme-skill-tree.test.ts` 至 GREEN

## 6. E2E（TDD）

- [x] 6.1 新建 `tests/e2e/specfuse-auto-mode/scaffold-command.test.ts`，通过构建后的 CLI shim 真实脚手架，断言命令落盘且 `CLAUDE.md` 含 Auto Mode；在 `tests/e2e/LEDGER.md` 登记用例来源；运行 `npm run build && npx vitest run tests/e2e/specfuse-auto-mode` 确认 RED→GREEN
- [x] 6.2 运行 `npx vitest run tests/e2e` 确认既有 E2E 无回归

## 7. 全量验证

- [x] 7.1 `npm run build` 成功
- [x] 7.2 `npx vitest run` 全绿
- [x] 7.3 `npx tsc --noEmit` 无错误
- [x] 7.4 `npx eslint .` 零警告
- [x] 7.5 `openspec validate add-specfuse-auto-mode --strict` 与 `openspec validate --specs --strict` 通过
- [x] 7.6 记录 FuseReview 决策 `auto: entered` 与 FuseQA 决策 `auto: declined`，确认不 commit、不 push
