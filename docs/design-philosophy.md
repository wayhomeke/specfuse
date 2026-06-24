# SpecFuse 设计手记：从方法论到机器指令

> 本文记录 SpecFuse v0.2.0 的设计决策推导过程。它不是使用指南，也不是功能介绍——而是一份关于"为什么这样设计"的思辨记录。文中代码片段取自 v0.2.0 源码快照。

---

## 一、能力过剩时代的纪律问题

2025 年下半年，AI 编码工具完成了一次质变：从"补全代码片段"跃迁至"独立完成完整功能"。Claude Code、Cursor Agent、GitHub Copilot Workspace 相继证明，大语言模型已经具备独立交付生产级代码的能力。

然而，一个隐蔽的悖论随之浮现：**模型越强大，工程事故越频繁。**

这不是能力退化——恰恰相反，正因为 AI 能力足够强，开发者开始减少干预、默认信任产出。当 AI 声称"已完成"时，审查变得稀疏；当 AI 连续成功交付时，测试变得奢侈。信任建立在连续成功的记忆上，但下一次失败不会因为之前的成功而消失。

这个现象指向一个根本性的结构问题：**AI 编码工具的瓶颈已经从"能不能做"转移到"做的时候守不守规矩"。**

一个有趣的类比来自民航业。现代客机的自动驾驶系统完全有能力独立完成从起飞到降落的全部操作。但航空工程从未因此取消检查单、标准操作程序和交叉验证——事实上，飞机越先进，流程约束越严格。原因很简单：能力和纪律是两个正交维度。能力回答"能不能做到"，纪律回答"每次都这么做吗"。

SpecFuse 的核心立场即由此确立：**不信任能力的自律性，只信任流程的强制性。**

这个立场的代价是明确的：它意味着即使 AI 在某些场景下能够"正确地跳过流程"（比如一个显而易见的单行 bugfix），SpecFuse 仍然要求走完最低限度的验证。这是故意的过度约束——在 AI 可解释性和可预测性尚未成熟的阶段，确定性优于效率。

一种反驳是：过度约束会降低开发速度，让简单事情变复杂。SpecFuse 对此的回应不是否认代价，而是通过渐进式复杂度来控制代价——这将在后续章节展开。但核心信念不让步：**流程成本是已知的线性开销，纪律缺失是未知的指数级风险。**

---

## 二、两个半成品的相遇

SpecFuse 的诞生不是从白纸开始的架构设计，而是源于一个具体的观察：OpenSpec 和 Superpowers 各自解决了 AI 编码问题的一半，但没有一个解决了全部。

**OpenSpec** 提供了 spec-driven 的工作流引擎——从 proposal 到 archive 的完整变更生命周期、结构化的 artifact 依赖关系、基于 schema 的工作流定义。它回答了"做什么"和"按什么顺序做"的问题。但它不管"做的时候遵不遵守纪律"：一个 OpenSpec 工作流可以产出完美的 proposal 和 design，然后在实施阶段完全跳过测试。

**Superpowers** 提供了 AI 行为约束技能——TDD 强制、验证证据收集、苏格拉底式头脑风暴、系统性调试。它回答了"怎么做才算做好"的问题。但它不管"为什么做这件事"：一个激活了 TDD 技能的 Claude Code 会话可以写出测试覆盖率 100% 的代码，但如果最初的方向就错了，高覆盖率只是精确地走向了错误的终点。

**一种选择是"组合"——让用户同时安装两者，各用各的。** 这条路的问题在于：两个工具之间没有强制的激活顺序。开发者可能在 Superpowers 的 TDD 模式下开始编码，忘记先运行 OpenSpec 的 proposal 阶段。或者反过来，写了完美的 spec 但实施时忘记激活验证技能。组合是物理上的共存，不是逻辑上的协作。

**SpecFuse 选择的是"融合"——在两者之上建立一个协作协议层，声明两者何时激活、以什么顺序激活、如何衔接。**

这个协议层的物理载体是 CLAUDE.md 文件。这是一个关键的架构决策：

