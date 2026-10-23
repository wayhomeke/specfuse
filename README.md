# SpecFuse

> 把 AI 编码从即兴发挥，改造成工程流水线。

SpecFuse 不发明新工具。它把 OpenSpec（流程引擎）和 Superpowers（行为约束）编排成一条 **Think → Do → FuseReview → Verify** 四拍流水线，一条命令注入任何项目——它不产生新能力，它约束产出可靠性。端到端 QA 默认是按需技能；`/specfuse:full` 会把它作为完整流水线的一步自动执行。

## 快速开始

```bash
npm create specfuse@latest                                  # 交互式引导（需 Node >= 18，推荐 nvm）
npm create specfuse@latest my-app -- --yes                  # 非交互，CI 友好
cd existing-project && npm create specfuse@latest .         # 已有项目就地初始化
```

两个可选组件。不装也能用——生成的 `CLAUDE.md` 依然生效，只是缺一半能力：

```bash
npm install -g @fission-ai/openspec    # 流程引擎；装好后自动注册 /opsx:* 命令
/plugins add obra/superpowers          # 行为约束插件（在 Claude Code 内执行）
```

装完即可在项目里启动 `claude`，用 `/opsx:propose` 开始第一个变更。

## 生成物

```
my-app/
├── CLAUDE.md                       # 流水线调度协议（四拍规则全文）
├── .gitignore                      # 共享忽略规则
├── .claude/
│   ├── settings.local.json         # 权限白名单
│   ├── commands/
│   │   ├── opsx/                   # OpenSpec 提供：/opsx:* 命令面
│   │   ├── specfuse.md             # SpecFuse 提供：全自动四拍入口
│   │   └── specfuse/
│   │       └── full.md             # SpecFuse 提供：全自动完整入口（含 FuseQA）
│   └── skills/
│       ├── design-md/              # 设计令牌生成技能（含 16 个原型模板）
│       ├── fusedoc/                # 文档标准技能（含 3 份参考文件）
│       ├── fusereview/             # 实施后代码评审技能
│       ├── fuseqa/                 # 端到端验收技能（默认按需；/specfuse:full 自动执行）
│       └── openspec-*/             # OpenSpec 提供：随其 init 生成
└── openspec/
    ├── config.yaml                 # spec 规则（流程约束）
    ├── specs/                      # 主规格
    └── changes/archive/            # 变更档案
```

项目目录会自动加入 Claude Code 信任列表。`commands/opsx/` 与 `openspec-*` 由 OpenSpec 自己的 `init` 产生，随其版本更新；`commands/specfuse.md`、`commands/specfuse/full.md` 与四个技能由 SpecFuse 写入，已存在则不覆盖；`CLAUDE.md` 按 FUSION 标记合并（见下文）。

## 四个阶段

在项目中启动 Claude Code，按这套节奏开发：

```
Think       /opsx:new 或 /opsx:propose     —— 方案设计与制品生成
Do          /opsx:apply                    —— TDD 实施
FuseReview  apply 收尾检查点                —— 冷读评审
Verify      /opsx:verify → /opsx:archive   —— 全量验收与归档
```

默认四拍不含 FuseQA：需要时显式调用 `/fuseqa`，或用 `/specfuse:full` 自动执行。

### 无人值守：`/specfuse` 与 `/specfuse:full`

需求已经明确、不想逐拍确认时，用一条命令跑完整条流水线：

| 命令 | 流程 | FuseQA |
|---|---|---|
| `/specfuse <需求描述>` | Think → Do → FuseReview → Verify → archive | 不进入；需要时单独调用 `/fuseqa` |
| `/specfuse:full <需求描述>` | Think → Do → FuseReview → **FuseQA** → Verify → archive | 自动进入，记录 `auto: entered` |

两者都由模型按推荐答案自答并记录在最终报告中：模型切换默认不切换，FuseReview 自动进入，verify 全部通过后 archive，全程不 commit、不 push。verify 仍失败时不 archive，保留变更目录并把失败写进报告。`/specfuse:full` 把 FuseQA 放在 FuseReview 之后、Verify 之前，让它新写的用例进入随后的全量测试。默认的 `/opsx:*` 交互行为不受影响。

### Think

- `/opsx:propose`（Path A）一次生成全部制品；`/opsx:new` + `/opsx:continue`（Path B）一次一个制品、逐步确认。
- 苏格拉底式一次一问，2-3 个方案对比，强制声明 Non-goals、Trade-offs、Verification strategy。

### Do

- 进入实施前有模型切换检查点。
- 逐任务红绿循环，严格遵守 TDD。
- **铁律：`NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`** —— 每个任务完成前必须粘贴终端原始输出作为证据。

### FuseReview

- apply 完成后必须询问是否评审（禁止静默跳过）；呈报任务数、涉及模块等事实，由你决定是否执行。
- 评审者不参与实现，以冷读方式审查 `基线..HEAD` 的累积 diff，按十一项检查逐条走（测试强度、缺失检测、范围契合、真实入口、接口两侧、生命周期与并发、强制路径、配置选择、能力与消费者契合、借用状态、边界值）。
- Blocking 发现走 TDD 修复；修复后只复审修复 diff，不进行第二轮全量评审。
- 跳过评审必须记录在收尾报告中留痕。

### FuseQA（默认按需；`/specfuse:full` 自动执行）

