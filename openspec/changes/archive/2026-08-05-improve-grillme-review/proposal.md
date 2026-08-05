## Why

grill-me 是 SpecFuse 四拍流水线的 Grill 拍,但当前实现中审查维度**全部**依赖项目 CLAUDE.md 协议,skill 只是不含任何审查方法的薄壳。实际审查暴露了结构性缺陷:签名级数据流冲突(如 `NewHandler(scannerFactory func() *service.Scanner)` 与 per-scan `PingOptions` 矛盾)被漏检——根因是维度表缺"数据流一致性",且 skill 不兜底、宿主文档缺失时 Grill 拍会空转。

## What Changes

- 升级 `composeGrillMeSkill()` 生成的 SKILL.md:从"协议激活薄壳"升级为**自含审查方法**——按工件分组的审查面(proposal/design/specs/tasks)、检查工具(签名代入/双向参数流/实现演练)、断言强度分流、软限制 9。
- 升级 `renderGrillReview()` 生成的 CLAUDE.md 协议:Review Dimensions 新增 `Data-flow integrity`,软限制 15→**9**,一致性扫描从单向升级为**双向**(spec 输入 → design 签名参数)。
- 同步测试:`tests/templates/grill-me-skill.test.ts` 与 `tests/templates/claude-md.test.ts` 新增断言,现有断言全部保留(纯增量,无破坏)。

## Capabilities

### New Capabilities
- `grill-review-dimensions`: 按工件分组(proposal/design/specs/tasks)的审查面清单,含结构性契约检查(签名契约、依赖方向、配置默认、输入承载位、断言强度、spec↔task 追踪)。
- `grill-review-resilience`: skill 独立于宿主文档运行的兜底——CLAUDE.md 协议缺失时审查方法仍在,不空转。
- `grill-review-protocol`: CLAUDE.md 协议与 skill 的同步契约——维度表含 `Data-flow integrity`、软限制 9、双向一致性扫描。

### Modified Capabilities
<!-- None: specfuse's openspec/specs/ has no existing specs to modify. -->

## Impact

- `src/templates/grill-me-skill.ts` — `composeGrillMeSkill()` 输出结构重写。
- `src/templates/claude-md.ts` — `renderGrillReview()` 维度表、软限制、一致性扫描改动。
- `tests/templates/grill-me-skill.test.ts` / `tests/templates/claude-md.test.ts` — 新增断言。
- 无新增依赖;不引入 CLI 入口;不改 Do/Verify 两拍。

## Trade-offs

- **方法下沉到 skill(方案 B)** — chosen:审查方法自含于 SKILL.md,skill 可独立存活,宿主文档缺失不空转。Rejected:(1) 方案 A 最小补丁(仅加维度条目 + 回退句)——skill 仍是薄壳,缺陷 2(依赖宿主文档)未根治;(2) 方案 C(额外加独立检查脚本)——设计文档是自由文本,脚本解析脆弱,且"双向一致性扫描"本质已被签名代入法覆盖,属于 YAGNI。
- **按工件分组 vs 通用维度平铺** — chosen:审查面按 proposal/design/specs/tasks 四组组织,贴合"审产出的工件"场景,每组是查漏视角而非必答项(防冗长)。Rejected:通用维度平铺(现状)——签名冲突类结构性错误恰好落在维度表的缝隙里。

## Verification strategy

- `npx vitest run` — 全量测试,含新增断言(审查面标记、data-flow 维度、软限制 9)。
- `npx tsc --noEmit` — 类型检查。
- `npm run build` — 构建。
- 回归演练 — 用 `add-webui-ping-tool` 的签名冲突案例(proposal/design/specs 三层工件)验证升级后清单能捕获该缺陷。
