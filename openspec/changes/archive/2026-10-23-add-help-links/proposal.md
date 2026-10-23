## Why

`create-specfuse --help` 目前只说明用途与参数，没有指向源码仓库或文档。用户装完包后无法从 CLI 直接找到 GitHub 仓库与 README，只能去 npm 页面或自行搜索。

## What Changes

- 在 `create-specfuse --help` 的尾部输出中加入两条绝对链接：GitHub 仓库地址与 README 文档地址。
- 链接由 Commander 的 `addHelpText('after', …)` 输出，不改变既有描述、参数或 `--version` 行为。
- 增加测试：通过构建产物与 symlinked bin shim 调用 `--help`，断言两条链接存在。

## Capabilities

### New Capabilities

- `cli-help-links`: `--help` 输出中仓库与文档链接的存在性、位置与绝对 URL 契约。

### Modified Capabilities

无。

## Non-goals

- 不新增命令行参数或配置项。
- 不修改 README 内容，只链接它。
- 不在 `--version` 或普通执行路径输出链接。
- 不发起任何网络请求。

## Trade-offs

- **把链接写进 `description` 顶部**：否决。会挤占 usage 摘要，且每次打印帮助都混在描述里。
- **新增 `--repo` / `--docs` 参数**：否决。用户需要的是帮助里可见的信息，不是再多一个参数。
- **选择方案**：在帮助尾部追加两行链接，符合 CLI 惯例，且只在 `--help` 时出现。

## Verification strategy

- 集成测试：构建后通过 symlinked bin shim 执行 `--help`，断言仓库与 README 的绝对 URL。
- 回归：`--version` 输出不变；现有四拍与参数断言保持通过。
- 全量 `npx vitest run`、`npx tsc --noEmit`、`npx eslint .`、`openspec validate --specs --strict`。

## Impact

- `src/index.ts`（仅帮助文本）。
- `tests/cli-entrypoint.test.ts`、`tests/e2e/pipeline-description-consistency/description.test.ts`、`tests/e2e/LEDGER.md`。
- 无依赖、无运行时行为变更。
