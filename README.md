# SpecFuse

> 把 AI 编码从即兴发挥，改造成工程流水线。

SpecFuse 不发明新工具。它把 OpenSpec（流程引擎）和 Superpowers（行为约束）编排成一条 **Think → Do → FuseReview → Verify** 四拍流水线，一条命令注入任何项目——它不产生新能力，它约束产出可靠性。

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

## 生成物

装完得到四样东西：

```
my-app/
├── CLAUDE.md                    # 流水线调度协议（四拍规则全文）
├── .gitignore                   # 共享忽略规则
├── .claude/
│   ├── settings.local.json      # 权限白名单
│   └── skills/
│       ├── design-md/           # 设计令牌生成技能
│       └── fusereview/          # 实施后代码评审技能
└── openspec/
    ├── config.yaml              # spec 规则（流程约束）
    ├── specs/                   # 主规格
    └── changes/archive/         # 变更档案
```

项目目录会自动加入 Claude Code 信任列表。

### Design Tokens（前端项目）

涉 UI/前端的项目，Think 阶段会触发 `/design-md` 技能生成 `DESIGN-TOKENS.md`，定义色彩、字体、间距、圆角等设计变量。也可手动 `/design-md` 为已有项目生成。

## 四拍流水线

在项目中启动 Claude Code，按这套节奏开发：

```
Think       /opsx:new 或 /opsx:propose     —— 方案设计与制品生成
Do          /opsx:apply                    —— TDD 实施
FuseReview  apply 收尾检查点                —— 冷读评审
Verify      /opsx:verify → /opsx:archive   —— 全量验收与归档
```

### Think

- `/opsx:propose`（Path A）一次生成全部制品；`/opsx:new` + `/opsx:continue`（Path B）一次一个制品、逐步确认。
- 苏格拉底式一次一问，2-3 个方案对比，强制声明 Non-goals、Trade-offs、Verification strategy。

### Do

- 进入实施前有模型切换检查点。
- 逐任务红绿循环，严格遵守 TDD。
- **铁律：`NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`** —— 每个任务完成前必须粘贴终端原始输出作为证据。

### FuseReview

- apply 完成后必须询问是否评审（禁止静默跳过）；呈报任务数、涉及模块等事实，由你决定是否执行。
- 评审以冷读方式审查 `基线..HEAD` 的累积 diff（评审者不参与实现）。
- Blocking 发现走 TDD 修复；修复后只复审修复 diff，不进行第二轮全量评审。
- 跳过评审必须记录在收尾报告中留痕。

### Verify

- `/opsx:verify` 逐条对照 specs 验证实现；`/opsx:archive` 前运行全量测试 + lint 零警告，粘贴原始输出。

## 已有项目：能不动就不动

`npm create specfuse@latest .` 的合并策略逐文件保守：

| 文件 | 行为 |
|------|------|
| `CLAUDE.md` | 有 `<!-- FUSION:START/END -->` 标记 → 只替换标记内段落；无标记 → 追加 |
| `.gitignore` | 追加缺失模式，不重复 |
| `.claude/settings.local.json` | 合并权限列表 |
| `openspec/config.yaml` | 已存在 → 跳过 |

删除 `CLAUDE.md` 里的 FUSION 块，项目即回到无调度状态——整套编排零侵入、可逆。

## 不问技术栈

SpecFuse 是流程，不是栈选择器。Think → Do → FuseReview → Verify 对 Rust、React 或一个裸脚本完全一致，所以初始化时不会问你用什么栈，也不生成栈特化内容：

- `CLAUDE.md` 不含 Tech Stack 段落，验证指令写作「项目的测试命令」「项目的 linter」——由项目自己的工具链定义。
- `.gitignore` 只给 IDE / OS / env / 日志这些共享模式，构建产物模式留给首次提交时判断。
- `.claude/settings.local.json` 只给 git / openspec / 检索这些共享权限。
- `openspec/config.yaml` 只给方法论不变量（Non-goals、Trade-offs、依赖图、可独立测试的 spec、TDD 任务顺序）。

栈是项目自己的文件已经声明的事实，SpecFuse 没什么可补充的。

## CLI 参考

```
Usage: create-specfuse [options] [project-name]

  project-name          目标目录（省略或 "." 表示当前目录）
  -y, --yes             非交互模式
  -V, --version         版本号
  -h, --help            帮助
```

## 开发

```bash
npm install
npm run build
npm test
```

生成设计模版预览页面（输出到 `docs/samples/`）：

```bash
npm run samples
```

16 个内置模版各生成一个自包含 HTML 页面，展示色彩系统、字体阶梯、间距、圆角和组件预览。打开 `docs/samples/index.html` 查看全部模版。

## License

MIT
