## Why

测试金字塔顶层是空的,且有实证:v0.9.0 发布时 272 单测全绿、`tsc` 干净、FuseReview 十一项通过、`npm pack` 内容正确——四道闸门全过,但用户经 `npx` 拿到的 CLI 静默无输出(`isMain` 守卫比较 realpath 化的 `import.meta.url` 与未解析的 `argv[1]`,经 bin shim 调用时永不相等)。缺陷逃逸到已发布版本,v0.9.1 补救。现有 272 个测试中真 E2E 仅 3 个(1.1%),且是事故后补的。归档评估 `2026-09-08-evaluate-qa-test-phase` 建议增加第五拍 FuseQA;本变更落地该建议。

## What Changes

新增 **FuseQA** 拍,位于 apply 之后、verify 之前,与 FuseReview 串行(先冷读代码,再补用例)。

- 新增 `src/templates/fuseqa-skill.ts` 导出 `composeFuseQASkill(ctx)`,生成 `.claude/skills/fuseqa/SKILL.md`。
- 新增 `src/fuseqa/templates/` 四份框架中立的模板,随技能分发:`_case-schema.yaml`(用例结构契约)、`derivation-checklist.md`(场景派生清单)、`entry-recipes.md`(入口构造配方)、`ledger.md`(台账格式)。
- `src/templates/claude-md.ts` 新增 `renderFuseQA()`,插入于 `renderApplyFuseReview()` 与 `renderVerifyPhase()` 之间;`renderVerifyPhase()` 增补一句:全量测试即 E2E 回归门禁。
- `src/scaffolder.ts` 分发技能与模板(复用 design-md 的既有机制)。
- `src/templates/claude-settings.ts` 补充 E2E 执行所需权限。
- **BREAKING**(对生成物): 已装项目重新 init 后 `CLAUDE.md` 的 FUSION 块新增 FuseQA 段落;既有技能文件不被覆盖(脚手架只加不删)。

**检查点形态**:单问 + 事实呈报(本次是否触及用户可观察入口、涉及哪些 capability、现有 e2e 用例数),人答是/否,跳过必留痕——与 FuseReview 同构。

**拉起可靠性(对比 FuseReview 的四个机制补齐)**。FuseReview 靠四点稳定拉起:触发时点唯一可判定(`tasks.md` 最后一个任务通过验证)、MUST + 禁止静默前进、技能 description 覆盖流程与口语触发、位置被 spec 断言。FuseQA 需全部具备,并额外解决一个 FuseReview 没有的失败模式——**两问相邻的互相吞噬**:两个检查点共用同一触发事件,若无约束,FuseReview 答「否」时 AI 极易顺势跳过第二问,答「是」时冷读修复完毕的收工气氛同样会吞掉它。

1. **触发独立于前一问的答案。**协议须写明:最后一个任务通过验证后,AI MUST 依次提出两个检查点问题;FuseReview 的任何答案都不改变 FuseQA 必须被提问这一事实。**显式禁止合并提问**——不得压缩为「要不要做评审和 QA」,否则一个「否」同时跳掉两件不同性质的事。
2. **完成条件落在可检查的产物上。**apply 收尾报告 MUST 同时含两条决定记录(FuseReview 的、FuseQA 的);缺任一条即 apply 未完成,不得进入 `/opsx:verify`。这把「有没有问」从依赖 AI 记性变成人一眼可查的缺行。
3. **技能 description 覆盖自动与口语触发。**流程内(post-apply E2E verification,第五拍)+ 用户口语(「写 e2e 测试」「端到端测试」「QA 验收」「补测试用例」)。缺此项则即使 CLAUDE.md 写了 MUST,Skill 工具也不会拉起技能,四份模板形同不存在。

**职责边界(收窄是关键)**:FuseQA 只做两件事——为本次变更的入口变化补用例、处理新用例暴露的问题。**不含回归执行**(归 verify 拍的全量测试),**不含独立查红阶段**(新用例第一次红属 TDD 的 RED;已有用例变红属回归失败,由 verify 门禁拦截)。

**发现分级按归因,不按红**:红用例有证据但归因未定,归因通常廉价(v0.9.0 判定耗时约两分钟),故先归因再定级。
- 实现缺陷 → **Blocking**,红用例本身即「能抓住缺陷的失败测试」,直接修实现。此级不可松——它是本拍的全部理由。
- spec 漏洞 → **Suggestion**(默认),行为未被 spec 定义则产品不算错;若该未定义行为导致用户可见损坏,升级 Blocking。
- 用例假红 → **不入分级**,是用例债。修正或剔除,并在台账写明「为何代码是对的」及证据。
- 归因超时间盒 → 降级 Suggestion,不得挂起收尾。

