## Context

`program` is built with Commander in `src/index.ts`. The description names the product and the four beats; nothing in the help points at the repository or the README. The CLI is invoked by tests through a symlinked bin shim, so the contract is observable on the built artifact.

## Goals / Non-Goals

**Goals:**

- `--help` ends with the repository URL and the README URL.
- The links appear only in help output, not in `--version`.
- The contract is guarded through the built CLI.

**Non-Goals:**

- No new flags, environment variables, or network calls.
- No README content changes.

## Decisions

### D1：使用 `addHelpText('after', …)` 输出尾部链接

Commander 的 `addHelpText('after', …)` 只在帮助输出中追加内容，不影响 `description`、参数解析或 `--version`。链接写成两行 `Repository:` / `Documentation:`，便于阅读与测试。

否决把链接塞进 `description`：它会出现在 usage 摘要里，且难以只对 `--help` 生效。否决新增 `--repo`/`--docs` 参数：用户要的是可见信息，不是多一个参数。

### D2：链接指向公共仓库

仓库使用 `https://github.com/wayhomeke/specfuse`，README 使用 `https://github.com/wayhomeke/specfuse/blob/main/README.md`。两者都是绝对 HTTPS URL，不依赖当前分支或本地路径。

### D3：在真实入口上验证

测试通过构建后的 `dist/index.js` 与 symlinked bin shim 执行 `--help`，而不是只检查源码字符串，因此打包或入口回归也会被捕获。

## 公共 API

```ts
// src/index.ts
program.addHelpText('after', string): Command; // Commander 既有 API
```

`program` 的导出、参数与 `.action()` 均不变。

## 错误处理

无新增运行时路径：只在帮助渲染时追加静态文本。

## Risks / Trade-offs

- **仓库 URL 变更导致链接失效** → 测试固定断言当前公共 URL；迁移时需同步修改测试与实现。
- **链接出现在非帮助输出** → `addHelpText('after')` 只影响帮助；测试同时断言 `--version` 不含链接。