> **为什么不直接修改 OpenSpec 或 Superpowers 的源码来实现融合？**
>
> 被否理由：一旦修改上游，融合逻辑就与版本耦合。上游任何一方升级都可能破坏集成。更根本的是，融合规则是**项目级**的——不同项目可能需要不同强度的约束，这不是上游工具应该承担的决策。
>
> 选择的代价：CLAUDE.md 是声明式的纯文本，它依赖 AI 的理解和遵守——没有编译时检查，没有运行时强制。这意味着约束的有效性取决于 AI 对规则文本的解析质量。

这个决策的类比是 Docker Compose：不修改任何容器镜像的代码，只在镜像之上声明它们如何启动、如何互联、按什么顺序运行。SpecFuse 的 CLAUDE.md 就是 AI 工具链的 docker-compose.yml。

融合带来的具体行为是：当 `/opsx:apply` 被调用时，CLAUDE.md 声明 AI **必须**先激活 Superpowers 的 TDD 技能，**然后**才能开始处理 OpenSpec 定义的 tasks。这种"先激活纪律约束，再执行工作流步骤"的强制顺序，是组合方式无法保证的。

```typescript
function renderApplyPhase(stack: StackProfile): string {
  return `### Phase 2: Apply / Implement

When \`/opsx:apply\` is invoked:

1. **MUST activate Superpowers \`test-driven-development\` as a pre-requisite skill.**
   - For every task in \`tasks.md\`, follow strict Red-Green-Refactor:
     a. Write a failing test FIRST
     b. Write minimal code to make it pass
     c. Refactor while keeping tests green

2. **MUST activate Superpowers \`verification-before-completion\` before marking ANY task done.**
   - **IRON LAW: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**`;
}
```

这段代码展示了融合的关键机制：OpenSpec 的阶段触发（`/opsx:apply`）与 Superpowers 的技能激活（`test-driven-development`、`verification-before-completion`）被绑定在同一个声明中。AI 不能只执行工作流步骤而忽略行为约束，也不能只激活行为约束而脱离工作流语境。

---

## 三、三阶段流水线：Think → Do → Verify

将两个工具融合后，SpecFuse 的工作流自然分解为三个阶段。这种三阶段划分不是创新——它是软件工程几十年来"设计-实现-验证"模式的直接映射。选择不创新恰恰是一个刻意的设计决策：

> **为什么不设计一种全新的 AI 原生工作流？**
>
> 被否理由：工程师已经内化了"想清楚再动手，做完要验证"的心智模型。新的工作流范式意味着额外的学习成本和认知摩擦。SpecFuse 的目标不是改变工程师思考问题的方式，而是把现有的最佳实践编码为机器可执行的约束。
>
> 选择的代价：这意味着 SpecFuse 不会利用 AI 可能带来的全新工作模式（比如"边写边验"的实时验证流）。它是一个保守的选择——但保守在流程设计上往往是正确的，因为流程的价值来自可预测性。

### Think 阶段：方案设计

Think 阶段的核心约束是**防止 AI 直奔实现**。在没有约束的情况下，AI 收到"添加用户认证"的指令后，最自然的反应是立刻开始写代码。这在技术上可行，但工程上危险——因为它跳过了最关键的问题："真的需要认证吗？OAuth 还是 JWT？Session 还是 Token？"

SpecFuse 在 Think 阶段强制激活 Superpowers 的 brainstorming 技能，这意味着 AI 必须：

1. 一次只问一个问题（苏格拉底式对话，防止认知过载）
2. 提出 2-3 种替代方案并比较取舍
3. 明确声明 Non-goals（不做什么）和 Trade-offs（做了什么代价）

这三条规则各自对应一种常见的 AI 编码失败模式：一次抛出大量问题导致用户草率回答、只考虑第一个想到的方案、实施到一半才发现边界没定清。

Think 阶段的产出是 OpenSpec 的四个 artifact：proposal → design → specs → tasks。它们之间存在严格的依赖关系：design 必须引用 proposal 的决策，specs 必须覆盖 design 声明的所有行为，tasks 必须能追溯到 specs。这种追溯性不是文档审美——它是后续 Verify 阶段"spec 对照"的基础。

一个被否的替代方案是"让 AI 自己决定需要几个 artifact"：

> **为什么不让 AI 根据变更复杂度自动决定跳过某些 artifact？**
>
> 被否理由：artifact 的价值不仅在于指导实施，还在于留下决策记录。即使是简单变更，proposal 中的 Non-goals 也能防止未来的范围蔓延。固定的 artifact 序列消除了"这个变更够不够简单可以跳过设计"的判断成本。
>
> 选择的代价：小变更（如修改一个配置项）也需要走完整个 artifact 链。这是 SpecFuse 当前最明显的过度设计区域——后续版本可能引入"轻量级变更"路径。

### Do 阶段：实施执行

Do 阶段解决两个问题：(1) AI 声称完成但实际没测试；(2) 大变更后半段质量下滑。

第一个问题通过 TDD 铁律解决。SpecFuse 在 CLAUDE.md 中将 TDD 声明为不可跳过的行为：

```
- **IRON LAW: NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE.**
- Before checking off a task `[x]`, you MUST:
  a. Run the actual verification command in the terminal (`npx vitest run`)
  b. Paste the raw output as evidence
  c. Only then mark the task complete
