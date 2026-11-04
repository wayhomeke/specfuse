# 在 DeepSeek Harness（dsh）中使用 SpecFuse

本文说明 dsh 如何发现 SpecFuse 写入的技能、如何启动流水线，以及如何配置模型端点来运行真实 e2e。Claude Code 的入口见 [README](../README.md)。

## 前置条件

- Node.js 24.9 或更新版本。dsh 要求该版本；SpecFuse 脚手架本身仍支持 Node 18+。
- 可用的 dsh 包：`npx @deepseek-ai/dsh`（首次运行会缓存到 npm 目录）。
- 一个已由 SpecFuse 初始化的项目。

## 启动 dsh

```bash
npx @deepseek-ai/dsh headless "列出当前项目可用的技能"
npx @deepseek-ai/dsh web
```

`headless` 执行一个任务并退出；`web` 启动浏览器界面。所有命令都在项目根目录运行。dsh 以最近的 `.git` 祖先作为项目根，以此解析 `.agents/skills/`。

## SpecFuse 为 dsh 写入什么

| 路径 | 内容 |
|---|---|
| `CLAUDE.md` | 流水线协议。dsh 的指令链同时读取 `AGENTS.md` 与 `CLAUDE.md`。 |
| `.agents/skills/design-md/` | 设计令牌生成技能与原型模板。 |
| `.agents/skills/fusedoc/` | 文档标准技能与参考文件。 |
| `.agents/skills/fusereview/` | 实施后代码评审技能。 |
| `.agents/skills/fuseqa/` | 端到端验收技能。 |
| `.agents/skills/specfuse/` | 入口技能，用户输入 `/specfuse` 触发。 |
| `.agents/skills/specfuse-full/` | 完整入口技能，用户输入 `/specfuse-full` 触发。 |
| `.agents/skills/openspec-*/` | OpenSpec 的 `agents` 适配器写入，随 `openspec init` 生成。 |

`specfuse` 与 `specfuse-full` 的前置元数据声明 `user-invocable: true` 和 `disable-model-invocation: true`。dsh 只在用户显式输入 `/name` 时加载它们，模型目录不会列出这两个名字，因此模型不能自行启动整条流水线。

## 命令映射

| Claude Code | dsh |
|---|---|
| `/specfuse <需求>` | `/specfuse <需求>` |
| `/specfuse:full <需求>` | `/specfuse-full <需求>` |
| `/opsx:propose` | `/openspec-propose` |
| `/opsx:new` | `/openspec-new-change` |
| `/opsx:continue` | `/openspec-continue-change` |
| `/opsx:apply` | `/openspec-apply-change` |
| `/opsx:verify` | `/openspec-verify-change` |
| `/opsx:archive` | `/openspec-archive-change` |
| `/design-md` | `/design-md` |
| `/fusedoc` | `/fusedoc` |
| `/fusereview` | `/fusereview` |
| `/fuseqa` | `/fuseqa` |

`/specfuse` 后的文本就是需求描述。没有文本时，入口技能输出 `SPECFUSE_USAGE: /specfuse <requirement description>`（完整入口为 `SPECFUSE_FULL_USAGE: ...`）并停止，不创建变更。

## 配置模型端点

dsh 的 DeepSeek 适配器读取 `DEEPSEEK_BASE_URL` 作为端点、`DEEPSEEK_API_KEY` 作为凭据。Anthropic 兼容网关的环境文件通常使用另外两个变量名，在启动 dsh 前做一次映射即可，不需要把密钥写入任何文件：

```bash
set -a
source ~/sb-openai.env          # 提供 ANTHROPIC_BASE_URL 与 ANTHROPIC_AUTH_TOKEN
set +a
export DEEPSEEK_BASE_URL="$ANTHROPIC_BASE_URL"
export DEEPSEEK_API_KEY="$ANTHROPIC_AUTH_TOKEN"
```

模型目录与默认模型通过 `cordis.patch.yml` 覆盖。下面的文件声明一个模型并把它设为新会话默认值；端点与凭据仍来自环境：

```yaml
- id: llm-deepseek
  config:
    models:
      - id: gemini-3.8-flash-high
- id: agent-default-model
  config:
    provider: deepseek-official
    model: gemini-3.8-flash-high
```

运行：

```bash
npx @deepseek-ai/dsh headless --patch ./cordis.patch.yml "列出当前项目可用的技能"
```

`DSH_HOME` 指定 dsh 的配置与会话目录，默认是 `~/.dsh`。隔离运行或测试时指向项目内目录：

```bash
DSH_HOME="$PWD/tmp/dsh-home" npx @deepseek-ai/dsh headless --patch ./cordis.patch.yml "..."
```

## 真实 e2e

`tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts` 用构建产物脚手架一个临时项目，再通过真实 dsh 进程验证：四个共享技能出现在模型目录中，两个入口技能不出现，`/specfuse` 在缺少需求时输出 `SPECFUSE_USAGE:`。

该用例默认跳过。满足 Node 24.9+、端点可用（已导出 `DEEPSEEK_BASE_URL`/`DEEPSEEK_API_KEY`，或 `~/sb-openai.env` 提供 `ANTHROPIC_*`）、`SPECFUSE_DSH_E2E=1` 三个条件时执行：

```bash
set -a; source ~/sb-openai.env; set +a
SPECFUSE_DSH_E2E=1 \
DEEPSEEK_BASE_URL="$ANTHROPIC_BASE_URL" \
DEEPSEEK_API_KEY="$ANTHROPIC_AUTH_TOKEN" \
npx vitest run tests/e2e/dsh-harness-compatibility/dsh-real-model.test.ts
```

用例优先使用已导出的 `DEEPSEEK_BASE_URL`/`DEEPSEEK_API_KEY`；两者都不存在时才读取 `~/sb-openai.env` 的 `ANTHROPIC_BASE_URL`/`ANTHROPIC_AUTH_TOKEN` 并映射。脚手架子进程使用独立的 `HOME`，因此不会改写你的 `~/.claude.json`；临时项目、`DSH_HOME` 与 `DSH_AGENTS_HOME` 都放在仓库的 `tmp/` 下，结束时删除。跳过时打印原因，不把缺失前提计为失败。

## 故障排查

- **技能没有出现在 dsh 的目录里**：确认命令在项目根目录（最近的 `.git` 祖先）运行，且 `.agents/skills/<name>/SKILL.md` 存在。dsh 只扫描一层目录。
- **输入 `/specfuse` 没有反应**：`/name` 必须是一个由空白包围的完整 token。名称是 `specfuse` 与 `specfuse-full`，不是 `specfuse:full`。
- **模型请求失败**：检查 `DEEPSEEK_BASE_URL` 与 `DEEPSEEK_API_KEY` 是否在启动 dsh 的进程中导出，并确认 `cordis.patch.yml` 的 `models` 列表包含所选模型。
- **需要重新生成 dsh 技能**：删除 `.agents/skills/{design-md,fusedoc,fusereview,fuseqa,specfuse,specfuse-full}`，再运行 `npm create specfuse@latest .`。已存在的文件不会被覆盖。