- 默认只有显式调用 `/fuseqa` 才执行；`/specfuse:full` 会在 FuseReview 之后、Verify 之前自动执行。没有检查点，不进入 apply 收尾，也不影响 verify。
- 适合能在本地完整部署和验证的小项目：CLI、小型服务、库、本地 Web 应用。
- 分布式系统在本地复现不了真实拓扑、网络分区与共享状态竞争，应在 CI/CD 中运行等价检查，而不是在开发阶段做本地 QA。
- 方法仍完整保留：从 specs 的 Scenario 派生用例、真实入口、构建产物而非 `src/`、归因分级、用例台账。
- 用例落 `tests/e2e/<capability>/`，随全量测试在 verify 阶段回归。

### Verify

- `/opsx:verify` 逐条对照 specs 验证实现；`/opsx:archive` 前运行全量测试 + lint 零警告，粘贴原始输出。
- 全量测试**即 E2E 回归门禁**（包含 `tests/e2e/` 下所有用例），不得跳过。

## 文档标准：FuseDoc

`/fusedoc` 是贯穿全链路的文档标准，**不属于四拍中的任何一拍**：无检查点、无强制提问、不进 apply 收尾序列，由产出散文的各阶段按需调用。

它管三件事——一段话必须说什么、读起来是从仓库出发还是从写作会话出发、一个事实该放在哪一层。派上用场的典型场合：写 README 和注释、审计一份文档、判断某个事实该落在决策记录还是使用指南。

```bash
/fusedoc <scope>     # scope 必填；不填则报缺输入并停止，不推断全仓库范围
```

## 设计令牌（前端项目）

涉 UI/前端的项目，Think 阶段会触发 `/design-md` 生成 `DESIGN-TOKENS.md`，定义色彩、字体、间距、圆角等设计变量。内置 16 个原型模板（SaaS 面板、营销页、后台管理、移动端……），按项目形态匹配。也可手动 `/design-md` 为已有项目生成。

## 已有项目：能不动就不动

`npm create specfuse@latest .` 的合并策略逐文件保守：

| 文件 | 行为 |
|------|------|
| `CLAUDE.md` | 有 `<!-- FUSION:START/END -->` 标记 → 只替换标记内段落；无标记 → 追加 |
| `.gitignore` | 追加缺失模式（带 `# Added by specfuse` 分节），不重复 |
| `.claude/settings.local.json` | 合并 `permissions.allow`，其余键原样透传 |
| `openspec/config.yaml` | 已存在 → 跳过 |
| `.claude/skills/*` | 已存在 → 不覆盖 |
| `.claude/commands/specfuse.md` | 已存在 → 不覆盖 |
| `.claude/commands/specfuse/full.md` | 已存在 → 不覆盖 |

技能与命令已存在时不会被覆盖。已有项目升级到四拍时，先删除 `.claude/skills/fuseqa/SKILL.md`、`.claude/skills/fusereview/SKILL.md` 和 `.claude/commands/specfuse.md`，再运行 scaffolder：`CLAUDE.md` 的 FUSION 块会被替换，这三个文件会按新模板重写；`specfuse/full.md` 不存在时会自动补写。其它用户自定义技能不受影响。

删除 `CLAUDE.md` 里的 FUSION 块，项目即回到无调度状态——整套编排零侵入、可逆。

## 与技术栈无关

SpecFuse 是流程，不是栈选择器。四拍对 Rust、React 或一个裸脚本完全一致，所以初始化时不会问你用什么栈，也不生成栈特化内容：

- `CLAUDE.md` 不含 Tech Stack 段落，验证指令写作「项目的测试命令」「项目的 linter」——由项目自己的工具链定义。
- `.gitignore` 只给 IDE / OS / env / 日志这些共享模式，构建产物模式留给首次提交时判断。
- `.claude/settings.local.json` 只给 git / openspec / 检索这些共享权限。
- `openspec/config.yaml` 只给方法论不变量（Non-goals、Trade-offs、依赖图、可独立测试的 spec、TDD 任务顺序）。

栈是项目自己的文件已经声明的事实，SpecFuse 没什么可补充的。

## CLI 参考

```
Usage: create-specfuse [options] [project-name]

Arguments:
  project-name  目标目录（省略或 "." 表示当前目录就地初始化）

Options:
  -y, --yes     非交互模式（全取默认值，CI 友好）
  -V, --version 版本号
  -h, --help    帮助
```

交互模式只问两个问题：是否初始化 git（仅新目录）、是否初始化 OpenSpec。项目名由参数给出，不提问。

**失败行为**：OpenSpec 装不上或初始化失败时，脚手架仍以退出码 0 结束，并打印一条指向手动命令的提示——报告失败不等于让脚手架失败。Superpowers 插件缺失时打印安装提示，不中断。

## 开发

```bash
npm install
npm run build      # tsc + 拷贝模板资产到 dist/
npm test           # vitest run，含 tests/e2e/ 下的端到端用例
npm run lint       # eslint，零告警
npx tsc --noEmit   # 类型检查
```

生成设计模板预览页面（输出到 `docs/samples/`）：

```bash
npm run samples
```

16 个内置模板各生成一个自包含 HTML 页面，展示色彩系统、字体阶梯、间距、圆角和组件预览。打开 `docs/samples/index.html` 查看全部模板。

方法论的权威定义在 `openspec/specs/`——每个 capability 一份 spec，描述可观察的行为契约。分发到目标项目的技能模板在 `src/templates/`，静态资产在 `src/<skill>/templates/`。

## License

MIT