- "I believe it works" or "it should pass" is NEVER acceptable.
```

"铁律"这个词是故意选择的。它不是"建议"、"推荐"或"最佳实践"——而是一个不可协商的硬约束。在大量实践中观察到，如果测试验证是可选的，AI 在时间压力下（上下文即将饱和）会优先推进功能而跳过验证。只有将其声明为绝对规则，才能消除 AI 的"合理化跳过"行为。

> **反驳：如果一个测试的实现很简单且逻辑显而易见，强制先写测试是否是浪费？**
>
> 这个反驳成立的条件是"逻辑显而易见"这一判断可靠。但在 AI 编码场景中，"显而易见"的判断来自 AI 本身——而 AI 恰恰是需要被约束的对象。让被验证者自己决定哪些场景不需要验证，是一个循环论证。铁律的价值在于消除这个判断环节本身。

第二个问题通过条件触发的 Subagent 和 Worktree 机制解决。当一个变更包含大量任务时，单一 AI 会话的上下文会逐渐饱和，导致后半段代码质量显著下降。SpecFuse 的 CLAUDE.md 声明了升级触发条件：

```
4. **Subagent-Driven Development trigger conditions:**
   When ALL of the following are met, SHOULD enable subagent mode:
   - `tasks.md` contains ≥ 6 pending implementation tasks
   - Most tasks have no `blocked by` dependency on each other
   - Tasks map to different modules/files with clear module boundaries
   - Session context window is >40% consumed
