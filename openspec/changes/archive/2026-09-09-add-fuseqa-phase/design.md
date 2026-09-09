## Context

流水线现为 Think → Do → FuseReview → Verify。FuseQA 插入 FuseReview 与 Verify 之间,成为第五拍。约束来自三处既有事实:

- **模板层是纯函数。**`src/templates/*.ts` 全部是无副作用的字符串/对象组装,IO 与合并策略集中在 `scaffolder.ts`。FuseQA 必须遵循同一分层。
- **分发机制已有两个先例。**`design-md`(SKILL.md + `templates/` 目录)与 `fusereview`(纯 SKILL.md)。FuseQA 取前者形态。
- **stack-free 是刚付出代价确立的立场。**`remove-stack-selection` 删除了 15 栈子系统,理由是「栈是项目自己声明的事实」。FuseQA 不得规定测试框架。

两处已知的实现陷阱(proposal 的 Impact 已记):`scaffolder.ts` 的模板拷贝按 `.yaml` 过滤,而 FuseQA 四份模板中三份是 `.md`;`package.json` 的 `build` 脚本硬编码 `cp -r src/design-md/templates`。

## Goals / Non-Goals

**Goals**:第五拍协议进入 `CLAUDE.md` 的 FUSION 块且位置被断言;技能与四份模板随脚手架分发;检查点拉起可靠(三条补强);既有生成物不被覆盖。

**Non-Goals**:不执行回归(归 Verify);不加 git hook;不规定测试框架;不引入新 openspec 制品类型;不为未来规模做切分/并行优化。

## 依赖关系图

```
src/types.ts
  └── TemplateContext { projectName }
        │
        ├── src/templates/claude-md.ts
        │     ├── renderApplyFuseReview()      [既有,措辞增补]
        │     ├── renderFuseQA()               [新增]
        │     ├── renderVerifyPhase()          [既有,增补 E2E 回归门禁一句]
        │     └── composeCLAUDEmd(ctx)         [装配顺序:FuseReview → FuseQA → Verify]
        │
        ├── src/templates/fuseqa-skill.ts      [新增]
        │     └── composeFuseQASkill(ctx)
        │
        └── src/templates/claude-settings.ts   [既有,补 E2E 执行权限]

src/fuseqa/templates/                          [新增,四份框架中立模板]
  ├── _case-schema.yaml         用例结构契约(五字段)
  ├── derivation-checklist.md   场景派生清单
  ├── entry-recipes.md          入口构造配方
  └── ledger.md                 台账格式
        │
        └──> 由 scaffolder.ts 拷贝至 .claude/skills/fuseqa/templates/

src/scaffolder.ts
  └── scaffold(config)
        ├── copyTemplateDir(srcDir, destDir)   [新增内部辅助,替代 .yaml 硬过滤]
        ├── 写 .claude/skills/fuseqa/SKILL.md  (存在则跳过)
        └── 拷贝 fuseqa/templates → .claude/skills/fuseqa/templates/

package.json build
  └── 需同时拷贝 design-md 与 fuseqa 的 templates 至 dist/
```

依赖单向向内:模板层只依赖 `types.ts`,`scaffolder.ts` 依赖模板层,无反向依赖。

## 公共 API 表面

| 符号 | 签名 | 说明 |
|---|---|---|
| `composeFuseQASkill` | `(ctx: TemplateContext) => string` | 新增导出。返回完整 SKILL.md 文本(含 YAML frontmatter)。与 `composeFuseReviewSkill` 同签名 |
| `renderFuseQA` | `() => string` | 新增导出(供测试直接断言,与 `renderApplyFuseReview` 一致的可见性)。无参——协议文本不含项目特定内容 |
| `renderVerifyPhase` | `() => string` | 既有,签名不变,输出增补 E2E 回归门禁措辞 |
| `renderApplyFuseReview` | `() => string` | 既有,签名不变,输出增补「拒绝 FuseReview 不终止 apply 退出序列」 |
| `composeCLAUDEmd` | `(ctx: TemplateContext) => string` | 既有,签名不变,装配序列插入 `renderFuseQA()` |
| `composeClaudeSettings` | `() => object` | 既有,签名不变,`permissions.allow` 增补条目 |

`copyTemplateDir` 为 `scaffolder.ts` 内部函数,不导出——它是实现细节,不进 API 表面。

## 关键决策

**决策 1:`renderFuseQA()` 导出而非私有。** `renderApplyFuseReview()` 是既有的唯一被导出的 render 函数,原因是 `apply-exit-checkpoint` spec 直接对它断言。FuseQA 的 spec 同样逐条断言 `renderFuseQA()` 输出,故取相同可见性。备选(仅测 `composeCLAUDEmd` 全文)被否:全文断言无法定位失败在哪一节。

