# Tasks — add-fusedoc-skill

严格 TDD:每项先写失败测试(RED),再写最小实现(GREEN),再重构。
每项完成前必须跑出验证命令的**真实输出**作为证据 —— 「应该能过」不构成完成。

标注 `[P]` 的任务彼此独立,可并行。

---

## 1. 静态资产落位

- [x] 1.1 建 `src/fusedoc/templates/`,从源技能拷入 3 份 reference 文件(`examples.md`、`probes.md`、`recall-batteries.md`),逐字保留。
  - 目录名必须是 `templates` —— build 脚本按字面 glob `src/*/templates`(见 design D1)。
  - 在该目录下留一行说明:为何目录名与目标项目的 `references/` 不一致。
  - 验证:`ls src/fusedoc/templates/ && npm run build && ls dist/fusedoc/templates/`
  - 完成判据:3 份文件出现在 `dist/fusedoc/templates/`。若为空,说明 glob 未命中,停下检查目录名。

- [x] 1.2 [P] 写测试:断言 3 份资产不含厂商/宿主专属词(spec: 无 vendor 标识 / 无 foreign host 路径)。
  - RED 先行:此测试应在 1.1 之前或之后立即为绿(源文件已干净),故**必须先故意插入一个假命中确认测试会红**,再移除。
  - 验证:`npx vitest run tests/templates/fusedoc-assets.test.ts`

---

## 2. 技能模板渲染

- [x] 2.1 写失败测试 `tests/templates/fusedoc-skill.test.ts` —— 覆盖 `fusedoc-skill-generation` 的前两条 Requirement:
  - 三条轴各有标题;vantage 轴含可解析性测试(current commit / 无 transcript)
  - 八类泄漏分类学齐全
  - 四条 overcorrection traps 齐全
  - scope 为必需输入,缺失则停止而非推断全仓库
  - 预置 `openspec/changes/`(决策记录)与 `openspec/changes/archive/`(冻结归档)
  - 自排除 `.claude/skills/fusedoc/`
  - 未覆盖维度必须报告,禁止声称未执行的检查通过
  - 无转义反引号(沿用 fuseqa 既有测法)
  - 验证:`npx vitest run tests/templates/fusedoc-skill.test.ts` —— 预期全红。

- [x] 2.2 实现 `src/templates/fusedoc-skill.ts`,导出无参 `composeFuseDocSkill(): string`。
  - 不接 `TemplateContext`(design D2:不为不存在的消费者预留参数)。
  - 内联 SKILL.md 全文,三处 `references/*.md` 相对链接保持原样。
  - 改写能力探测表的两行:决策记录与冻结归档由「探测」改为「已知」(design D3)。
  - 验证:`npx vitest run tests/templates/fusedoc-skill.test.ts` —— 转绿。

- [x] 2.3 写测试并实现:每个 `references/<name>.md` 链接都对应 1.1 中实际存在的文件。
  - 从渲染输出提取链接文件名,与 `src/fusedoc/templates/` 实际文件名比对。
  - 这条防的是链接与资产脱节 —— 改名任一侧都会红。
  - 验证:`npx vitest run tests/templates/fusedoc-skill.test.ts`

---

## 3. scaffolder 分发

- [x] 3.1 写失败测试(`tests/scaffolder.test.ts` 追加)—— 覆盖 `fusedoc-skill-generation` 的分发 Requirement:
  - 新项目获得 `SKILL.md` + `references/` 下 3 份文件
  - 已存在的 `SKILL.md` 内容不被覆盖
  - 无条件安装:`ProjectConfig` 无 FuseDoc 字段,不新增提问
  - 验证:`npx vitest run tests/scaffolder.test.ts` —— 预期红。

- [x] 3.2 实现 `src/scaffolder.ts` 的写入与拷贝。
  - 写 SKILL.md:沿用「读取 → 若不存在则写入」模式,与 fusereview/fuseqa 同构。
  - 拷 references:`copyTemplateDir(<import.meta.dirname>/fusedoc/templates, <target>/.claude/skills/fusedoc/references)`。
  - 在调用处注释:目录名差异的原因指向 build 脚本的字面 glob。
  - 不新增 try/catch —— 资产缺失属构建缺陷,应响亮失败(design 错误处理策略)。
  - 验证:`npx vitest run tests/scaffolder.test.ts` —— 转绿。

- [x] 3.3 写测试并实现安装面两处改动:文件清单加 `.claude/skills/fusedoc/` 行;spinner 文案纳入 fusedoc。
  - 不新增提示块、不新增黄色告警(proposal 已定)。
  - 验证:`npx vitest run tests/scaffolder.test.ts`

---

## 4. CLAUDE.md 接线

- [x] 4.1 写失败测试(`tests/templates/claude-md.test.ts` 追加)—— 覆盖 `fusedoc-integration` 全部 Requirement:
  - 标准框定:声明为跨流水线标准、按需调用
  - 拍数不变,FuseDoc 不是其中任何一拍
  - 技能位置 `.claude/skills/fusedoc/SKILL.md` 已说明,可手动调用
  - **负向断言:不含第三个检查点问题**;收尾序列仍只要求 FuseReview + FuseQA 两项决策上册
  - apply 完成不依赖任何 FuseDoc 决策
  - 三处引用存在(artifact 起草 / FuseReview / archive)
  - 引用是指针而非复述:不重复轴规则、分类学、文档层级表
  - 验证:`npx vitest run tests/templates/claude-md.test.ts` —— 预期红。

- [x] 4.2 实现 `src/templates/claude-md.ts` 的三处引用 + 标准声明段。
  - 每处一行短链接。FuseDoc 自身 §4 要求常驻指令「一到三行,链接到其归属」—— 违反它来集成它会很讽刺。
  - 负向断言检查检查点的**结构特征**(强制提问的存在),而非具体文案(design D5)。
  - 验证:`npx vitest run tests/templates/claude-md.test.ts` —— 转绿。

- [x] 4.3 写测试并确认:已有 `CLAUDE.md` 的项目走合并路径后,既含 FuseDoc 引用又保留用户原有内容。
  - 验证:`npx vitest run tests/templates/claude-md.test.ts`

---

## 5. E2E:构建产物经真实入口

- [x] 5.1 写 E2E 用例 `tests/e2e/fusedoc-skill-generation/install.test.ts`。
  - 契约参照 `tests/e2e/` 既有用例:spawn 真实子进程,**经软链 bin shim 调用**(npm/npx 的真实安装路径),不导入 `../src/`。
  - 断言 4 个文件真实落到目标项目。
  - traces-to:`fusedoc-skill-generation` 的「Skill reaches the target through the published artifact」Scenario。
  - 隔离:临时目录,不污染仓库与 `~`。
  - 验证:`npm run build && npx vitest run tests/e2e/fusedoc-skill-generation/`
  - 这条独立于单测存在的理由:单测调 `composeFuseDocSkill()`,证明不了 `dist/` 里的资产真的被打进去了 —— 1.1 若 glob 未命中,单测仍全绿。

---

## 6. 全量门

- [x] 6.1 全量测试:`npx vitest run` —— 全绿,粘贴原始输出。
- [x] 6.2 类型检查:`npx tsc --noEmit` —— 零错误。
- [x] 6.3 Lint:`npx eslint .` —— 零告警。
- [x] 6.4 人工确认渲染产物:实际 scaffold 一个临时项目,打开 `.claude/skills/fusedoc/SKILL.md`,确认三条轴可读、3 处链接在目标项目内可解析、两项预置能力表述正确。
  - 机械测试证明字符串存在,证明不了文档读得通。这一步是唯一的人眼关口。
