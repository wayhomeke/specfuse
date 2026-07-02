## Why

specfuse 初始化项目后，用户在首次生成前端 UI 时缺少统一的视觉风格约束，导致 AI 生成的组件在色彩、间距、圆角等维度上不一致。需要一个交互式 DESIGN.md 生成器，在恰当时机引导用户选择风格方向，输出机器可读的 design tokens + 人类可读的设计说明。

## What Changes

- 新增 `design-md-generator` skill：通过 Q1-Q5 问答 + 局部微调引导用户描述场景和风格偏好，匹配 15 个预设风格原型，生成 DESIGN.md
- 新增风格原型模板库：15 个原型（9 个源自 awesome-design-md 真实品牌提取 + 6 个自建覆盖内部工具/仪表盘等场景），每个原型含维度向量和参考锚点
- 修改 `src/scaffolder.ts`：在 skill 安装步骤中写入 `.claude/skills/design-md/SKILL.md`（与 grill-me 同模式，仅安装 skill 文件，不执行生成逻辑）
- 新增 CLAUDE.md 约束规则：定义何时触发 design-md skill（绿地项目 brainstorm 自动触发 / 存量项目手动 `/design-md`）

## Non-goals

- 不替代完整的 design system / component library 建设
- 不生成具体组件代码（DESIGN.md 是风格方向约束，非实现）
- 不涉及运行时 design token 注入或 CSS-in-JS 集成
- 不提供 DESIGN.md 的可视化预览或实时编辑 UI
- 不修改已有 OpenSpec/CodeGraph 的 init 流程逻辑

## Trade-offs

| 方案 | 优势 | 劣势 | 决策 |
|------|------|------|------|
| A. 纯模板匹配（问答→维度向量→最近邻匹配） | 确定性输出，不依赖模型生成质量 | 15 个原型可能不覆盖长尾场景 | ✅ 选择此方案：可预测、可测试、后续可扩展 |
| B. LLM 自由生成 DESIGN.md | 灵活度高 | 输出不可控，风格偏好受模型偏见影响 | ❌ 拒绝 |
| C. 混合方案（模板 + LLM 微调） | 兼顾确定性和灵活性 | 实现复杂度高，调试困难 | ❌ 暂不采用，v2 可考虑 |

## Capabilities

### New Capabilities

- `design-md-generator`: 交互式 DESIGN.md 生成 skill，含问答引导、原型匹配、维度计算、微调、文件输出
- `design-md-archetypes`: 15 个风格原型模板库，含维度向量定义和参考锚点提取规则

### Modified Capabilities

- (无已有 spec 被修改)

## Impact

- **新增文件**: `src/design-md/` 目录（generator 逻辑）、`src/design-md/templates/` 目录（原型模板）
- **修改文件**: `src/scaffolder.ts`（新增 SKILL.md 写入）、`CLAUDE.md`（新增触发规则）
- **依赖**: 无新外部依赖，模板匹配为纯计算（欧氏距离/余弦相似度）
- **触发路径**: 绿地项目 → brainstorm 识别前端意图时自动拉起；存量项目 → 用户手动 `/design-md`

## Verification Strategy

- 单元测试：维度向量计算、原型匹配算法正确性
- 集成测试：Q1-Q5 问答流程 → DESIGN.md 文件生成 → 内容结构校验
- E2E 冒烟测试：`specfuse init` 后 `.claude/skills/design-md/SKILL.md` 文件存在且内容正确