**决策 2:抽 `copyTemplateDir()` 而非扩展扩展名过滤。** 现状 `f.endsWith('.yaml')` 硬编码在 design-md 的拷贝循环里。备选是改成 `.yaml|.md` 双过滤,但那会让两处拷贝各自维护一份过滤规则。抽一个「拷贝目录下所有文件」的辅助函数更简单——模板目录里本就不该有非模板文件。**代价**:触碰既有 design-md 的分发路径,故 tasks 必须先为 design-md 现有行为补断言,再重构(防止回归)。

**决策 3:模板是内容契约,不是代码骨架。** `_case-schema.yaml` 规定用例必须声明的五字段(artifact / entry / isolation / observable / traces-to),不含任何框架代码——与 `design-md/templates/_schema.yaml` 同法(它规定 archetype 必须有哪些字段,不含 CSS)。这样既给出确定性结构,又不违反 stack-free。

**决策 4:三份 `.md` + 一份 `.yaml` 的混合格式。** 结构契约用 YAML 因为它是机器可校验的字段清单;派生清单、入口配方、台账格式用 Markdown 因为它们是查阅型散文。备选(全 YAML)被否:把散文塞进 YAML 字符串会损失可读性,而这三份的读者是 AI 和人,不是校验器。

**决策 5:`build` 脚本改为循环拷贝而非追加第二条 `cp`。** 硬编码逐个 `cp` 的做法每加一个模板目录就要改脚本,且漏改不会报错(只是运行时模板缺失)。改为对 `src/*/templates` 统一拷贝。**代价**:脚本稍复杂;缓解是 tasks 里有一条专门实测 `dist/fuseqa/templates/` 内容的验证步骤。

## 错误处理策略

| 失败场景 | 处理 | 依据 |
|---|---|---|
| 目标已有 `.claude/skills/fuseqa/SKILL.md` | 跳过写入,保留用户内容 | 脚手架只加不删(既有原则,`design-md`/`fusereview` 同法) |
| 模板源目录缺失(构建产物不全) | 拷贝抛错,scaffold 失败并报明缺失路径 | 静默跳过会产出无模板的技能,比失败更糟——技能引用不存在的模板 |
| 目标 `templates/` 已存在同名文件 | 覆盖 | 模板是 SpecFuse 拥有的资产,非用户内容;`design-md` 现行为即覆盖 |
| 既有项目 `CLAUDE.md` 有 FUSION 标记 | 只替换标记内段落,FuseQA 随之进入 | 既有 `mergeFusionIntoCLAUDEmd()` 逻辑,无需改动 |
| 既有项目 `CLAUDE.md` 无标记 | 追加整块 | 同上 |

`scaffold()` 目前对 OpenSpec 的失败是 `spinner.warn` 非致命;模板拷贝取相反策略(致命),因为技能与模板是本变更的核心产物,缺失即功能不完整。

## 风险 / 权衡

- **[两问相邻互相吞噬]** → 三条补强:触发独立于前一问答案、禁止合并提问、收尾报告双记录为 apply 完成条件。其中双记录是唯一不依赖 AI 记性的手段(可见的缺行)。
- **[重构 `copyTemplateDir` 波及 design-md 分发]** → tasks 强制先补 design-md 现有行为的断言,再重构;`npx vitest run` 与端到端脚手架双重验证。
- **[`build` 脚本漏拷贝不报错]** → 验证步骤实测 `ls dist/fuseqa/templates/`,而非只看构建退出码。
- **[上游 `openspec-apply-change` 对检查点无感知]** → 本变更范围外(既有「代价 1」);缓解即双记录规则。
- **[产物三问未在陌生形态上验证]** → 记入 proposal 开放风险;模板要求陌生形态把推导结论写入 `entry` 字段,使其可审计并可沉淀为新配方。
- **[认知距离为零]** → 用例判据机械化(禁 `import ../src/`、须测制品),降低对视角独立性的依赖;残余损失接受。

## 迁移计划

无数据迁移、无外部依赖新增。生成物变化对既有项目是**增量且可逆**:

1. 重跑 `npm create specfuse@latest .` → FUSION 块内新增 FuseQA 段落,新增 `.claude/skills/fuseqa/`。
2. 既有 `.claude/skills/` 下的其他技能与用户自定义内容不受影响。
3. 回滚:删除 `CLAUDE.md` 中 FuseQA 段落(或整个 FUSION 块)与 `.claude/skills/fuseqa/` 目录即完全复原——与整套编排「零侵入可逆」的既有性质一致。

版本影响:生成物行为变更,按 0.x 惯例发 minor(0.10.0)。
