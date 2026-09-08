> **本文是评估文档,不是实施提案。** 结论是一个建议加上它的开放风险,不推进 `specs` / `design` / `tasks`。是否落地由人裁决。

## Why

四拍流水线的测试金字塔顶层是空的,这有实证而非推断。v0.9.0 发布时:272 个单测全绿、`tsc --noEmit` 干净、FuseReview 十一项检查通过、`npm pack` 内容正确——四道闸门全过,但用户通过 `npx` 拿到的 CLI 静默无输出(`isMain` 守卫拿 realpath 化的 `import.meta.url` 比未解析的 `argv[1]`,经 bin shim 调用时永不相等)。缺陷逃逸到已发布的 npm 版本,靠人肉冒烟才抓到,需要 v0.9.1 补救。`docs/product-overview.md` 将「无 E2E 验证」标为**高优先级**架构债,指向同一处。

现有 272 个测试的实际分布:单元 ~252(92.6%,主要是「生成的 Markdown 里有没有这句话」的字符串断言)、集成 17(6.3%,`vi.mock` 掉了 `utils/tools.js`)、端到端 3(1.1%,且是事故后补的 `cli-entrypoint.test.ts`)。

## What Changes

评估对象:在 Think → Do → FuseReview → Verify 之后增加第五拍 **FuseQA**,与 FuseReview 同构的人工检查点。

- **用例来源**:`specs` 为骨架(逐 Scenario 映射),`proposal` 的 Non-goals / Trade-offs 为**负向边界**(划出不该测的范围,避免制造假失败),QA 方法论派生边界值 / 等价类 / 竞态 / 错误注入(这类不在任何制品里)。
- **用例归属(方案 A)**:落在项目自己的 `tests/e2e/<capability>/`,与 `openspec/specs/<capability>/` 同名对齐。变更归档时用例**留在主套件**,不进档案。回归因此零成本成立——它已经是 `npx vitest run` 的一部分。
- **职责边界**:FuseQA 检查点只负责「为本次变更新增用例 + 执行新增的那些」。**已有用例的回归交给 Verify 拍的全量测试**,机器跑,不消耗人的注意力。
- **场景与工具**:CLI(`bats` 或 vitest + `execFile`)、API(`curl` + `jq` 或 vitest)、WebUI(`playwright`)。环境已验证四者可用;`docker` 不可用,故用例不得依赖容器。

### 与 TDD 的边界(核心问题)

TDD 也基于 specs,重复风险真实存在。但仓库数据显示重复**可以被结构性排除**:现有 specs 的 18 条 WHEN 子句主语无一例外是函数调用或模块导入(`collectProjectConfig()` resolves、`composeGitignore()` is called、the module `src/utils/tools.ts` is imported)。CLAUDE.md 要求 specs「reference concrete symbols」,这条规则在提高可测试性的同时把 specs 的视角锚死在源码内部。

于是分工是:**TDD 读 WHEN(实现契约),FuseQA 无视 WHEN 只读 THEN(用户可观察的行为承诺),并自行重建入口。**同一条 spec 派生两条不同测试,因为入口不同。三条硬约束保证不退化:

1. **入口替换强制**:FuseQA 用例的 WHEN 必须重写为用户可达入口(argv + 子进程 / HTTP 请求 / 浏览器操作)。任何 `import ... from '../src/'` 的 FuseQA 用例即不合格——**机械可检**。
2. **被测物是制品**:TDD 测 `src/`,FuseQA 测 `dist/` 或安装后的产物。v0.9.0 正是此条的教科书案例——源码逻辑对,制品经 symlink 调用时死。
3. **THEN 升级为系统级可观察量**:退出码、stdout、生成的文件、HTTP 状态、页面元素。翻译不出来的 spec 说明它没有用户可观察后果,应**跳过**而非硬造。

约束一同时解释了为什么竞态只能在这一拍出现:入口变成真实进程后竞态才有发生场所——两个并发 `npx` 写同一个 `.claude.json`(`trustDirectory()` 是无锁的读-改-写),函数级单测结构上碰不到。

## Non-goals

- **不是替 Verify 拍执行回归。**回归是 Verify 的全量测试,FuseQA 只管新增。
- **不是给下游项目预置 E2E 用例。**SpecFuse 是脚手架,只能分发「方法 + 清单 + 台账格式」;用例是各项目独有的代码,得在使用时长出来。
- **不覆盖需要容器或真机的场景**(移动端、跨浏览器矩阵、依赖外部服务的集成)。前期限定 Linux 开发环境可完成的 CLI / API / WebUI。
- **不改 specs 制品的写法。**不要求 specs 为 QA 增写用户级 WHEN——入口重建是 FuseQA 的职责。
- **不引入新制品类型。**用例是测试代码,不是 openspec 制品,不进制品链(避免加长已被记录为「代价 2:小变更固定开销」的链条)。

