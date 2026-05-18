# SpecFuse

OpenSpec + Superpowers 融合方法论的项目脚手架工具。

将 AI 氛围编码改造为工业级流水线：**OpenSpec 定方向，Superpowers 定纪律**。

## 安装

```bash
# 方式 1：npx 直接运行（零安装）（TODO：需先发布到 npm）
# npx create-specfuse

# 方式 2：从 git 仓库全局安装
npm install -g git+ssh://git@gitlab.fatehome.net:30021/fatehome/specfuse.git

# 方式 3：npm link 本地开发
git clone ssh://git@gitlab.fatehome.net:30021/fatehome/specfuse.git
cd specfuse && npm install && npm run build && npm link
```

## 更新

```bash
# git 仓库全局安装方式：先卸载再重新安装
npm uninstall -g create-specfuse
npm install -g git+ssh://git@gitlab.fatehome.net:30021/fatehome/specfuse.git

# npm link 方式：拉取最新代码并重新构建，无需重新 link
cd specfuse && git pull && npm run build
```

## 使用

### 新建项目（绿地模式）

```bash
# 交互式（逐步问答）
create-specfuse my-app

# 指定技术栈
create-specfuse my-app --stack rust

# 自定义栈
create-specfuse my-app --stack-from ./my-java-stack.yaml

# 非交互模式（CI 友好）
create-specfuse my-app --stack go --yes

# npm 简写（TODO：需先发布到 npm）
# npm create specfuse my-app
```

### 已有项目（初始化模式）

```bash
cd existing-project
create-specfuse --stack rust
```

省略项目名即在**当前目录**初始化，已有文件会智能合并而非覆盖：

| 文件 | 已存在时的行为 |
|---|---|
| `CLAUDE.md` | 有 `<!-- FUSION:START/END -->` 标记 → 只替换标记内的方法论段落；无标记 → 追加到末尾 |
| `.gitignore` | 只追加缺失的模式，不重复已有条目 |
| `.claude/settings.local.json` | 合并权限列表，保留用户已有的自定义权限 |
| `openspec/config.yaml` | 已存在 → 跳过不碰；不存在 → 新建 |
| `openspec/changes/*` | 完全不碰 |

### Claude Code 技能（交互式）

```bash
# 安装（一次性）
npx skills add https://gitlab.fatehome.net/fatehome/specfuse --skill init-specfuse

# 在任何项目中使用
/init-specfuse
```

## 生成文件

```
my-app/
├── CLAUDE.md                    # 融合方法论桥接声明
├── .gitignore                   # 栈特化忽略规则
├── .claude/
│   └── settings.local.json      # 权限白名单
└── openspec/
    ├── config.yaml              # 栈特化 spec 规则
    ├── specs/
    └── changes/
        └── archive/
```

如果系统安装了 `@fission-ai/openspec`，还会自动安装 OpenSpec 技能和 `/opsx:*` 命令。

## 内置技术栈

| 栈 | ID | 构建 | 测试 | Lint |
|---|---|---|---|---|
| Rust | `rust` | `cargo build` | `cargo test` | `cargo clippy -- -D warnings` |
| Go | `go` | `go build ./...` | `go test ./...` | `golangci-lint run` |
| TypeScript + React | `typescript-react` | `npm run build` | `npx vitest run` | `npx eslint .` |
| Python + FastAPI | `python-fastapi` | `pip install -e .` | `python -m pytest tests/ -v` | `ruff check .` |

## 自定义栈

创建一个 YAML 文件，结构如下：

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
errorHandling: Java exceptions + @ControllerAdvice
concurrency: Virtual threads (Java 21+)
permissions:
  - "Bash(./gradlew *)"
  - "Bash(java *)"
gitignorePatterns:
  - "/build/"
  - "/.gradle/"
  - "*.class"
openspecContext: |
  Tech stack: Java 21+ / Spring Boot 3
  Build: Gradle
  Testing: JUnit 5 + Mockito
openspecRules:
  tasks:
    - Tasks must follow TDD order
    - Every task must include a verification command
```

然后：

```bash
create-specfuse my-app --stack-from ./java-spring.yaml
```

## 融合方法论工作流

初始化完成后，在项目中启动 Claude Code，按以下流程开发：

```
/opsx:explore     # 还没想清楚时，先探索
    ↓
/opsx:propose     # 快速模式：一步生成全部 artifact
/opsx:new         # 精细模式：逐步推进，一次一个 artifact
    ↓
/opsx:apply       # TDD 实施（强制 Red-Green-Refactor）
    ↓
/opsx:verify      # 验证实现与 specs 一致
    ↓
/opsx:archive     # 归档，完工
```

### 内置纪律（CLAUDE.md 自动执行）

| 阶段 | 强制行为 |
|---|---|
| 方案 | 苏格拉底式一次一问，2-3 种方案对比，Non-goals + Trade-offs |
| 执行 | 严格 TDD，先写失败测试再实现 |
| 完成 | 必须在终端跑测试并粘贴原始输出，否则禁止标记完成 |
| 归档 | 全量测试 + linter 零警告 |

## 两种分发方式对比

| 维度 | npm (`create-specfuse`) | 技能 (`/init-specfuse`) |
|---|---|---|
| 运行环境 | 任意终端 | Claude Code 内 |
| 输出一致性 | 代码硬编码，每次一致 | AI 解读指令执行 |
| 自定义栈 | `--stack-from file.yaml` | 对话中描述，AI 现场组装 |
| CI 友好 | `--yes` 非交互模式 | 不支持 |
| 已有项目 | 智能合并，不覆盖 | 同上 |

## 开发

```bash
git clone ssh://git@gitlab.fatehome.net:30021/fatehome/specfuse.git
cd specfuse
npm install
npm run build
npm test
```

新增栈模板：在 `src/stacks/` 下创建文件并注册到 `src/stacks/index.ts`。

## License

MIT
