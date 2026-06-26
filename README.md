# SpecFuse

将 AI 编码从即兴发挥改造为工程流水线。

SpecFuse 不发明新工具——它把 OpenSpec、Superpowers、Grill-me 按正确的顺序编排成一条四拍流水线：**Think → Grill → Do → Verify**。一条命令注入到任何项目。

## 快速开始

```bash
npm create specfuse@latest
```

交互式引导你选择技术栈，生成项目骨架和完整的工作流配置。无需全局安装，始终拉取最新版。

```bash
# 指定目录
npm create specfuse@latest my-app

# 指定技术栈，跳过交互
npm create specfuse@latest my-app -- --stack rust --yes
```

### 前置依赖

- **Node.js >= 18**（推荐通过 [nvm](https://github.com/nvm-sh/nvm) 安装）

### 可选组件

SpecFuse 生成的工作流依赖以下组件实现完整能力，但它们不是硬依赖：

```bash
# OpenSpec CLI — 流程引擎
npm install -g @fission-ai/openspec

# Superpowers — Claude Code 行为约束插件（在 Claude Code 内执行）
/plugins add obra/superpowers
```

> 未安装时，生成的 CLAUDE.md 仍然有效，只是 `/opsx:*` 命令和 Superpowers 技能不可用。

---

## 它做了什么

运行后在目标目录生成：

```
my-app/
├── CLAUDE.md                    # 融合方法论 + 流水线纪律规则
├── .gitignore                   # 栈特化忽略规则
├── .claude/
│   └── settings.local.json      # 权限白名单
└── openspec/
    ├── config.yaml              # 栈特化 spec 规则
    ├── specs/
    └── changes/
        └── archive/
```

如果检测到已安装 `@fission-ai/openspec`，还会自动注册 OpenSpec 技能和 `/opsx:*` 命令。

---

## 四拍流水线

初始化完成后，在项目中启动 Claude Code，按以下节奏开发：

```
Think       /opsx:new 或 /opsx:propose
              ↓  激活 Brainstorming（苏格拉底式一问一答）
              ↓  生成 proposal → design → specs → tasks

Grill       /grill-me
              ↓  AI 反向质问设计，逐条 blocking/non-blocking
              ↓  修补制品后进入实施

Do          /opsx:apply
              ↓  严格 TDD：写失败测试 → 最小实现 → 粘贴证据
              ↓  每个任务完成前必须有终端输出作为证据

Verify      /opsx:verify → /opsx:archive
              ↓  全量测试 + lint 零警告 → 归档
```

### 内置纪律（自动执行，无需手动记忆）

| 阶段 | 强制行为 |
|------|----------|
| Think | 一次一问，2-3 种方案对比，Non-goals + Trade-offs |
| Grill | 多维度审查，blocking 问题必须解决才能进入实施 |
| Do | Red-Green-Refactor，禁止跳过测试 |
| Verify | 必须粘贴终端原始输出，不接受"应该能跑" |

---

## 已有项目初始化

```bash
cd existing-project
npm create specfuse@latest .
```

智能合并策略，不覆盖已有内容：

| 文件 | 行为 |
|------|------|
| `CLAUDE.md` | 有 `<!-- FUSION:START/END -->` 标记 → 替换标记内段落；无标记 → 追加 |
| `.gitignore` | 追加缺失模式，不重复 |
| `.claude/settings.local.json` | 合并权限列表 |
| `openspec/config.yaml` | 已存在 → 跳过 |

---

## 内置技术栈

| 栈 | ID | 构建 | 测试 | Lint |
|---|---|---|---|---|
| Rust | `rust` | `cargo build` | `cargo test` | `cargo clippy -- -D warnings` |
| Go | `go` | `go build ./...` | `go test ./...` | `golangci-lint run` |
| TypeScript + React | `typescript-react` | `npm run build` | `npx vitest run` | `npx eslint .` |
| Python + FastAPI | `python-fastapi` | `pip install -e .` | `pytest tests/ -v` | `ruff check .` |
| Java (Maven) | `java-maven` | `mvn package` | `mvn test` | `mvn checkstyle:check` |
| Java (Gradle) | `java-gradle` | `./gradlew build` | `./gradlew test` | `./gradlew checkstyleMain` |
| C++ (CMake) | `cpp-cmake` | `cmake --build build` | `ctest --test-dir build` | `clang-tidy` |
| Ruby | `ruby` | — | `bundle exec rspec` | `bundle exec rubocop` |
| PHP | `php` | `composer install` | `./vendor/bin/phpunit` | `./vendor/bin/phpstan` |
| Kotlin | `kotlin` | `./gradlew build` | `./gradlew test` | `./gradlew ktlintCheck` |
| Swift | `swift` | `swift build` | `swift test` | `swiftlint` |
| Elixir | `elixir` | `mix compile` | `mix test` | `mix credo` |
| Scala (sbt) | `scala-sbt` | `sbt compile` | `sbt test` | `sbt scalafmtCheck` |
| .NET | `dotnet` | `dotnet build` | `dotnet test` | `dotnet format --verify-no-changes` |
| Bash | `bash` | — | `bats tests/` | `shellcheck **/*.sh` |

### 自定义栈

创建 YAML 文件定义你的栈：

```yaml
id: java-spring
label: "Java + Spring Boot"
languages: [Java]
framework: Spring Boot
architecture: Layered (Controller → Service → Repository)
commands:
  build: ./gradlew build
  test: ./gradlew test
  lint: ./gradlew checkstyleMain
  format: ./gradlew spotlessApply
permissions:
  - "Bash(./gradlew *)"
gitignorePatterns:
  - "/build/"
  - "/.gradle/"
```

```bash
npm create specfuse@latest my-app -- --stack-from ./java-spring.yaml
```

---

## CLI 参考

```
Usage: create-specfuse [options] [project-name]

Arguments:
  project-name         目标目录（省略或 "." 表示当前目录）

Options:
  --stack <id>         指定内置技术栈
  --stack-from <path>  加载自定义栈配置（YAML/JSON）
  -y, --yes            非交互模式（CI 友好）
  -V, --version        显示版本号
  -h, --help           显示帮助
```

---

## 为什么需要编排

你手里可能已经有 OpenSpec、Superpowers、Grill-me——但谁来记住"现在该激活什么"？

- **你来记** → 你会忘。第三个小需求时你会想"太简单了不需要 brainstorm"，然后写到一半发现方向错了。
- **流水线来记** → 每个命令背后自动调度对应能力。调用"开始实施"，TDD 铁律就自动生效。

这就是融合和组合的区别：组合是你有三个好工具，融合是一条流水线让工具在正确时刻自动接力。

---

## 开发

```bash
npm install
npm run build
npm test
```

新增栈模板：在 `src/stacks/` 下创建文件并注册到 `src/stacks/index.ts`。

## License

MIT