## Trade-offs

**方案 1 — 加在 Verify 拍作自动门禁(不加拍)。**优点:强制力来自机器,绕开「代价 3:人工检查点依赖人的诚实」;零发现时无体感成本。**否决理由**:门禁只能执行已存在的用例,不解决「用例从哪来」——而用例生成恰是需求核心。可作为 FuseQA 的补充而非替代。

**方案 2 — 用例随变更进 `changes/<name>/qa/` 归档(方案 B)。**优点:每次变更 QA 证据完整留痕。**否决理由**:档案内用例不被执行,「每次变更都能回归」直接落空。留痕可用更便宜的方式获得——归档报告记录新增了哪几条、落在哪个文件。

**方案 3 — 双写后提升(方案 C)。**兼顾留痕与回归,但需处理提升时的重名与覆盖重叠,多一道易被跳过的人工动作。相对 A 的增量价值不足以支付这份复杂度。

**方案 4 — 强化 FuseReview 而不加拍。**否决理由:FuseReview 是静态冷读 `基线..HEAD`,一行代码都不运行。让它执行系统等于改变它的性质,且冷读者需具备运行环境——破坏「独立上下文」前提。

## 开放风险(不假装已解决)

**分子衰减风险。**Grill 的死因经本次讨论修正后已明确:不是「重」,是「产出低」——没有绝对的过重,只有产出撑不起重量的过重(见 `docs/design-philosophy.md` 转折 6)。判据是当时「瘦身但保持强制」方案被否,理由为「不解决太重的体感来源」;若重量是死因,瘦身恰恰对症。

FuseQA 的分子起点比 Grill 硬:Grill 的价值是理论推演(「设计缺陷在代码未写时修复成本最低」),从无具体缺陷证明只有它能抓到;FuseQA 有 v0.9.0 这个四闸门全过仍逃逸的实证。**但起点高不等于不衰减。**纯内部重构的变更,用户可观察行为零变化,FuseQA 的正确产出就是「无新增用例」,分子为零。零发现的人工检查点消耗注意力却无产出,正是 Grill 的死法。

**这是本评估无法在文档阶段解决的经验命题。**缓解方向(未验证):检查点提问时先呈报事实(本次变更是否触及用户可观察入口),让「无新增用例」成为一个合法且低成本的回答,而非每次都要走完清单。是否足够,只有真实使用数据能回答。

**次要风险**:E2E 用例的维护成本落在各项目自身;`playwright` 等工具引入使脚手架的「零依赖」定位需重新表述(前期不分发工具,仅分发方法)。

## Capabilities

### New Capabilities

无。本变更是纯评估,不产生 spec 级行为。若日后裁决落地,届时新开变更并定义 capability(预期为 `fuseqa-checkpoint` 与 `fuseqa-skill-generation`,与 `apply-exit-checkpoint` / `fusereview-skill-generation` 同构)。

### Modified Capabilities

无。

## Impact

**本变更的产出**:仅本评估文档,以及已完成的三处叙述修正——`docs/design-philosophy.md`(转折 6 与 Grill 附录:死因从「重」修正为「产出低」,并补入「一拍的存废由性价比裁决,不由拍数裁决」)、`docs/blog-specfuse-workflow.md`(同步修正)。归档的 `remove-grill-phase/proposal.md` 未改动——档案不追溯修改,且其原文「过重,性价比不足」本就准确,被截断的是引用它的叙述文档。

**若日后落地,预期影响面**(仅供裁决参考,非本次实施):`src/templates/claude-md.ts`(新增第五拍协议段落)、新增 `src/templates/fuseqa-skill.ts`、`src/scaffolder.ts`(分发技能)、`src/templates/claude-settings.ts`(E2E 工具权限)、README 与 `docs/design-philosophy.md` 的流水线图。

## Verification strategy

评估类文档的验证是论证质量,而非命令输出。四条自检:

1. **事实可核**:v0.9.0 缺陷描述与 `tests/cli-entrypoint.test.ts`、commit `0e65ad5` 一致;测试分层计数可由 `find tests -name "*.test.ts"` 逐文件复算;工具可用性已实测(`playwright`/`bats`/`curl`/`jq` 有,`docker` 无)。
2. **重复问题被正面回答**:TDD 与 FuseQA 的边界给出机械可检的判据(约束一),而非「视角不同」这类无法验证的表述。
3. **否决理由可反驳**:四个备选方案各自记录了具体否决依据,可被逐条挑战。
4. **风险未被粉饰**:分子衰减风险明确标注为「文档阶段无法解决的经验命题」,缓解方向标注「未验证」。
