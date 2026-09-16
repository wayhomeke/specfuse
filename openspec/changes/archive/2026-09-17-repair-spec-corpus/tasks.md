# Tasks — repair-spec-corpus

严格 TDD:先写守卫(RED),再逐项修复(GREEN)。
每项完成前必须跑出验证命令的**真实输出**作为证据 —— 「应该能过」不构成完成。

design.md 已按 schema 的条件性条款跳过。本变更是规格语料的结构修复,行为契约不变;
`skip_specs: true` 已写入 `.openspec.yaml`,修复直接作为实现施加于 `openspec/specs/`。

---

## 1. 守卫先行

- [x] 1.1 新建 `tests/specs/spec-corpus.test.ts` —— 经子进程运行 `openspec validate --specs --strict`,断言零失败。
  - 用 `execFileSync`,读其退出码与输出;断言 `Totals` 行为 `0 failed`。
  - **跳过路径(不可省)**:`openspec` 不在 PATH 时**打印跳过原因并判绿**,不判红。用 `it.skip` 或提前 return 时都要先 `console.warn` 出原因 —— 静默跳过等同没有守卫。
  - 不在 E2E 套件里滤 PATH 的那套逻辑上运行(那是 scaffold 用例的隔离需要),此处需要真实 CLI。
  - 验证:`npx vitest run tests/specs/spec-corpus.test.ts` —— 预期**红**,且失败信息应报出当前 7 项失败。这是变更前的真实状态,不是构造的。

- [x] 1.2 记录 RED 基线:保存 `openspec validate --specs --strict` 的完整输出,作为 7 → 0 的起点证据。
  - 验证:`openspec validate --specs --strict 2>&1 | tail -3` —— 应显示 `Totals: 8 passed, 7 failed`。

## 2. design-md：收敛为两个 capability

- [x] 2.1 把 `design-md-archetypes/spec.md` 重写为规范主 spec。
  - 结构:`# design-md-archetypes Specification` + `## Purpose` + `## Requirements`。
  - Requirement 取 `-v2` 的四条(混合种子 schema、16 原型类别覆盖、`_schema.yaml` 与 v2 一致、锚点值合法),**逐字保留其 Scenario**,不新造行为。
  - v1 的两条 REMOVED 不保留 —— v1 从未作为规范 spec 存在过,「移除一个不存在的东西」不承载信息。
  - 验证:`openspec validate design-md-archetypes --type spec --strict`

- [x] 2.2 删除 `design-md-archetypes-v2/`(内容已在 2.1 并入)。
  - 删除后确认规格树中不再有该 capability:`openspec spec list | grep -c archetypes-v2` 应为 0。
  - 验证:`openspec validate --specs --strict 2>&1 | tail -3`

- [x] 2.3 删除 `design-md-generator/`(代码中已无 `generateDesignMd`,能力不存在)。
  - **先核实再删**:`grep -rn "generateDesignMd" src/` 必须为空,否则停手并报告。
  - 验证:`openspec validate --specs --strict 2>&1 | tail -3`

- [x] 2.4 把 `design-md-skill-generation/spec.md` 重写为规范主 spec。
  - 内容不变,只补三段结构(其五条 Requirement 与 Scenario 逐字保留)。
  - 验证:`openspec validate design-md-skill-generation --type spec --strict`

- [x] 2.5 内容保真核对:2.1 吸收的四条 Requirement 与实况逐条对照。
  - 原型数 = 16;`_schema.yaml` 顶层 required = id/name/category/intent/dimensions/anchors/structure;锚点 hex 合法。
  - 验证:脚本逐条断言,任一不符则停下报告(说明是规格写错了,不是实现错了)。

## 3. 填三处 TBD Purpose

- [x] 3.1 `fuseqa-checkpoint` —— 用该 capability 实际管辖的内容重写(检查点提问的强制性、与 FuseReview 的独立性、归因分级、用例生命周期)。
  - 验证:`openspec validate fuseqa-checkpoint --type spec --strict`

- [x] 3.2 `fuseqa-skill-generation` —— 同上(技能渲染与分发契约)。
  - 验证:`openspec validate fuseqa-skill-generation --type spec --strict`

- [x] 3.3 `openspec-readiness-reporting` —— 同上(就绪度报告与失败路径的措辞契约)。
  - 验证:`openspec validate openspec-readiness-reporting --type spec --strict`

## 4. 订正 scaffold-tool-boundary 的 Purpose

- [x] 4.1 `openspec/specs/scaffold-tool-boundary/spec.md:3` —— 「three questions」→「two questions」。
  - 依据是同文件 `:72` 的 Requirement 标题与 `:74` 正文,以及 `collectProjectConfig()` 实际只发两个 `confirm()`。改前重跑一次代码核实,不凭记忆。
  - 验证:`grep -n "exactly two questions" openspec/specs/scaffold-tool-boundary/spec.md` 应命中 Purpose 与 Requirement 各一处。

## 5. 守卫转绿与跳过路径自证

- [x] 5.1 `npx vitest run tests/specs/spec-corpus.test.ts` —— 全绿;记录 7 → 0 的下降过程。
- [x] 5.2 **跳过路径自证**:构造一个 `openspec` 不在 PATH 的环境运行守卫,确认它**打印跳过原因并判绿**。
  - 验证:临时把 PATH 收窄到不含 openspec 的目录后运行,贴出输出 —— 必须能看到跳过原因文本,且退出码为 0。
  - 这条不可省:跳过是本方案唯一的安全阀,不验证它就可能存在「静默通过」的假绿。

## 6. 全量门

- [x] 6.1 `npx vitest run` —— 全绿(既有 477 项 + 新增守卫),粘贴原始输出。
- [x] 6.2 `npx tsc --noEmit` —— 零错误。
- [x] 6.3 `npx eslint .` —— 零告警。
- [x] 6.4 人工确认:抽读重写后的 `design-md-archetypes/spec.md` 与三处新 Purpose,确认句子读得通、且没有把 delta 用语(「本次新增」「已移除」)带进规范 spec 的现在时陈述里。
