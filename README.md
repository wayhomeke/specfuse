# SpecFuse

> 把 AI 编码从即兴发挥，改造成工程流水线。

SpecFuse 不发明新工具。它把 OpenSpec（流程引擎）和 Superpowers（行为约束）编排成一条 **Think → Do → FuseReview → FuseQA → Verify** 五拍流水线，一条命令注入任何项目——它不产生新能力，它约束产出可靠性。

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
├── CLAUDE.md                       # 流水线调度协议（五拍规则全文）
├── .gitignore                      # 共享忽略规则
├── .claude/
│   ├── settings.local.json         # 权限白名单
│   ├── commands/opsx/              # OpenSpec 提供：/opsx:* 命令面
│   └── skills/
│       ├── design-md/              # 设计令牌生成技能（含 16 个原型模板）
│       ├── fusedoc/                # 文档标准技能（含 3 份参考文件）
│       ├── fusereview/             # 实施后代码评审技能
│       ├── fuseqa/                 # 实施后端到端验收技能（含 4 份模板）
│       └── openspec-*/             # OpenSpec 提供：随其 init 生成
└── openspec/
    ├── config.yaml                 # spec 规则（流程约束）
    ├── specs/                      # 主规格
    └── changes/archive/            # 变更档案
```

项目目录会自动加入 Claude Code 信任列表。`commands/` 与 `openspec-*` 由 OpenSpec 自己的 `init` 产生，随其版本更新；其余由 SpecFuse 写入，已存在则不覆盖。

## 五个阶段

在项目中启动 Claude Code，按这套节奏开发：

```
Think       /opsx:new 或 /opsx:propose     —— 方案设计与制品生成
Do          /opsx:apply                    —— TDD 实施
FuseReview  apply 收尾检查点                —— 冷读评审
FuseQA      apply 收尾检查点                —— 真实入口端到端验收
Verify      /opsx:verify → /opsx:archive   —— 全量验收与归档
```

### Think

- `/opsx:propose`（Path A）一次生成全部制品；`/opsx:new` + `/opsx:continue`（Path B）一次一个制品、逐步确认。
- 苏格拉底式一次一问，2-3 个方案对比，强制声明 Non-goals、Trade-offs、Verification strategy。

### Do

- 进入实施前有模型切换检查点。
- 逐任务红绿循环，严格遵守 TDD。
- **铁律：`NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`** —— 每个任务完成前必须粘贴终端原始输出作为证据。

### FuseReview（第三拍）

- apply 完成后必须询问是否评审（禁止静默跳过）；呈报任务数、涉及模块等事实，由你决定是否执行。
- 评审者不参与实现，以冷读方式审查 `基线..HEAD` 的累积 diff，按十一项检查逐条走（测试强度、缺失检测、范围契合、真实入口、接口两侧、生命周期与并发、强制路径、配置选择、能力与消费者契合、借用状态、边界值）。
- Blocking 发现走 TDD 修复；修复后只复审修复 diff，不进行第二轮全量评审。
- 跳过评审必须记录在收尾报告中留痕。

### FuseQA（第四拍）

- apply 完成后必须询问是否验收。**与 FuseReview 是两问**：前一问答什么都不影响这一问必问，禁止合并成一问。
- 单测覆盖源码，冷读评审不运行系统，全量测试跑的还是单测——**没人以用户身份运行过制品**。这一拍补的就是这个缺口。
- 用例从 specs 的 Scenario 派生，重建为真实入口（子进程 / HTTP 请求 / 浏览器），被测物是构建产物而非 `src/`；禁止 `import ../src/`（机械可查）。
- 用例落 `tests/e2e/<capability>/`，与 `openspec/specs/<capability>/` 同名对齐，因此**回归零成本成立**——它已是全量测试的一部分。
- 发现按**归因**分级而非按红：实现缺陷 Blocking，spec 漏洞默认 Suggestion，假红记为用例债并须写明代码为何正确。
- 用例是项目资产，新增/修正/剔除都要留理由——剔除尤其，否则「删掉红用例」和「掩盖缺陷」在台账上无从区分。
- **收尾报告必须同时记录 FuseReview 与 FuseQA 两条决定**，缺一条即 apply 未完成。

### Verify

- `/opsx:verify` 逐条对照 specs 验证实现；`/opsx:archive` 前运行全量测试 + lint 零警告，粘贴原始输出。
- 全量测试**即 E2E 回归门禁**（包含 `tests/e2e/` 下所有用例），不得跳过。

## 文档标准：FuseDoc

`/fusedoc` 是贯穿全链路的文档标准，**不属于五拍中的任何一拍**：无检查点、无强制提问、不进 apply 收尾序列，由产出散文的各阶段按需调用。

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

删除 `CLAUDE.md` 里的 FUSION 块，项目即回到无调度状态——整套编排零侵入、可逆。

## 与技术栈无关

SpecFuse 是流程，不是栈选择器。五拍对 Rust、React 或一个裸脚本完全一致，所以初始化时不会问你用什么栈，也不生成栈特化内容：

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