```

这段声明包含了几个微妙的设计选择，将在下一章详细展开。

### Verify 阶段：验收归档

Verify 阶段填补了"做完了"和"验收通过"之间的 gap。在传统开发中，这个 gap 由人工 code review 填补。在 AI 编码中，如果 AI 自己声明"完成"并自己验收，等于取消了这个 gap。

SpecFuse 的 Verify 阶段要求三重检查：spec 逐条对照（确认没有遗漏需求）、全量测试通过（确认没有回归）、linter 零警告（确认没有降低代码质量基线）。只有三者都满足，变更才被允许归档。

---

## 四、AI 行为建模与约束哲学

SpecFuse 对 AI 行为的建模基于一个核心假设：**AI 是"有能力但缺乏纪律"的执行者。** 它不是恶意的（不会故意绕过约束），也不是无能的（给它正确的指令它能执行），而是缺乏一致性——在无约束的环境下，它的行为会随上下文压力、对话历史和隐含偏好而漂移。

这个假设决定了 SpecFuse 的约束设计范式：**声明式规则 + SHOULD/MUST 分级 + 条件触发。**

### 声明式规则 vs 硬编码逻辑

SpecFuse 的所有约束都以自然语言声明在 CLAUDE.md 中，而非硬编码为程序逻辑。这是一个需要辩护的选择：

> **为什么不用代码（如 pre-commit hooks 或 CI checks）来强制约束？**
>
> 两层原因。第一，AI 编码工具的行为发生在代码提交之前——hook 和 CI 无法约束"还没写完的代码"。第二，SpecFuse 约束的对象不是代码产物，而是 AI 的**工作过程**（"先写测试再写实现"、"先激活技能再执行任务"）。过程约束只能通过影响 AI 的行为指令来实现，而不是通过检查产出来后验。
>
> 选择的代价：声明式约束没有系统级保障。AI **可能**违反 CLAUDE.md 中的规则——特别是在极端上下文压力下。这是 SpecFuse 当前最大的系统性风险。

### SHOULD vs MUST 分级

SpecFuse 的规则使用 RFC 2119 风格的强度分级。观察 Subagent 触发条件的声明：

> "When ALL of the following are met, **SHOULD** enable subagent mode"

这里使用 SHOULD 而非 MUST 是一个深思熟虑的选择。区分在于：

- **MUST** 用于永远正确、无需上下文判断的规则（如"测试必须通过才能标完成"）
- **SHOULD** 用于通常正确、但存在合理例外的规则（如"6+ 任务时启用 subagent"）

同样是 6 个任务，如果它们之间存在紧密的数据依赖，分派给独立 subagent 反而会引入同步开销。SHOULD 给了 AI 在满足条件后仍然**不**启用 subagent 的判断空间——只要它能给出合理理由。

> **反驳：如果给 AI 判断空间，它会不会倾向于总是选择"不启用"（因为更简单）？**
>
> 这个风险确实存在。SpecFuse 的缓解策略是将条件设得足够具体——不是"如果你觉得任务很多"，而是"tasks.md contains ≥ 6 pending tasks AND most tasks have no blocked by dependency"。具体的可验证条件减少了 AI 主观解释的空间。未来版本考虑将 SHOULD 升级为 MUST + 显式例外声明。

### 渐进式复杂度

SpecFuse 的流程成本与变更复杂度的关系是分级的：

```
小变更（1-3 任务）  → 直接 TDD，无额外开销
中等变更（4-5 任务） → TDD + 可选 worktree
大变更（≥6 任务）   → TDD + subagent + worktree（自动建议）
```

这个设计回应了第一章提到的"过度约束"反驳。给单行 bugfix 跑 subagent 是浪费，给 8 模块 feature 不做隔离是冒险。渐进式复杂度让流程成本自适应于变更规模。

声明这个分级的方式也很关键——它不是代码逻辑的 if-else，而是 CLAUDE.md 中的文本描述：

```
5. **Git Worktree isolation trigger conditions:**
   When ANY of the following are met, SHOULD create a worktree before apply begins:
   - Change involves destructive refactoring (replacing core modules, migrating data structures)
   - Multiple `/opsx:new` changes are being worked on in parallel
   - Rollback cost of failure is high (change affects multiple consumers)

   Worktree is NOT needed when:
   - Single-file bugfix
   - Adding a new independent module (no impact on existing code)
   - Documentation or configuration adjustments
