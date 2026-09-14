## Why

apply 入口的模型切换检查点要求 AI 用 `AskUserQuestion` 询问用户是否切换模型，但 `src/templates/claude-md.ts` 的 `renderApplyPhase()` 第 0 步只定义了 **1 个选项**（「继续使用当前模型」），切换意图完全依赖 Other 自由输入框承接。`AskUserQuestion` 的 `options` 入参 schema 要求 **2–4 项**，严格校验入参的模型构造出单元素数组即被工具拒绝——表现为"部分大模型在切换模型这一拍报错"。宽松的模型蒙混过关，所以缺陷呈**模型相关而非必现**。

更值得记录的是它为什么能活到现在：该节拍由 `f4fd9cf`（2026-07-10）引入时**没带 spec、没带测试**，`renderApplyPhase()` 甚至未导出（唯一可达路径是 `composeCLAUDEmd()`）。一处拦在每个生成项目 apply 入口、以 MUST 级措辞强制执行的检查点，没有任何机制守着它的契约——所以一处 schema 级的入参错误，两个多月无人发现。

## What Changes

- `src/templates/claude-md.ts` / `renderApplyPhase()`：Step 0 增加 **选项 2「切换模型」**，并把「选择切换模型」与「通过 Other 输入命令」**合流为同一条后续分支**——均提示用户手动执行 `/model <name>`，随后 MUST 停止、等待重跑 `/opsx:apply`。切换路径不新增交互轮次。
- 该步骤显式声明选项数 MUST 落在 2–4 之间，作为本缺陷类别的**回归护栏**：下次若有人把选项删回单项，规格与文本两处都拦得住。
- 导出 `renderApplyPhase()`，与 `renderApplyFuseReview` / `renderFuseQA` / `renderVerifyPhase` 保持一致，为契约断言提供缝隙。
- 仓库自身 `CLAUDE.md` 同步该段——它是自举的合并副本，缺陷文本逐字相同。
- 新建 `openspec/specs/model-switch-checkpoint/spec.md`，把节拍契约落成规格。

## Non-goals

- **不定义 `AskUserQuestion` 整体不可用时的降级协议**（已明确裁决）。本次只修"入参不满足工具 schema"这一条路径；工具缺失时的行为维持现状。
- **不把具体模型名写进选项**。`sonnet` / `glm` / `ds` 不进入 `options`。
- **不改 Other 提示里的模型名示例**（`如 /model sonnet、/model glm、/model ds`）。它是既有说明性文字、非选项，泛化它属于无关范围。
- **不加「模板与自举 CLAUDE.md 漂移」守护测试**。本次只手工改齐两处，漂移检测是独立关注点。
- **不改 `src/index.ts` CLI 描述，不改 `README.md`**。README 第 67 行只写「进入实施前有模型切换检查点」，无细节需变更。
- **不改检查点之外的任何 apply 阶段行为**。

## Trade-offs

**备选 1 — 把 sonnet / glm / ds 列成选项 2–4。** 否决：把特定环境的模型名固化进通用模板，与 `remove-stack-selection` 确立的「不问技术栈、不生成栈特化内容」直接冲突。SpecFuse 是流程，不是模型选择器。

**备选 2 — 只改文本，用 `skip_specs: true` 跳过规格。** 否决：本缺陷的成因正是"无规格无人守"。不补规格，下一次改这个节拍仍然无据可依，同一类错误会再犯一次。

**备选 3 — 不导出 `renderApplyPhase()`，仅经 `composeCLAUDEmd()` 输出做子串断言。** 否决：整段契约只能靠松散匹配间接断言，改动一个词就可能误伤或漏测。具名导出与既有三个 render 函数一致，代价为零。

**备选 4 — 退回纯文本提问，绕开 `AskUserQuestion`。** 否决：选项 UI 正是把人工裁决成本降到最低的手段；退化为自由文本会削弱这道入口门。

## Capabilities

### New Capabilities

- `model-switch-checkpoint` — apply 入口模型切换检查点的契约：AskUserQuestion 选项集满足工具入参 schema（2–4 项、不绑定具体模型名）、「继续」与「切换/Other」两条分支各自的后续行为、以及该节拍不可静默跳过。

### Modified Capabilities

无。`apply-exit-checkpoint` 管的是 apply **出口**检查点（FuseReview），语义与入口检查点不同；本变更是新规格面，不是对既有 requirement 的修订。

## Impact

**Modified:** `src/templates/claude-md.ts`（Step 0 文本 + 导出）、`CLAUDE.md`（根，同步该段）。

**Tests:** `tests/templates/claude-md.test.ts` — 新增一组对 `renderApplyPhase()` 的契约断言。

**New:** `openspec/specs/model-switch-checkpoint/spec.md`。

**用户可见:** 新生成项目的 `CLAUDE.md` 该段多一个选项、少一处依赖 Other 的隐式路径。已用 SpecFuse 生成过的项目需重跑 `npm create specfuse@latest .` 才会更新——合并策略只替换 `FUSION` 标记内的段落，正是为这种情况设计的。

## Verification strategy

- **TDD 红→绿**：先在 `tests/templates/claude-md.test.ts` 写断言——`renderApplyPhase()` 输出中 `选项 N:` 的出现次数 `>= 2`。当前代码只有 1 项，该断言必红；补文本后转绿。
- **合流断言**：存在「切换模型」选项，且其后续行为与 Other 分支为同一句（切换路径不分裂成两套说法）。
- **上限断言**：选项计数 `<= 4`，不越工具上限。
- **反例验证（守的是本缺陷而非巧合）**：把选项 2 删回单项，上述断言必须转红；恢复后转绿。无法被弄红的断言不守任何东西。
- `npx vitest run` 全量绿、`npx tsc --noEmit` 干净、`npx eslint .` 零警告——三者原始输出作为完成证据。
