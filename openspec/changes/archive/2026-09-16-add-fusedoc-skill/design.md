## Context

动机见 `proposal.md` — Why;行为契约见 `specs/`。此处只记录塑造实现路径的现状与约束。

**三个已有技能建立了分发范式。** `design-md`、`fusereview`、`fuseqa` 各有一个 `src/templates/<name>-skill.ts` 导出 `compose*Skill()`,由 `scaffolder.ts` 依「读取 → 若不存在则写入」的模式落盘。其中两个还带静态资产:`src/design-md/templates/`(17 份 YAML)与 `src/fuseqa/templates/`(4 份),经 `copyTemplateDir` 拷到目标项目。

**构建脚本按字面 glob 资产目录名。** `package.json` 的 build:

```
for d in src/*/templates; do [ -d "$d" ] || continue; m=$(dirname "$d");
  mkdir -p "dist/${m#src/}"; mkdir -p "dist/${m#src/}/templates" && cp -r "$d/." "dist/${m#src/}/templates/"; done
```

只匹配 `src/*/templates`。名为 `references` 的目录不会进 `dist/`,因而不会进 npm 包(`files: ["dist","README.md"]`)。

**源技能已与宿主无关。** 4 个文件对完整厂商/宿主词表(deepseek、dsh、cordis、pnpm、`packages/`、`.agents/`)零命中。它以能力探测替代硬编码假设:7 项宿主能力各有「在哪找、缺失时的通用兜底、兜底无法证明什么」。这与 FuseReview 移植时的处境相反 —— 后者假设了一层文档垫层,泄露了来源名。

**两处 capability 拆分先例。** `fuseqa-skill-generation` 只管模板渲染与分发;`CLAUDE.md` 里的检查点规则归 `fuseqa-checkpoint`。本变更照此拆分。

## Goals / Non-Goals

**Goals:**

- 让 FuseDoc 的三条轴在目标项目内**自包含可用** —— 不依赖网络、不指向 SpecFuse 仓库内的文件。
- 把「不是一拍」变成**机械可测的断言**,而非仅写在文档里的说法。
- 复用现有分发范式,使新增技能不引入第四种安装路径。

**Non-Goals(设计层面,proposal 的范围之外):**

- 不改 `package.json` 的 build 脚本。
- 不引入配置项让用户选择是否安装 FuseDoc。
- 不为 FuseDoc 建立独立的能力探测代码 —— 探测由技能在运行时自行执行,SpecFuse 只预置两项已知结论。

## Decisions

### D1. 资产目录用 `templates` 命名,落盘时改名为 `references`

`src/fusedoc/templates/{examples,probes,recall-batteries}.md` → `.claude/skills/fusedoc/references/`。

`copyTemplateDir(src, dest)` 的两个实参本就独立,改名零成本:

```ts
await copyTemplateDir(
  path.join(import.meta.dirname, 'fusedoc', 'templates'),
  path.join(targetDir, '.claude', 'skills', 'fusedoc', 'references'),
);
```

**备选:改 build 脚本支持任意资产目录名。** 更直观,但那行 `for` 循环服务全部技能,改它会同时改变 `design-md` 与 `fuseqa` 的分发路径 —— 风险远超收益。

**代价:** 仓库内目录名与目标项目不一致,需在 `src/fusedoc/templates/` 下留一行说明,否则后来者会以为是笔误。

### D2. SKILL.md 全文内联,不做模板插值

`composeFuseDocSkill()` 不接收 `TemplateContext`,签名为无参。理由:`fa0b630` 移除 stack 选择后,插值来源已消失;`composeFuseReviewSkill(_ctx)` 现在收一个用不上的参数,而 `.claude/skills/fusereview/SKILL.md` 里那段 `Stack-adaptive checks` 正是当年插值留下的冻结快照 —— 已装文件与模板漂移的活样本。新技能不重复这个形状。

**备选:接 `ctx` 以备将来。** 被否决 —— 为不存在的消费者预留参数,正是 FuseReview 的 `[scope-fit]` 检查所指的投机性通用化。

### D3. 两项宿主能力写为已知,而非交给探测

源技能规定:无决策记录约定 → 升级无处可去 → **要求用户指定一个**;无冻结归档约定 → 不做归档排除。但 SpecFuse 项目在结构上必然具备:

