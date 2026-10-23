## 1. 帮助链接（TDD）

- [x] 1.1 在 `tests/cli-entrypoint.test.ts` 增加用例：通过 symlinked bin shim 执行 `--help`，断言仓库与 README 绝对 URL；构建后运行确认 RED
- [x] 1.2 在 `src/index.ts` 用 `addHelpText('after', …)` 添加两行链接；重新构建并运行至 GREEN
- [x] 1.3 增加 `--version` 不含链接的断言，确认通过

## 2. E2E 与台账

- [x] 2.1 在 `tests/e2e/pipeline-description-consistency/description.test.ts` 增加帮助链接断言；在 `tests/e2e/LEDGER.md` 登记新增覆盖
- [x] 2.2 `npm run build && npx vitest run tests/e2e/pipeline-description-consistency` 全绿

## 3. 全量验证

- [x] 3.1 `npm run build` 成功
- [x] 3.2 `npx tsc --noEmit` 无错误
- [x] 3.3 `npx eslint .` 零警告
- [x] 3.4 `npx vitest run` 全绿
- [x] 3.5 `openspec validate add-help-links --strict` 与 `openspec validate --specs --strict` 通过
- [x] 3.6 记录 FuseReview 决策 `auto: entered`；FuseQA 不进入；确认不 commit、不 push

## 4. FuseReview 修复

- [x] 4.1 断言链接位于帮助页脚（`-h, --help` 之后），并改为精确整行匹配
- [x] 4.2 将 E2E 用例迁移到 `tests/e2e/cli-help-links/`，与 capability 目录对齐并更新台账