```

这段声明同时包含了正向条件（何时应该隔离）和反向条件（何时不需要隔离）。反向条件的作用是防止 AI 过度保守——不是所有变更都需要 worktree，明确说出"不需要"比只说"需要"更能引导合理判断。

### 行为模型的验证困境

声明式约束面临的根本问题是：**如何验证 AI 确实遵守了规则？**

SpecFuse 目前的解决方案是"验证证据"机制——AI 必须粘贴终端输出作为完成的证据。这把"是否执行了验证"从 AI 的主观声明变成了可观察的行为。但这仍然依赖 AI 诚实地执行命令并粘贴真实输出。

一种更强的方案是 pre-commit hook 级别的后验检查（如检查测试覆盖率、检查是否有未运行的测试文件）。这在 SpecFuse 的路线图中，但当前版本选择了更轻量的"信任 + 证据"模型——因为 hook 方案需要与各种 CI 环境集成，增加了部署复杂度。

---

## 五、已知局限与诚实反思

任何设计都有局限，区分在于哪些是故意的取舍、哪些是尚未解决的问题。

### 局限一：声明式约束无系统级保障（严重度：高）

CLAUDE.md 是纯文本建议，不是编译器或运行时。AI 在极端条件下（上下文极度饱和、指令冲突）可能违反声明的规则。这不是 SpecFuse 的 bug，而是其架构选择的根本代价。

**分类：** 有意的架构取舍。选择声明式是为了保持与上游工具的解耦和项目级定制的灵活性。系统级强制需要侵入 AI 工具链底层，目前没有稳定的接口支持这一点。

**缓解方向：** 等待 Claude Code 暴露 hook API 后，增加 post-action 验证层。

### 局限二：仅支持 Claude Code 生态（严重度：高）

SpecFuse 深度依赖 CLAUDE.md 约定和 Superpowers 插件体系。Gemini CLI、Copilot、Aider 用户无法使用。这限制了产品的潜在覆盖范围。

**分类：** 阶段性限制。不是设计上认为只应支持一个平台，而是融合规则的表达方式（CLAUDE.md + Superpowers skill 激活协议）目前只有 Claude Code 原生支持。

**缓解方向：** v0.3 路线图包含 Gemini CLI 适配（GEMINI.md + 等效行为约束）。核心挑战不是生成不同格式的配置文件，而是不同平台对"行为约束"的支持深度不同。

### 局限三：小变更的固定开销（严重度：中）

即使是修改一个错别字，当前 SpecFuse 工作流仍要求创建 proposal、design、specs、tasks 四个 artifact。这对于"5 分钟能解决的问题"来说是不合比例的开销。

**分类：** 已识别的过度设计。当前版本选择了"宁可过度也不遗漏"的保守策略，因为在 v0.2.0 阶段，确认 artifact 链路的完整性比优化小变更的效率更重要。

**缓解方向：** 考虑引入"quick-fix"路径——满足特定条件（单文件、无 API 变更、有现有测试覆盖）时允许跳过 design 和 specs，直接从 proposal 到 tasks。

### 局限四：Subagent 触发是建议性的（严重度：中）

SHOULD 级别的触发条件意味着 AI 可能在满足所有条件时仍然选择不启用 subagent。在实践中观察到，AI 倾向于"继续做下去"而非"切换工作模式"——因为切换有认知成本而继续没有。

**分类：** 有意的设计选择，但效果低于预期。选择 SHOULD 是为了给 AI 判断空间，但实际结果是 AI 几乎从不主动升级到 subagent 模式。

**缓解方向：** 考虑升级为"MUST + 显式 override"——默认强制启用，但 AI 可以通过声明具体理由来豁免。这比 SHOULD 的单向建议提供了更强的默认行为。

---

## 六、核心信念与未完成的路

回到第一章的起点：AI 编码的瓶颈已经从能力转移到纪律。

SpecFuse 的设计选择——声明式融合、三阶段流水线、TDD 铁律、渐进式复杂度——都是这个核心信念的具体展开。它们不是最优解，不是唯一解，但它们是一组内部一致的选择：如果相信"流程强制优于能力自律"，那么接下来的每个决策都应该朝这个方向延展。

但这个信念本身也需要被质疑。当 AI 的可解释性和可预测性足够成熟时——当"AI 为什么跳过了这个测试"可以被精确归因和预防时——声明式约束可能不再是最佳形态。它可能让位给更轻量的"异常检测 + 即时纠正"模型。

SpecFuse 的设计为那一天保留了空间：约束规则是项目级的纯文本，不是系统级的硬编码。当约束的表达方式需要进化时，变更的是一个文本文件的内容，不是一个软件系统的架构。

在那一天到来之前，SpecFuse 的赌注是：**在一个 AI 能力快速进步但可预测性尚未跟上的窗口期，结构化的纪律约束是工程产出可靠性的必要条件，而非效率的障碍。**

这个赌注可能错。但错的代价是可控的——多花一些流程时间。而如果不赌，错的代价是不可控的——每一次"AI 说完成了但实际没测试"都是一次未知的风险暴露。

工程的核心从来不是追求最优，而是控制下行风险。SpecFuse 选择了控制风险那一边。
