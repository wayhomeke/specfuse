## Context

`src/index.ts` builds a Commander program and runs the scaffold action. Commander owns `--version` and `--help`; the action only runs when a project name (or `.`) is supplied. The package version is already read from `package.json` into `pkg.version`.

## Goals / Non-Goals

**Goals:**

- One stable `SpecFuse v<version>` line per scaffolding run.
- Same behavior in interactive and `--yes` modes.
- No change to `--version` or `--help`.

**Non-Goals:**

- No log file, telemetry, or environment override.
- No change to generated project files.

## Decisions

### D1：在动作开始时打印，而不是在模块加载时

打印放在 `.action()` 内、`collectProjectConfig()` 之前。模块加载时打印会让 `--help`、`--version` 以及测试导入都产生副作用；动作内打印只影响真正的脚手架运行。

### D2：纯函数生成文本

导出 `formatVersionBanner(version: string): string`，返回 `SpecFuse v${version}`。动作调用它，单元测试直接断言格式，E2E 断言构建产物中的实际输出。

否决在 spinner 文本里夹带版本：spinner 在非 TTY 或快速完成时可能不可见，且会被后续文本覆盖。

### D3：`--version` 与 `--help` 不打印 banner

Commander 在动作之前处理这两个选项，因此 banner 自然不会出现；测试固定这一行为，防止把打印移到模块顶层。

## 公共 API

```ts
// src/index.ts
export function formatVersionBanner(version: string): string;
```

`program` 的导出与参数不变。

## 错误处理

无新增运行时路径；版本字符串来自已解析的 `package.json`。

## Risks / Trade-offs

- **解析 stdout 的脚本看到新行** → 这是新增的一行诊断信息；测试与文档明确其位置。若有脚本依赖首行，需要调整，但当前仓库没有这样的消费者。
- **版本与 package.json 不一致** → 直接使用 `pkg.version`，不硬编码。
