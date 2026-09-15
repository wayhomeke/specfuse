## Context

FuseReview 是流水线第五拍：apply 完成后，由人工检查点决定是否派发独立上下文冷读累积 diff，执行自包含评审技能。本设计覆盖两个生成物——评审技能（`fusereview-skill.ts`）与检查点协议（`claude-md.ts` 新段落）——以及脚手架分发。

核心决策（来自探索记录，全部经用户裁决）：

1. 挂载方式为 **apply 后人工检查点**，非 apply 内自动闸门；AI 不做规模/破坏性判断。
2. 技能内容取自通用评审技能及其实质文档的融合：11 项检查 + 内联实质，自包含（目标项目无路由可指向的文档垫层）。
3. 评审对象 = `基线..HEAD`，基线在 apply 启动时记录，本地良定义、零漂移。
4. blocking 发现走 TDD 修复；只复审修复 diff，不触发第二轮全量评审（终止条件）。

## Component hierarchy

```
create-specfuse CLI
└── src/scaffolder.ts                    scaffold(config)
    ├── src/templates/fusereview-skill.ts    composeFuseReviewSkill(ctx)   [新]
    │       输出 → <target>/.claude/skills/fusereview/SKILL.md
    └── src/templates/claude-md.ts           composeCLAUDEmd(ctx)
            ├── renderTechStack / renderPathA / ...        [既有]
            └── renderApplyFuseReview()                    [新]
                    输出 → <target>/CLAUDE.md 的 "Phase 2.5: FuseReview" 段落

测试镜像
├── tests/templates/fusereview-skill.test.ts   [新]
├── tests/templates/claude-md.test.ts          [扩展]
└── tests/scaffolder.test.ts                   [扩展]
```

## Public API surface

```ts
// src/templates/fusereview-skill.ts
export function composeFuseReviewSkill(ctx: TemplateContext): string;
// 返回完整 SKILL.md 文本；消费 ctx.stack 渲染栈特化检查。

// src/templates/claude-md.ts
export function renderApplyFuseReview(): string;
// 返回检查点协议段落文本；由 composeCLAUDEmd() 在 Phase 2 与 Phase 3 之间组装。

// src/scaffolder.ts（内部）
// 新增分发步骤：写 .claude/skills/fusereview/SKILL.md，已存在则跳过。
```

## Skill content architecture

生成的 `SKILL.md` 结构（约 150-200 行）：

1. **frontmatter**：`name: fusereview`，description 覆盖口语触发词（code review / 评审改动）。
2. **评审对象与准备**：基线来自变更状态记录的 apply 启动 HEAD；`git diff <baseline>..HEAD` 为索引，必须追读周边代码与接口两侧消费者；评审者为未参与实现的独立上下文。
3. **十一项检查**，每项含实质：
   - 测试强度——"引入回归、看它变红、回滚"配方；覆盖率只证明行跑过；禁止复述实现的断言。
   - 缺失检测——代码改了文档没跟、新错误路径无测试、新获取无释放。
   - 范围吻合——每段新抽象映射 spec 条目，无主代码即范围蔓延。
   - 真实入口——测试走发布入口，手工装配不算。
   - 接口两侧——改动接口两侧都走查；公共契约多种表示必须归一化。
   - 生命周期与并发——七条缺陷分类学（正交结果独立上报 / 两侧履约 / 异步非同步 / 销毁至静默 / 回调封闭 / 环境隔离 / 链接识别）。
   - 强制路径——沿拒绝路径走到执行操作，找绕过门面的调用者。
   - 配置选择——每个默认值要有消费者证据或先例。
   - 能力消费者匹配——单调用者的公共方法是无谓膨胀。
   - 借用状态——验证只放在真实边界（解析器/配置/持久文件/进程/网络），类型化同进程边界信任类型系统。
   - 边界值——精确上限、超大单项、多字节。
   - **栈特化段**：由 `ctx.stack.errorHandling` 与 `ctx.stack.concurrency` 渲染（如"错误路径须符合：`<errorHandling>`"、"并发检查须基于：`<concurrency>`"）。
4. **输出纪律**：每条发现含缺陷/位置/影响/证据；阻塞与建议分离；机械门禁（栈的 lint/test/typecheck 命令）已覆盖的检查直接省略。
5. **发现处理**：blocking → TDD（先写能抓住它的失败测试）；修复后只复审修复 diff。

## Checkpoint protocol

`renderApplyFuseReview()` 输出段落（生成版 `CLAUDE.md` 的 Phase 2.5）：

- **基线**：`/opsx:apply` 启动时把当前 HEAD 写入变更目录状态；评审对象为 `基线..HEAD`。
- **触发**：最后一个任务通过验证后，AI MUST 发起检查点提问；禁止静默进入 verify/archive。
- **呈事实不裁决**：列出任务数、是否启用过 subagent、改动模块清单；可给推荐，裁决归用户。
- **用户同意** → 派发未参与实现的独立上下文执行 `/fusereview`。
- **用户拒绝** → 跳过决定写入 apply 收尾报告（含变更规模事实），可审计。
- **终止条件**：全量评审至多一轮；修复只复审修复 diff。
- **合并闸**：subagent 模式下，两阶段评审的"代码质量"阶段执行本技能（消除悬空引用），发生在合并前，保持自动。
- **手动入口**：用户可随时显式调用，不依赖检查点。

## State management

SpecFuse 侧无新增运行时状态。目标项目的状态约定（写入生成的协议文本，由 AI 在运行时执行）：

- 基线提交记录于变更目录状态（`.openspec.yaml` 相邻的状态文件或该文件新增字段），apply 启动时写入。
- 评审发现清单与跳过记录写入 apply 收尾报告。

## Error handling strategy

- 技能文件已存在 → 跳过（与 grill-me/design-md 一致的合并策略）。
- 技能目录创建/写入失败 → 抛出（沿用既有 `createDir`/`writeText` 行为，与其余文件同级失败语义）。
- 变更状态中无基线记录（旧变更或手动调用）→ 技能指示以当前分支与主干的 merge-base 兜底，并在报告中标注。
- 评审派发失败（无可用子代理能力）→ 降级为当前会话内执行技能，报告中标注非冷读。

## Risks

- 检查项全量上线可能产生弱发现 → 以输出纪律（证据强制、阻塞建议分离）约束；缩减依赖真实使用数据，记录于后续变更意图。
- 用户在时间压力下跳过检查点 → 跳过留痕 + 推荐默认倾向评审；该风险形态与 Grill blocking 覆盖机制一致，已被项目接受。