**用例是产物,台账记生命周期**:用例落 `tests/e2e/<capability>/`,与 `openspec/specs/<capability>/` 同名对齐。台账记录新增(traces-to 哪条 Scenario 或哪个逃逸缺陷)、修正(原判断为何错)、**剔除(为何不再有效)**——剔除必须留理由,否则「删掉红用例」与「掩盖缺陷」在台账上无法区分。

**确定性与 AI 判断的切分依据:能机械检查的固化,不能的留给 AI。**
- 固化(可 grep 校验):产物三问决策树(用户怎么拿到 → 怎么触发 → 什么外部可观察)、入口配方(CLI 必须覆盖 bin shim 通路;库必须按 `package.json` 的 `exports` 从 `dist` 导入;数据产物交给真实消费者)、用例契约(禁止 `import ../src/`,被测物须为制品)。
- 留给 AI:测试工具选择。规定契约不规定工具——`remove-stack-selection` 刚以「栈是项目自己声明的事实」为由删除 15 栈子系统,FuseQA 规定 `bats` 等于把栈知识从后门放回。

## Non-goals

- **不执行回归。**回归是 verify 的全量测试;无 `vitest.config.*`,默认 include 已覆盖 `tests/e2e/**`,零配置成立。
- **不加 git hook。**「每次变更回归」已由 verify 拍满足,hook 冗余;`design-philosophy.md` 代价 1 提到的 hook 是为声明式约束的运行时保障预留,与 e2e 触发无关。
- **不给下游项目预置用例或测试框架。**只分发方法、模板、台账格式。
- **不覆盖需容器或真机的场景**(移动端、跨浏览器矩阵、外部服务集成);前期限定 Linux 开发环境可完成的 CLI / API / WebUI。
- **不改 specs 制品写法。**入口重建是 FuseQA 职责,不要求 specs 增写用户级 WHEN。
- **不为未来规模提前优化。**当前 E2E 单价 ~230ms/用例(单测 0.46ms),50 条内全量约 14s,不重。切分/并行/分层门禁等到有浏览器类用例或超 100 条再谈。
- **不引入新制品类型。**用例是测试代码,不进 openspec 制品链。

## Trade-offs

**方案 1 — 不加拍,融进 Do 拍(tasks 规则 + FuseReview 第十二项)。**优点:spec 漏洞在 change 未归档时暴露,修正成本最低;无新增固定环节,分子衰减风险结构性消除。**否决理由**:用例作为产物需要一个明确的产出时刻,融进 Do 会让增/改/删散落在若干 task 中,台账无天然写入时机;且强制力从检查点降为 config 规则。

**方案 2 — 并入 FuseReview 检查点(不增拍数)。**优点:保住冷读的认知距离,判定 spec 漏洞时无「想收工」的利益冲突。**否决理由**:FuseReview 是静态冷读,一行代码不运行;令其执行新用例需具备运行环境,破坏独立上下文前提,且职责变杂。

**方案 3 — 放在 verify 之后、archive 之前。**否决理由:方案 A 下 e2e 用例已属全量测试,verify 之后再产出可能失败的新用例,会使刚完成的验收过期——要么重跑 verify(固定成本翻倍,Grill 死法),要么承认 verify 非终局(该拍语义崩塌)。**制造回退环。**

**方案 4 — 红用例默认 Suggestion 不 Blocking。**理由是 E2E 假红多。**否决理由**:混淆确定性与严重性。红用例有证据(它红了),只是归因未定;归因未定应先归因而非降级。若默认 Suggestion,v0.9.0 的红用例将不阻塞 verify 与 publish,缺陷照样逃逸——本拍唯一实证价值当场归零。假红风险由「归因时间盒」兜底,而非默认降级。

## Capabilities

### New Capabilities

- `fuseqa-checkpoint` — 检查点在 CLAUDE.md 中的位置与协议:单问强制、事实呈报、跳过留痕、职责边界(不含回归/查红)、按归因分级、台账生命周期,以及**拉起可靠性三条**(触发独立于 FuseReview 答案、禁止合并提问、收尾报告双记录为 apply 完成条件)。
- `fuseqa-skill-generation` — `composeFuseQASkill()` 的生成契约与四份模板的分发:产物三问决策树、入口配方(含 bin shim 与 `exports` 契约)、用例结构契约的五字段、浏览器用例的环境自检与可见跳过。

