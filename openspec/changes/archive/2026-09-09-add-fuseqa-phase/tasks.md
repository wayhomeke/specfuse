## 0. 基线

- [x] 0.1 记录 FuseReview 基线:`git rev-parse HEAD` 写入变更状态,确认起始套件全绿。验证:`git rev-parse HEAD` 与 `npx vitest run`(272 全绿)。

## 1. 先锁住既有分发行为(重构前的安全网)

`copyTemplateDir()` 会替换 design-md 现行的 `.yaml` 硬过滤拷贝(design 决策 2)。重构前必须把现有行为断言下来,否则回归无从发现。

- [x] 1.1 在 `tests/scaffolder.test.ts` 补断言:scaffold 后 `.claude/skills/design-md/templates/` 含 17 份 `.yaml`(16 archetype + `_schema.yaml`),且 `_schema.yaml` 在列。RED 不必——这是现有行为的补测。验证:`npx vitest run tests/scaffolder.test.ts`。
- [x] 1.2 补断言:已存在 `.claude/skills/design-md/SKILL.md` 时内容不被覆盖(现有行为,确认已覆盖;若无则补)。验证:同上。

*Blocks: 第 5 节。*

## 2. FuseQA 协议进 CLAUDE.md

- [x] 2.1 RED:在 `tests/templates/claude-md.test.ts` 新增 `renderFuseQA()` 的断言——MUST 级提问、禁止静默前进、独立于 FuseReview 答案、禁止合并提问。此时函数不存在,测试应编译失败或断言失败。验证:`npx vitest run tests/templates/claude-md.test.ts`(预期红)。
- [x] 2.2 GREEN:在 `src/templates/claude-md.ts` 新增并导出 `renderFuseQA()`,写入上述四项措辞。验证:同上转绿。
- [x] 2.3 RED→GREEN:补 `renderFuseQA()` 的余下断言并实现——事实呈报三项(是否触及用户可观察入口 / 涉及 capability / 现有 e2e 用例数)、无自动阈值、职责边界(不含回归执行、无独立查红阶段)、技能路径 `.claude/skills/fuseqa/SKILL.md`、保留手动调用。验证:`npx vitest run tests/templates/claude-md.test.ts`。
- [x] 2.4 RED→GREEN:按归因分级的四条断言与实现——实现缺陷 Blocking(红用例即失败测试,直接修实现)、spec 漏洞默认 Suggestion 可升级、假红为用例债不入分级(须记录代码为何正确+证据)、归因超时间盒降级且不得挂起收尾。验证:同上。
- [x] 2.5 RED→GREEN:用例资产三条断言与实现——落 `tests/e2e/<capability>/` 且与 `openspec/specs/<capability>/` 同名、剔除必须留理由(否则删红用例与掩盖缺陷无从区分)、新增须记 traces-to。验证:同上。
- [x] 2.6 RED→GREEN:`renderVerifyPhase()` 增补「全量测试即 E2E 回归门禁,该门禁不得跳过」。验证:同上。
- [x] 2.7 RED→GREEN:`renderApplyFuseReview()` 增补「拒绝 FuseReview 不终止 apply 退出序列,FuseQA 仍必问」。验证:同上。
- [x] 2.8 RED→GREEN:`composeCLAUDEmd()` 装配顺序断言——FuseQA 段落在 FuseReview 之后、Verify 之前(用三者在输出字符串中的 index 比较,而非仅断言存在)。验证:同上。
- [x] 2.9 RED→GREEN:收尾报告双记录断言与实现——报告须含 FuseReview 与 FuseQA 两条决定,缺任一条即 apply 未完成且不得进 `/opsx:verify`。验证:同上。

*Blocked by: 无(纯新增 + 既有函数增补)。*

## 3. FuseQA 技能模板