| 能力 | SpecFuse 的结构性保证 |
|---|---|
| 决策记录约定 | `openspec/changes/<name>/` —— proposal 与 design 承载 rationale |
| 冻结归档约定 | `openspec/changes/archive/**` —— 已归档变更不再维护 |

不预置的话,技能会在每次升级时向用户索要脚手架本已保证的目的地。

**代价(已在 proposal 记录):** 分发出的技能不再与源文件逐字节相同,上游更新需手工合并。这是脚手架适配职责的固有成本,不是缺陷。

### D4. 自排除是必需项,不是优化

`references/examples.md` 故意引用劣质文本作为「过度删减 vs 平衡」的对照。若技能审计自身目录,那些示例会被当作真实缺陷报出。源技能在 §0 exclusions 与 recall-batteries 的 invocation rules 两处都写明了这一点,渲染输出必须保留。

### D5. 「不是一拍」的机械证据放在 `CLAUDE.md` 单测

断言生成的 `CLAUDE.md` **不含**第三个检查点问题。这是负向断言 —— 比正向断言脆弱,但它守的正是最容易被后续变更破坏的性质:某次改动顺手给 FuseDoc 加个检查点,而所有正向测试仍然全绿。

**备选:只写文档不测。** 被否决 —— 「不是一拍」是本变更的核心设计约束,无测试等于无约束。

### 公开 API 面

新增导出仅一个:

```ts
// src/templates/fusedoc-skill.ts
export function composeFuseDocSkill(): string
```

`scaffolder.ts` 内部新增两段调用(写 SKILL.md、拷 references),不导出新符号。`ProjectConfig` 不新增字段 —— 无条件安装,无需提问。

### 依赖流向

```
src/index.ts
  └── src/scaffolder.ts
        ├── src/templates/fusedoc-skill.ts   (新增,无依赖)
        ├── src/templates/claude-md.ts        (改:三处引用)
        └── copyTemplateDir → src/fusedoc/templates/  (新增静态资产)
```

单向,无环。`fusedoc-skill.ts` 不导入任何模块(纯字符串返回),与 `design-md-skill.ts` 同构。

### 错误处理策略

沿用 scaffolder 现有约定,不引入新机制:

- **技能文件已存在** → 跳过写入,保留用户内容(spec 要求)。非错误。
- **`copyTemplateDir` 失败** → 与 `design-md`/`fuseqa` 同路径,由现有异常传播处理。不新增 try/catch —— 资产缺失属构建缺陷,应当响亮失败,不该静默降级成半装状态。
- **`CLAUDE.md` 合并** → 走既有 `mergeFusionIntoCLAUDEmd`,不新增分支。

## Risks / Trade-offs

- **[资产目录名不一致导致后来者误改]** → 在 `src/fusedoc/templates/` 放一行说明该目录为何不叫 `references`,并在 scaffolder 调用处注释指向 build 脚本的字面 glob。
- **[62KB 体积进入每个脚手架项目]** → 与 `design-md` 的 17 份 YAML 同量级,已有先例;且 `examples.md` 的 423 行是判断删减尺度的唯一标尺,压缩即丧失校准能力。接受。
- **[上游技能更新后需手工合并]** → D3 的固有代价。缓解:预置内容集中在一处(能力声明段),不散布全文,合并时冲突面最小。
- **[负向断言随文案改写而失效]** → D5 的已知弱点。缓解:断言检查点问题的**结构特征**(强制提问的存在),而非某句具体文案。
- **[技能未被调用而形同虚设]** → 全链路标准无强制力,这是「不是一拍」的必然结果(proposal Trade-offs 已记录)。缓解:FuseReview 的 `[missing-detection]` 检查项会在 diff 改了行为却没改文档时报出,提供间接压力。

## Migration Plan

无数据迁移、无破坏性变更。新增技能对既有项目零影响:

- **新项目**:scaffold 时获得完整 4 个文件。
- **既有项目重跑 scaffold**:`.claude/skills/fusedoc/` 不存在则新增;已存在的 `SKILL.md` 不被覆盖;`CLAUDE.md` 走合并路径保留用户内容。
- **回滚**:删除新增文件 + 撤销 `scaffolder.ts` 与 `claude-md.ts` 的改动即可。无持久化状态、无外部副作用。
