## Context

grill-me 是 SpecFuse 四拍流水线(Think → Grill → Do → Verify)的 Grill 拍,由两个模板函数生成:
- `composeGrillMeSkill()`(`src/templates/grill-me-skill.ts`)→ 注入目标项目的 `.claude/skills/grill-me/SKILL.md`;
- `renderGrillReview()`(`src/templates/claude-md.ts`)→ 目标项目 CLAUDE.md 的 "Pre-Apply Review (Grill)" 协议段。

现状缺陷(来自 `add-webui-ping-tool` 实际审查):
- **缺陷 1 — 维度单点失效**:协议维度表(scope/error/dependency/testability/security/perf/backward-compat)缺"数据流一致性",skill 又只是激活协议的薄壳,导致 `NewHandler(scannerFactory func() *service.Scanner)` 与 per-scan `PingOptions` 的签名冲突漏检。
- **缺陷 2 — skill 依赖宿主文档存活**:SKILL.md 只写"激活 CLAUDE.md 协议",不含任何审查方法。SpecFuse 对已有项目是 append/合并,协议段落可能不存在,Grill 拍将退化为无方法空转。

本变更把审查方法下沉到 skill,使其自含、可独立存活,并补齐结构性契约审查面。

## Goals / Non-Goals

**Goals:**
- `SKILL.md` 成为自含审查方法:按工件分组的审查面 + 检查工具,不依赖宿主文档。
- 审查面覆盖"签名冲突"家族:签名契约、依赖方向、配置默认、输入承载位、断言强度、spec↔task 追踪。
- 断言强度分流:表述性缺陷直接补强,需求性缺陷回流 Think,grill 不越权发明需求。
- CLAUDE.md 协议同步:维度表新增 `Data-flow integrity`,软限制 15→9,一致性扫描双向化。

**Non-Goals:**
- 不做设计文档解析脚本(设计文档是自由文本,脚本脆弱;双向一致性扫描由签名代入法实现)。
- 不改 Do(TDD)/Verify 两拍;不新增 CLI 入口。
- 不加独立"测试设计"阶段——用双闸点(grill 前置断言强度 + verify 后置 spec↔test 追踪)替代。

## Decisions

**D1 — 审查方法下沉到 skill(方案 B)。**
skill 从"协议激活薄壳"升级为"自含审查方法"。Rejected:(1) 方案 A 最小补丁(维度表加条目 + skill 加回退句)——skill 仍是薄壳,缺陷 2 未根治;(2) 方案 C(额外解析脚本)——YAGNI,脚本解析自由文本脆弱。

**D2 — 按工件分组审查面,而非通用维度平铺。**
审查面按 proposal/design/specs/tasks 四组组织,每组是"发现视角、非必答项",贴合"审产出的工件"。Rejected:通用维度平铺(现状)——签名冲突类结构性错误落在维度表缝隙里。

**D3 — 软限制 15→9。**
9 题后自评剩余是否 blocking,无则收敛 summary。9 是自评触发点而非硬截断;自评逻辑(无剩余 blocking 才收敛)保留。

**D4 — 断言强度分流。**
spec 场景断言弱时,区分:表述性缺陷(行为已在 proposal/design 定义,补强 THEN)与需求性缺陷(行为从未定义,标记回流 Think 征求用户)。grill 只做表述性补强,不越权发明需求。

**D5 — 一致性扫描双向化。**
原单向(proposal goal → specs/tasks)追加反向:每个 spec 的 WHEN 输入必须有 design 签名参数承载位——与 skill 的签名代入法同源。

**D6 — 角色划分:skill = 方法层,CLAUDE.md = 纪律层。**
单一事实源在 skill;CLAUDE.md 保留最小兜底维度表(含 `Data-flow integrity`)+ 指向 skill,不重造清单。两者任一存在,Grill 拍都能运行(见 `grill-review-resilience` spec)。

## Component Structure

```
src/templates/grill-me-skill.ts (composeGrillMeSkill)
└── 输出 SKILL.md:
    ├── 纪律(一次一问/带证据/附推荐答案/blocking 分类/软限制 9)
    ├── 流程(backup → review → 写入 → 双向一致性扫描 → summary → cleanup)
    ├── 审查面(proposal/design/specs/tasks 四组,每组查漏视角)
    ├── 检查工具(签名代入/双向参数流/实现演练,触发式)
    └── 边界纪律(断言强度分流 + exit commands)

src/templates/claude-md.ts (renderGrillReview)
└── 输出协议段:
    ├── 头部指向 skill(单一事实源声明)
    ├── Review Dimensions: + Data-flow integrity
    ├── Soft Limit: 9
    └── Consistency Scan: 双向
```

公共 API 表面(保持不变,改动在输出内容):
- `composeGrillMeSkill(): string` — 无参,返回 SKILL.md 文本。
- `renderGrillReview(): string` — 无参,返回协议段文本。

(本变更为模板/流程型,不涉及 React 组件层次、props 接口、组件状态与 a11y;`design` schema 中 component hierarchy / props / state / a11y 规则在此不适用。)

## Error Handling Strategy

| 场景 | 行为 |
|---|---|
| CLAUDE.md 协议缺失(已有项目 append 无协议段) | skill 自含方法,grill 独立运行 |
| skill 缺失(极端) | CLAUDE.md 兜底维度表(含 data-flow)支撑 |
| 备份目录冲突 | 先清 `.grill-backup/` 再重建;失败则中止 grill |
| 断言强度遇需求性缺陷 | 不补强,标记回流 Think/征求用户 |
| 一致性扫描发现冲突 | 继续 grill 解决后再出 summary |

## Risks / Trade-offs

- **[skill 内容变长 → 每次 grill 加载更多上下文]** → 审查面定位为"发现视角、非必答项",只读不逐条执行,长度可控。
- **[CLAUDE.md 与 skill 两处维度描述漂移]** → 单一事实源在 skill,CLAUDE.md 只做兜底 + 指向,改动集中一处。
- **[软限制 9 提前收敛漏问题]** → 自评逻辑保留"无剩余 blocking 才收敛",9 是自评触发点,非硬截断;blocking 必解。
- **[新增断言强度改变 spec 审查工作量]** → 分流机制(表述性补强/需求性回流)限定 grill 只做表述性修正,不扩权。

## Migration Plan

1. 改 `composeGrillMeSkill()` 输出结构 → 更新 `grill-me-skill.test.ts` 断言。
2. 改 `renderGrillReview()`(维度/软限制/一致性扫描)→ 更新 `claude-md.test.ts` 断言。
3. `npx vitest run && npx tsc --noEmit && npm run build` 全绿。
4. 回归演练:用 `add-webui-ping-tool` 的签名冲突案例验证捕获。
5. 可选:重新渲染 specfuse 自身 CLAUDE.md 的 grill 协议段(与模板保持一致)。
   Rollback:git 还原两个模板文件与测试即可。

## Open Questions

- 是否在本次同步重新渲染 specfuse 自身的 CLAUDE.md(默认:是,保持模板与生成物一致)。
- SKILL.md 中审查面是否用中英文双语描述(默认:英文,与现有模板语言一致)。
