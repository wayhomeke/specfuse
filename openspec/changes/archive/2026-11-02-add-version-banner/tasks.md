## 1. 版本行（TDD）

- [x] 1.1 在 `tests/cli.test.ts` 增加 `formatVersionBanner` 断言；在 `tests/e2e/cli-version-banner/` 增加构建产物断言；运行确认 RED
- [x] 1.2 在 `src/index.ts` 实现 `formatVersionBanner` 并在动作开始时打印；重新构建并运行至 GREEN
- [x] 1.3 增加 `--version` 与 `--help` 不含 banner 的断言，确认通过

## 2. E2E 与台账

- [x] 2.1 在 `tests/e2e/LEDGER.md` 登记 `cli-version-banner` 用例
- [x] 2.2 `npm run build && npx vitest run tests/e2e/cli-version-banner` 全绿

## 3. 全量验证

- [x] 3.1 `npm run build` 成功
- [x] 3.2 `npx tsc --noEmit` 无错误
- [x] 3.3 `npx eslint .` 零警告
- [x] 3.4 `npx vitest run` 全绿
- [x] 3.5 `openspec validate add-version-banner --strict` 与 `openspec validate --specs --strict` 通过
- [x] 3.6 记录 FuseReview 决策 `auto: entered`；FuseQA 不进入；确认不 commit、不 push