- [x] 3.1 RED:新建 `tests/templates/fuseqa-skill.test.ts`,断言 frontmatter `name: fuseqa` 且 `description` 含流程触发语 + 至少两条口语触发语。验证:`npx vitest run tests/templates/fuseqa-skill.test.ts`(预期红)。
- [x] 3.2 GREEN:新建 `src/templates/fuseqa-skill.ts` 导出 `composeFuseQASkill(ctx)`,写 frontmatter 与技能开篇(含「只补本次用例,不执行既有回归套件」)。验证:同上转绿。
- [x] 3.3 RED→GREEN:产物三问决策树——如何获得 / 如何触发 / 触发后什么外部可观察;触发问含「被别的程序读取」分支;无可执行入口的产物经真实消费者验证;陌生形态须按三问推导并把结论写入 `entry` 字段而非声明不可测。验证:同上。
- [x] 3.4 RED→GREEN:用例契约——禁止 `import ../src/`(并说明此为 grep 可查)、被测物为构建/安装产物、五字段(artifact/entry/isolation/observable/traces-to)、引用 bin shim 入口守卫缺陷作为「源码过而制品败」的实例。验证:同上。
- [x] 3.5 RED→GREEN:入口配方五类——CLI(真子进程+argv,必须覆盖 symlink bin shim 通路)、API(真端口 HTTP,禁直调 handler)、WebUI(真浏览器,禁断言已挂载组件 props)、库(按 `package.json` `exports` 从构建产物导入)、数据产物(交真实消费者);并声明「定契约不定工具,用项目现有测试栈,勿引入第二个框架」。验证:同上。
- [x] 3.6 RED→GREEN:浏览器用例环境自检——检测不到浏览器二进制则 skip 而非 fail、skip 须打印原因可见、不可执行的用例不得让回归门禁变红。验证:同上。
- [x] 3.7 RED→GREEN:派生清单——等价类+边界值、状态迁移含重复执行幂等、并发与竞态、错误注入、中断后重入;并要求读 proposal 的 Non-goals 作为范围外边界。验证:同上。

*Blocked by: 无。可与第 2 节并行(不同文件)。*

## 4. 四份模板文件

- [x] 4.1 RED:新建 `tests/fuseqa/templates.test.ts`,断言 `src/fuseqa/templates/` 存在四份文件且文件名为 `_case-schema.yaml`、`derivation-checklist.md`、`entry-recipes.md`、`ledger.md`。验证:`npx vitest run tests/fuseqa/templates.test.ts`(预期红)。
- [x] 4.2 GREEN:创建 `src/fuseqa/templates/_case-schema.yaml`——五字段结构契约,`entry` 字段须带「不得为函数名」约束,`artifact` 须带「不得为源码路径」约束。参照 `src/design-md/templates/_schema.yaml` 的写法(规定字段不规定实现)。验证:同上转绿 + YAML 可解析断言。
- [x] 4.3 GREEN:创建 `derivation-checklist.md`、`entry-recipes.md`、`ledger.md`。`entry-recipes.md` 须含五类配方与 bin shim / `exports` 两个具体条目;`ledger.md` 须含新增/修正/剔除三类生命周期条目且剔除栏含理由字段。验证:`npx vitest run tests/fuseqa/templates.test.ts` + grep 校验关键条目存在。
- [x] 4.4 断言模板自身框架中立:grep 四份模板,不得出现 `vitest`/`bats`/`playwright`/`jest` 作为**规定**(出现在「按项目现有栈选择」的举例语境中可接受,故断言方式为:不得出现 MUST/必须 + 框架名的组合)。验证:`npx vitest run tests/fuseqa/templates.test.ts`。

*Blocked by: 无。*

## 5. 分发

