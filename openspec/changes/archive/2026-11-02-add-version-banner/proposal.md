## Why

npx 只在缓存未命中时打印带版本号的安装确认；缓存命中后，脚手架输出里没有任何版本信息。用户无法从一次运行判断当前用的是哪个版本。

## What Changes

- 脚手架动作开始时打印一行 `SpecFuse v<版本>`，版本取自 `package.json`。
- 该行在交互提示之前、非交互模式下同样输出；每次运行只打印一次。
- `--version` 仍只输出版本号；`--help` 不打印该行。
- 新增一个纯函数 `formatVersionBanner(version)`，供动作与测试共用。

## Capabilities

### New Capabilities

- `cli-version-banner`: 脚手架运行时版本行的内容、位置与“不影响 `--version` / `--help`”契约。

### Modified Capabilities

无。

## Non-goals

- 不改变 `--version` 的输出格式。
- 不在 `--help` 中加入版本行。
- 不引入遥测、日志文件或环境变量。
- 不改变脚手架生成的任何文件。

## Trade-offs

- **把版本写进 spinner 文本**：否决。spinner 在非 TTY 下可能不显示，且会被覆盖。
- **只在 `--help` 里显示版本**：否决。用户运行的是脚手架，不是帮助。
- **在动作开始时打印一行**：选中。稳定、可见、与交互无关。

## Verification strategy

- 单元测试：`formatVersionBanner("1.2.3")` 返回 `SpecFuse v1.2.3`。
- E2E：构建后的 CLI 在隔离目录执行 `--yes`，stdout 含与 `package.json` 一致的版本行；`--version` 仍只输出版本号。
- 全量 `npx vitest run`、`npx tsc --noEmit`、`npx eslint .`、`openspec validate --specs --strict`。

## Impact

- `src/index.ts`（动作开始时打印一行）。
- 新增 `tests/e2e/cli-version-banner/` 与台账条目；`tests/cli.test.ts` 增加纯函数断言。
- 无依赖、无文件生成变化。