### Modified Capabilities

- `apply-exit-checkpoint` — 其 Scenario「Checkpoint assembled into CLAUDE.md」断言 FuseReview 段落位于 apply 与 **Verify** 之间;插入 FuseQA 后该相对位置需改为 FuseReview 与 FuseQA 相邻、FuseQA 在 Verify 之前。

## Impact

**新增**:`src/templates/fuseqa-skill.ts`、`src/fuseqa/templates/`(4 份)、`tests/templates/fuseqa-skill.test.ts`、`tests/fuseqa/templates.test.ts`。

**修改**:`src/templates/claude-md.ts`(新增 `renderFuseQA()`、`renderVerifyPhase()` 增补)、`src/scaffolder.ts`(分发)、`src/templates/claude-settings.ts`(权限)、`package.json` 的 `build` 脚本(现硬编码 `cp -r src/design-md/templates`,需带上 fuseqa 模板;硬编码易漏,验证步骤须实测 `dist/` 内容)、`tests/templates/claude-md.test.ts`、`tests/scaffolder.test.ts`。

**已知实现细节**:`scaffolder.ts` 的模板拷贝按 `.yaml` 过滤,而 fuseqa 模板含三份 `.md`,需扩展过滤或抽通用拷贝函数。

**用户可见**:生成物新增 `.claude/skills/fuseqa/` 与四份模板;`CLAUDE.md` 新增 FuseQA 段落;流水线变为 Think → Do → FuseReview → **FuseQA** → Verify。

## 开放风险

**分子衰减(已接受)。**纯内部重构的变更,正确产出是「无新增用例」,分子为零;零产出的人工检查点正是 Grill 的死因(死因是产出低而非重量,见 `docs/design-philosophy.md` 转折 6)。已选单问形态即接受此代价;职责收窄后该问的成本已压至最小。

**产物三问的普适性未经证实。**三问对本仓库四条入口(bin shim / npm create / 库导入 / 生成物被消费)验证够用,但归纳自单一仓库。面对真正陌生的产物形态(如 operator,入口是集群资源事件)是否仍导出正确答案,无证据。

**上游流程对检查点无感知(既有脆弱性,非本变更引入)。**`openspec-apply-change` 技能对 FuseReview 与 FuseQA 均零提及,`/opsx:apply` 的官方流程走完不会提到任何检查点,全靠 CLAUDE.md 约束接住——即 `docs/design-philosophy.md` 记录的「代价 1:声明式约束没有系统级保障」。根治需改上游或加 hook,超出本变更范围。这使上文补强 2(收尾报告双记录)格外重要:它是唯一不依赖 AI 自觉的检查手段。

**认知距离为零。**同一 AI 在 FuseQA 拍既了解实现又写用例,判定「spec 漏了」时存在「想收工」的利益冲突——冷读者本无此冲突(方案 2 的优势)。缓解:用例判据是机械的(禁止 `import ../src/`、须测制品),对视角独立性依赖较低;但此为真实损失。

## Verification strategy

- `npx vitest run` — 全量绿,含新增的技能生成与模板测试。
- `npx tsc --noEmit` — 无类型残留。
- `npm run build && ls dist/fuseqa/templates/` — 证明 4 份模板进入构建产物(针对 build 脚本硬编码风险)。
- 端到端脚手架:`node dist/index.js <tmp> --yes` 后断言 `.claude/skills/fuseqa/SKILL.md` 与 4 份模板存在、`CLAUDE.md` 含 FuseQA 段落且位于 FuseReview 之后 Verify 之前。
- `grep` 校验模板自身合规:入口配方含 bin shim 与 `exports` 条目;用例契约含 `import ../src/` 禁令。
- 既有项目合并路径:对已含 `.claude/skills/fuseqa/SKILL.md` 的目录重跑,断言不被覆盖。
- **拉起可靠性可测项**:断言 `composeCLAUDEmd()` 输出含「两问依次提出、FuseReview 答案不影响 FuseQA 必问」的 MUST 级措辞;含禁止合并提问;含收尾报告双记录为 apply 完成条件;断言 `composeFuseQASkill()` 的 frontmatter `description` 同时含流程触发语与至少两个口语触发语。
