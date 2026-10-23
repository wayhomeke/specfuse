## 1. 完整命令模板（TDD）

- [x] 1.1 在 `tests/templates/specfuse-command.test.ts` 增加 `composeSpecfuseFullCommand()` 用例：`/specfuse:full`、五阶段顺序、FuseQA `auto: entered`、双决策报告、无询问/无 commit/push；运行确认 RED
- [x] 1.2 重构 `src/templates/specfuse-command.ts` 为共享渲染器，新增 `composeSpecfuseFullCommand()`；重跑至 GREEN
- [x] 1.3 重跑默认命令测试，确认输出逐字节不变

## 2. Scaffolder 分发（TDD）

- [x] 2.1 在 `tests/scaffolder.test.ts` 增加用例：写入 `.claude/commands/specfuse/full.md`、已有文件不覆盖、清单包含该路径；运行确认 RED
- [x] 2.2 在 `src/scaffolder.ts` 实现写入与清单打印；重跑至 GREEN

## 3. 安装副本与 CLAUDE.md（TDD）

- [x] 3.1 扩展 `tests/skills/installed-commands.test.ts` 覆盖完整命令；运行确认 RED（文件缺失）
- [x] 3.2 用模板输出创建 `.claude/commands/specfuse/full.md`；重跑至 GREEN
- [x] 3.3 在 `tests/templates/claude-md.test.ts` 增加断言：Auto Mode 段提到 `/specfuse:full` 与 FuseQA `auto: entered`；运行确认 RED
- [x] 3.4 更新 `renderAutoMode()` 并重新生成本仓库 `CLAUDE.md` 的 FUSION 块；重跑至 GREEN

## 4. 文档（TDD）

- [x] 4.1 更新 `tests/readme-skill-tree.test.ts` 与 `tests/skills/init-specfuse-skill.test.ts`，要求 README 与安装技能记录完整命令；运行确认 RED
- [x] 4.2 更新 `README.md` 与 `skills/init-specfuse/SKILL.md`；重跑至 GREEN

## 5. E2E

- [x] 5.1 新建 `tests/e2e/specfuse-full/scaffold-full-command.test.ts`：通过构建后的 CLI shim 断言完整命令落盘、内容含 FuseQA 步骤与顺序、`CLAUDE.md` 提到完整变体；在 `tests/e2e/LEDGER.md` 登记用例来源
- [x] 5.2 `npm run build && npx vitest run tests/e2e/specfuse-full` 全绿

## 6. 全量验证

- [x] 6.1 `npm run build` 成功
- [x] 6.2 `npx tsc --noEmit` 无错误
- [x] 6.3 `npx eslint .` 零警告
- [x] 6.4 `npx vitest run` 全绿
- [x] 6.5 `openspec validate add-specfuse-full-command --strict` 与 `openspec validate --specs --strict` 通过
- [x] 6.6 记录 FuseReview 决策 `auto: entered`；FuseQA 不进入；确认不 commit、不 push

## 7. FuseReview 修复

- [x] 7.1 将所有“FuseQA 不自动调用”的表述限定到 `/specfuse`，并命名 `/specfuse:full`
- [x] 7.2 补齐 `fuseqa-checkpoint` 与 `specfuse-auto-mode` 的 delta，声明完整变体
- [x] 7.3 收紧 README/安装技能断言，补零字节完整命令守卫
