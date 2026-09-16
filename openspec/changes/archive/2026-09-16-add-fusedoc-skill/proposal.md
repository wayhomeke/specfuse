## Why

SpecFuse 生成的流水线对散文没有任何标准。三个已有技能各管一段代码质量——FuseReview 读 diff、FuseQA 跑真实入口、Verify 做机械对照——但 proposal、design、specs、README、注释、诊断信息这些**散文**产物,既无质量要求也无放置规则。结果是两类缺陷无人拦截:一是泄漏的推理轨迹(引用只有当时会话能看到的东西、叙述变更而非状态、与已离场的评审者争辩),二是事实放错了层级(该在决策记录里的 rationale 落在 README、该由生成器产出的清单被手写)。

本项目自身就是活证据:上一个变更清理的 `dsh-code-review` 泄露,以及 `.claude/skills/fusereview/SKILL.md` 里那段模板早已不再生成的 `Stack-adaptive checks`,都属于 FuseDoc 第 3 轴(vantage correction)与第 4 轴(structural placement)本应拦住的缺陷。

## What Changes

- **新增 FuseDoc 技能分发**:`composeFuseDocSkill()` 渲染 SKILL.md,连同 3 份 reference 文件(`examples.md` 校准示例、`probes.md` 能力探测、`recall-batteries.md` 搜索模式库)写入目标项目 `.claude/skills/fusedoc/`。
- **FuseDoc 不是流水线的一拍**,而是贯穿全链路的文档能力标准:无检查点、无 MUST 提问、不进 apply 收尾序列,由产出散文的各拍按需调用。
- **`CLAUDE.md` 在三处点名 FuseDoc**,每处一行短链接而非复述规则:artifact 起草(proposal/design/specs 写散文)、FuseReview 的 `[missing-detection]` 检查项、archive(specs 同步)。
- **预置 SpecFuse 结构性具备的两项宿主能力**:决策记录约定指向 `openspec/changes/<name>/`,冻结归档约定指向 `openspec/changes/archive/**`。二者若交给通用探测,技能会向用户索要脚手架本已保证的东西。
- **技能自排除**:`.claude/skills/fusedoc/**` 不接受自身审计——其 `examples.md` 故意引用劣质文本作为校准材料。
- **安装面仅两处**:文件清单加一行 `.claude/skills/fusedoc/`,spinner 文案纳入 fusedoc。不新增提示块、不新增告警。

## Capabilities

### New Capabilities

- `fusedoc-skill-generation`: FuseDoc 技能的渲染与分发契约——三条轴的实质内容、3 份 reference 文件随包分发、SpecFuse 两项能力预置与自排除、`scaffold()` 的不覆盖行为。
- `fusedoc-integration`: FuseDoc 在生成的 `CLAUDE.md` 中的接线契约——作为全链路标准而非一拍被三处引用,且明确不产生检查点。

### Modified Capabilities

无。`apply-exit-checkpoint` 与 `fuseqa-checkpoint` 定义的两个检查点问题不受影响:FuseDoc 不新增第三个检查点,收尾序列仍是 FuseReview → FuseQA 两问。

## Impact

**新增**
- `src/templates/fusedoc-skill.ts` —— `composeFuseDocSkill()`
- `src/fusedoc/templates/{examples,probes,recall-batteries}.md` —— 静态资产。目录名必须是 `templates`:构建脚本按字面 glob `src/*/templates`,故落到目标项目时由 `copyTemplateDir` 改名为 `references/`,构建脚本零改动。
- `tests/templates/fusedoc-skill.test.ts`、`tests/e2e/fusedoc-skill-generation/`

**修改**
- `src/scaffolder.ts` —— 写入技能、拷贝 references、文件清单与 spinner 文案
- `src/templates/claude-md.ts` —— 三处引用
- `tests/scaffolder.test.ts`、`tests/templates/claude-md.test.ts`

**不影响**:`ProjectConfig` 不新增字段(无需提问,无条件安装);`src/stacks/` 已移除,技能与 stack 无关;npm `files` 白名单为 `["dist","README.md"]`,资产经 `dist/` 分发,无需改动。

## Non-goals

- **不新增流水线拍次**。流水线仍是 Think → Do → FuseReview → FuseQA → Verify 五拍。
- **不设检查点、不设 MUST 提问**、不进 apply 收尾序列。这是「标准」与「拍」的根本区别。
- **不改写 FuseDoc 的三条轴**。源技能已与宿主无关(品牌词零命中),仅做 SpecFuse 侧接线。
- **不回溯审计 SpecFuse 自身现有散文**。本变更交付能力,不交付一次审计。
- **不修复 `.claude/skills/fusereview/SKILL.md` 的 `Stack-adaptive` 漂移**。同属 `fa0b630` 收尾遗漏,与本变更无关。
- **不做多语言配对**。FuseDoc 的 translation pairing 能力保持未探测。

## Trade-offs

- **全链路标准(chosen)vs 第六拍 + 检查点**:做成拍需要第三个 MUST 提问,而收尾序列已有两问;散文产出散布在每一拍,单一闸门拦不住它。代价是没有强制力——靠 `CLAUDE.md` 引用与 FuseReview 的 `[missing-detection]` 间接施压。
- **预置两项能力(chosen)vs 纯通用探测**:纯探测让技能向用户索要脚手架已保证的东西(决策记录目的地),体验退化。代价是分发出的技能不再与源文件逐字节相同,上游更新需手工合并而非覆盖拷贝。
- **完整搬 3 份 references(chosen)vs 只搬 SKILL.md 内联链接**:内联化把体积从 62KB 压到 28KB,但 `examples.md` 的 423 行校准示例是判断「过度删减 vs 平衡」的唯一标尺,`recall-batteries.md` 的搜索模式库无法压缩成摘要。代价是目标项目多 62KB,与 `design-md` 的 17 份 YAML 模板量级相当。
- **`src/fusedoc/templates/` → `references/`(chosen)vs 改构建脚本支持任意资产目录名**:改脚本更直观,但会触及所有技能的分发路径,风险远超收益。代价是仓库内目录名与目标项目不一致,需注释说明。

## Verification strategy

1. **模板单测**:三条轴均渲染且各带实质内容;3 处 `references/*.md` 链接存在;两项预置能力与自排除出现在输出中;无转义反引号。
2. **`CLAUDE.md` 单测**:三处引用存在;断言输出**不含**第三个检查点问题——这是「不是一拍」的机械证据。
3. **scaffolder 单测**:SKILL.md 与 3 份 reference 落到 `.claude/skills/fusedoc/`;已存在的用户自写文件不被覆盖。
4. **E2E**:经软链 bin shim 调用构建产物,断言 4 个文件真实落地——与 `fuseqa` 同一测法,覆盖 npm/npx 的真实安装路径。
5. **全量门**:`npx vitest run` 全绿、`npx tsc --noEmit` 零错、`npx eslint .` 零告警。
