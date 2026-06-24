## Why

SpecFuse 现有 `docs/product-overview.md` 聚焦于功能介绍、架构描述和量化收益，但缺少一份阐述"设计为什么如此"的深度文档。项目已迭代至 v0.2.0（46 commits），核心设计决策散落在代码和 CLAUDE.md 模板中，缺乏系统性的思辨记录。技术社区和潜在用户需要理解 SpecFuse 背后的方法论推导——不仅是"做了什么"，而是"为什么这么做、考虑了什么替代方案、做了什么取舍"。

## What Changes

- 新增 `docs/design-philosophy.md`：8000-12000 字深度设计手记
- 六章线性叙事结构，从问题定义到设计信念的完整思考链路
- 叙事性技术博文风格，专业第三人称视角，论点具有思辨性
- 在关键决策点引用 CLAUDE.md 模板和触发条件的实际代码片段
- 覆盖四大主题：核心洞察、流程设计与融合策略、约束哲学与 AI 行为建模、局限与路线图

## Non-goals

- 不替代也不修改现有 `docs/product-overview.md`——两份文档互补
- 不涉及代码变更、模板修改或功能新增——纯文档产出
- 不是用户指南或操作手册——不包含使用步骤
- 不追求完整的学术论文格式——是有深度的技术博文

## Trade-offs

| Alternative | Why rejected |
|---|---|
| 扩展现有 product-overview.md 增加 why/how 章节 | product-overview 定位为功能介绍和市场定位文档，注入大量设计思辨会破坏其信息密度和阅读目标 |
| 采用 ADR (Architecture Decision Records) 格式，每个决策独立成文件 | 失去叙事连贯性，读者无法在一篇文章中看到从问题到方案的完整推导路径；适合工程团队内部但不适合对外传播 |

## Capabilities

### New Capabilities
- `design-philosophy-document`: 生成 `docs/design-philosophy.md` 深度设计手记，涵盖核心洞察、流程设计、约束哲学和局限分析

### Modified Capabilities

（无已有 spec 需要修改）

## Impact

- `docs/design-philosophy.md`（新文件）：主文档产出
- 无代码变更、无 API 变更、无依赖变更
- 无运行时影响——纯文档新增
