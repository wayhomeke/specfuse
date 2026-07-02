## Context

specfuse 是一个 CLI 脚手架工具，通过 `specfuse init` 引导用户完成项目初始化（选技术栈、git、OpenSpec、CodeGraph）。当前缺少视觉风格约束能力，导致后续 AI 生成前端组件时风格不统一。

现有 init 流程有两种模式：(1) detect→prompt→install 模式（OpenSpec/CodeGraph：`ProjectConfig` 声明配置项 → `prompts.ts` 收集选择 → `scaffolder.ts` 执行）；(2) 直接写入模式（grill-me：scaffolder 直接写 SKILL.md，无配置项和提示）。design-md 采用模式 (2)。

## Goals / Non-Goals

**Goals:**
- 提供 15 个风格原型的交互式匹配能力（skill 形式）
- 输出结构化 DESIGN.md（YAML front matter + Markdown prose）
- specfuse init 时安装 SKILL.md 文件（与 grill-me 同模式）
- 支持绿地项目（brainstorm 检测前端意图时自动触发 skill）和存量项目（`/design-md` 手动触发）

**Non-Goals:**
- 不实现运行时 design token 解析或 CSS 变量注入
- 不构建 GUI/Web 界面，交互全部在 terminal 完成
- 不涉及 DESIGN.md 与具体组件库的绑定
- 不处理多 DESIGN.md 合并或版本冲突

## Component Hierarchy

```
src/
├── scaffolder.ts               # 新增 SKILL.md 写入步骤（与 grill-me 同模式）
├── design-md/
│   ├── index.ts                # 入口：orchestrate Q&A → match → generate
│   ├── questionnaire.ts        # Q1-Q5 问题定义和收集逻辑
│   ├── archetypes.ts           # 15 个原型定义（维度向量 + 元数据）
│   ├── matcher.ts              # 两层匹配算法（类目 → 维度距离）
│   ├── fine-tuner.ts           # 微调逻辑：用户覆写部分维度值
│   ├── renderer.ts             # 渲染最终 DESIGN.md 文本
│   └── types.ts                # DimensionVector, Archetype, DesignMdConfig
│   └── templates/
│       ├── saas-dashboard.yaml  # 从真实品牌提取的 DESIGN.md 输出模板
│       ├── consumer-app.yaml
│       └── ... (15 files)
├── skills/
│   └── design-md/
│       └── SKILL.md            # Claude skill 定义（/design-md 触发）
```

## Public API Surface

```typescript
// src/design-md/types.ts
interface DimensionVector {
  colorTemp: 1 | 2 | 3 | 4 | 5;    // 色温：1=冷调 5=暖调
  lightness: 1 | 2 | 3 | 4 | 5;    // 明暗：1=深色 5=浅色
  density: 1 | 2 | 3 | 4 | 5;      // 密度：1=紧凑 5=宽松
  borderRadius: 1 | 2 | 3 | 4 | 5; // 圆角：1=直角 5=全圆
  tone: 1 | 2 | 3 | 4 | 5;         // 调性：1=严肃 5=活泼
}

interface Archetype {
  id: string;
  name: string;
  category: 'internal-tool' | 'dashboard' | 'consumer' | 'developer' | 'mobile' | 'e-commerce' | 'marketing' | 'form-heavy' | 'content';
  dimensions: DimensionVector;
  anchors: { primary: string; auxiliary: string[] };
  template: string; // YAML front matter template
}

interface QuestionnaireAnswers {
  productType: string[];       // Q1: 产品类型（多选，有主次）
  audience: string;            // Q2: 目标用户
  mood: string;                // Q3: 关键词（科技感/温暖/专业...）
  density: string;             // Q4: 信息密度偏好
  reference: string | null;    // Q5: 参考产品（可选）
}

// src/design-md/index.ts
async function generateDesignMd(targetDir: string): Promise<string | null>;
// 返回生成的 DESIGN.md 文件路径，用户拒绝覆写时返回 null

// src/design-md/matcher.ts
function matchArchetype(answers: QuestionnaireAnswers): { archetype: Archetype; score: number }[];
// 返回按匹配度排序的原型列表
```

## Decisions

### D1: 匹配算法选择 — 加权欧氏距离

**决策**: 使用加权欧氏距离计算问答结果与原型维度向量的相似度。

**理由**: 
- 比余弦相似度更直观，维度值为有序量（1-5），距离有明确物理含义
- 权重可根据用户 Q1 回答的产品类型动态调整（如 dashboard 类型给 density 维度更高权重）
- 实现简单，无外部依赖，可确定性测试

**备选**: 余弦相似度（适合高维稀疏向量，此场景仅 5 维，优势不明显）

### D2: 问答映射到维度 — 预定义映射表

**决策**: Q1-Q5 的每个答案选项预定义对维度向量的偏移量，叠加后得到目标向量。

**理由**:
- 完全确定性，同样的回答永远匹配同样的结果
- 可被测试覆盖，无 LLM 介入
- 用户微调阶段直接修改维度值

**备选**: LLM 解析自然语言描述为维度值（不确定性太高）

### D3: 模板渲染 — 字符串插值 + YAML序列化

**决策**: 原型模板为 YAML 文件，包含 design tokens 占位符。渲染时将维度值映射为具体 token 值（如 borderRadius: 3 → `--radius-md: 8px`），序列化为最终 DESIGN.md。

**理由**:
- 无需模板引擎依赖
- 维度→token 的映射表可独立维护和测试
- 输出格式与 google-labs-code DESIGN.md 规范兼容

### D4: Skill 集成方式 — SKILL.md 纯声明式

**决策**: `design-md` skill 以 `.claude/skills/design-md/SKILL.md` 形式存在，内部调用 `src/design-md/index.ts` 的逻辑。Skill 本身不含业务代码，仅定义触发条件和流程步骤。

**理由**:
- 与现有 `grill-me` skill 模式一致
- Skill 逻辑可被 brainstorm 流程直接调用（不经过 `/design-md` 手动触发）
- init 时仅写入 SKILL.md 并输出一行安装日志，不执行交互式生成
- 便于单独测试核心逻辑

## State Management Strategy

此功能为 CLI 工具的一次性流程，无持久状态管理需求：
- 问答答案在 `generateDesignMd` 函数调用期间以局部变量形式存在
- 原型模板从文件系统按需加载
- 生成完成后输出为静态 DESIGN.md 文件，无 runtime state

## Accessibility (a11y)

CLI 环境下的无障碍考虑：
- 问答使用 `@inquirer/prompts` 的 `select` / `checkbox`，原生支持键盘导航
- 所有问题提供默认推荐值，用户可直接 Enter 跳过
- 最终输出为纯文本 Markdown，任何屏幕阅读器均可解析

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 15 个原型不足以覆盖所有场景 | 用户找不到满意匹配 | 微调阶段允许覆写任意维度值；后续版本可扩展原型数量 |
| Q1-Q5 问题设计不当导致用户困惑 | 转化率低，用户跳过 | 每题提供推荐选项 + 简短解释；支持跳过整个流程 |
| 原型锚点产品下线或改版 | 模板提取的参考值失效 | 原型定义以维度向量为准，锚点仅用于人类理解，不影响匹配算法 |
| 与 brainstorm 流程耦合复杂 | 中断用户思路 | 仅在明确检测到前端意图时触发，且可一键跳过 |

## Open Questions

- Q1 多选时 primary/secondary 的权重比例具体值需要实验确定（初始建议 0.7/0.3）
- 存量项目合并已有 DESIGN.md 的策略待定（v1 先覆盖，提示备份）