- [x] 5.1 RED:在 `tests/scaffolder.test.ts` 断言 scaffold 后 `.claude/skills/fuseqa/SKILL.md` 存在且 `.claude/skills/fuseqa/templates/` 含四份文件。验证:`npx vitest run tests/scaffolder.test.ts`(预期红)。
- [x] 5.2 GREEN:在 `src/scaffolder.ts` 抽内部 `copyTemplateDir(srcDir, destDir)`(拷贝目录下全部文件,不按扩展名过滤),先改 design-md 的拷贝改用它。验证:`npx vitest run tests/scaffolder.test.ts`——1.1 的 17 份 `.yaml` 断言必须仍绿(重构无回归)。
- [x] 5.3 GREEN:写 `.claude/skills/fuseqa/SKILL.md`(存在则跳过,与 design-md/fusereview 同法)+ 用 `copyTemplateDir` 拷贝 fuseqa 模板。验证:5.1 转绿。
- [x] 5.4 RED→GREEN:模板源目录缺失时拷贝抛错且报明路径(design 的错误处理策略:此项致命而非 warn)。验证:`npx vitest run tests/scaffolder.test.ts`。
- [x] 5.5 RED→GREEN:已存在 `.claude/skills/fuseqa/SKILL.md` 自定义内容时不被覆盖。验证:同上。
- [x] 5.6 `src/templates/claude-settings.ts` 补 E2E 执行所需权限,并在 `tests/templates/templates.test.ts` 断言。验证:`npx vitest run tests/templates/templates.test.ts`。

*Blocked by: 第 1 节(安全网)、第 3 节(技能函数)、第 4 节(模板文件)。*

## 6. 构建脚本

- [x] 6.1 改 `package.json` 的 `build`:对 `src/*/templates` 统一拷贝至 `dist/`,替代硬编码单条 `cp -r src/design-md/templates`(design 决策 5)。验证:`npm run build && ls dist/design-md/templates/ && ls dist/fuseqa/templates/`——两处都必须有内容,**只看构建退出码不算验证**。
- [x] 6.2 `npm pack --dry-run --json` 断言四份 fuseqa 模板进入 tarball 文件清单。验证:命令输出中 `fuseqa/templates` 计数为 4。

*Blocked by: 第 4 节。*

## 7. 全量验证

- [x] 7.1 `npx tsc --noEmit` 干净。
- [x] 7.2 `npx vitest run` 全量绿,粘贴原始输出。
- [x] 7.3 端到端脚手架:`node dist/index.js <tmpdir> --yes`,断言 `.claude/skills/fuseqa/SKILL.md` 与四份模板存在;`CLAUDE.md` 含 FuseQA 段落且其位置在 FuseReview 之后、Verify 之前(实测生成文件的 index 顺序,非模板单测)。完毕清理 tmpdir,`git status --short` 无残留。
- [x] 7.4 既有项目合并路径:对已含 FUSION 标记的 `CLAUDE.md` 与已含自定义 `fuseqa/SKILL.md` 的目录重跑,断言段落被替换而技能文件保留。
- [x] 7.5 本仓库自举:把 FuseQA 段落同步进本项目根 `CLAUDE.md`(与模板一致),使方法论能吃自己。验证:`grep -n "FuseQA" CLAUDE.md` 且顺序正确。
- [x] 7.6 FuseQA 拍自验:为本变更补至少一条 E2E 用例落在 `tests/e2e/scaffold-tool-boundary/`,按四份模板的契约编写(测 `dist/` 制品、经真实入口、五字段齐备)。这是 FuseQA 的第一个真实产出,也是模板可用性的实测。验证:`npx vitest run tests/e2e/`。
- [x] 7.7 FuseReview 检查点:呈报事实(任务数、是否 subagent、涉及模块),询问是否评审 `基线..HEAD`,记录决定。
- [x] 7.8 FuseQA 检查点:呈报事实(是否触及用户可观察入口、涉及 capability、现有 e2e 用例数),询问是否执行,记录决定。**收尾报告须含 7.7 与 7.8 两条决定**——缺一条即本变更未完成。

*Blocked by: 第 1-6 节。*
