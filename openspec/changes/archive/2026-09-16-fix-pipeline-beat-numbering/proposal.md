## Why

流水线现在是五拍,但分发出去的四份描述说的是四拍、或给的序数差一位。`create-specfuse --help` 印的是 `Think → Do → FuseReview → Verify`——FuseQA 整拍不见;两个技能与生成的 `CLAUDE.md` 则把 FuseReview 称作第四拍、FuseQA 称作第五拍,而它们实际是第三、第四拍。

错位不是两处独立笔误。序数写在流水线**含 Grill 拍**的年代(Think/Do/Grill/FuseReview → 第四拍),`66d0c77` 移除 Grill 后没有重新编号,后续 `8b9e906` 又在旧基数上加了 FuseQA(→ 第五拍)。每次增删一拍都要人工重算所有序数,这个维护负担本身就是缺陷来源。

排除一个可能:这不是 spec 落后于实现。`fuseqa-skill-generation` 的 Scenario 要求 `description` 「naming the post-apply E2E verification beat」,**本就没有序数**——是实现背离了它自己的 spec。另三处(CLI 描述、FuseReview 的 frontmatter、`CLAUDE.md` 的拍次句)则完全没有 spec 覆盖,无人拦截。

## What Changes

- **移除全部拍次序数**,改为不依赖位置计数的定位表述(「the pipeline's post-apply code review」),同时把邻居列举补全为五拍。
- **`create-specfuse --help` 的描述补入 FuseQA**,与实际流水线一致。
- **新增跨面契约**:每个分发的流水线描述 MUST 点名全部五拍,且 MUST NOT 携带位置序数。
- **加守卫**:构建产物的 `--help` 输出与模板渲染产物都必须满足该契约。防住的正是本次的真实缺陷——CLI 漏掉整拍。

## Capabilities

### New Capabilities

- `pipeline-description-consistency`: 定义「分发面的流水线描述」的一致性契约——覆盖 CLI 帮助文本、生成的 `CLAUDE.md`、以及 FuseReview / FuseQA 两个技能的前言与正文;要求点名全部五拍、禁止位置序数,并规定守卫在何处校验(构建产物经真实入口 + 模板渲染产物)。

### Modified Capabilities

无。`fuseqa-skill-generation` 的既有 Scenario 已要求「naming the post-apply E2E verification beat」,无需序数;本变更是让实现回到它下面。其余三处此前没有 requirement,新约束归入上面的新 capability,不改动任何既有 capability 的行为契约。

## Impact

**修改**
- `src/index.ts` —— CLI 描述补入 FuseQA
- `src/templates/fusereview-skill.ts` —— frontmatter `description` 与正文首句去序数
- `src/templates/fuseqa-skill.ts` —— 同上
- `src/templates/claude-md.ts` —— `renderApplyFuseReview()` 与 `renderFuseQA()` 的开场句去序数

**派生件同步**
- `.claude/skills/fusereview/SKILL.md`、`.claude/skills/fuseqa/SKILL.md` —— 本仓库自用副本与渲染产物逐字相同,改模板后必须由渲染产物重新生成(改归属方 → 再生衍生物)。

**新增测试**
- `tests/cli-entrypoint.test.ts` —— 追加断言:构建产物的 `--help` 点名五拍(该文件已在用符号链接 shim 跑真实制品)
- 模板层断言 —— 渲染出的 `CLAUDE.md` 与两个技能均点名五拍且不含序数

**不影响**:`README.md` 的五拍表述本就正确,不动。流水线本身、拍次顺序、任何检查点行为均不变。npm `files` 白名单为 `["dist","README.md"]`,上述改动经 `dist/` 分发,无需改动。

## Non-goals

- **不做单一事实源重构**。五拍列表目前重复在四个地方(CLI 描述、`CLAUDE.md`、两个技能)。去序数消除了「编号错位」这一类漂移,但「某处漏写一拍」仍需守卫拦。把列表抽成共享常量是根治重复的做法,属独立重构,不在本变更内。
- **不新增或删除拍次**,不改变任何阶段的行为、检查点或顺序。
- **不动 README**。
- **不修 `repair-spec-corpus` 覆盖的规格树问题**(未同步 delta、Purpose 占位)。

## Trade-offs

- **去序数(chosen)vs 只改数字**:只改数字改动更小,但保留了「每次增删一拍都要人工重算所有序数」的维护负担——这正是本次漂移的成因。去序数的代价是失去「这是第几拍」的直接读数;补全五拍列举后,读者仍能定位所处位置。
- **轻量守卫(chosen)vs 单一事实源**:单一事实源从根上消除重复,但波及 CLI、CLAUDE.md、两个技能四个模块,且 README 是手写中文无法派生,属跨模块重构。本变更是文案修复,守卫只断言契约、不引入抽象。
- **新增跨面 capability(chosen)vs 分散进既有 capability**:分散意味着同一条契约在四个 capability 里各写一遍,且 CLI 描述本就无人管辖。集中一处使守卫有单一归属。

## Verification strategy

1. **守卫先行(RED)**:先写断言,再植入「CLI 描述删掉 FuseQA」与「把序数写回」两种回归,确认断言各自变红,随后还原。
2. **构建产物经真实入口**:`tests/cli-entrypoint.test.ts` 通过符号链接 shim 调用 `dist/index.js --help`,断言点名五拍。这是 npm/npx 的真实安装路径。
3. **模板渲染产物**:渲染 `CLAUDE.md`、FuseReview 技能、FuseQA 技能,断言三者均点名五拍且不含 `first/second/third/fourth/fifth … beat` 形式的序数。
4. **派生件一致性**:核对 `.claude/skills/{fusereview,fuseqa}/SKILL.md` 与渲染产物逐字相等——防止副本与模板脱节。
5. **全量门**:`npx vitest run` 全绿、`npx tsc --noEmit` 零错、`npx eslint .` 零告警。
