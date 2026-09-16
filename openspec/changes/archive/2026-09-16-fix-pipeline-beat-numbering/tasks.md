# Tasks — fix-pipeline-beat-numbering

严格 TDD:先写失败测试(RED),再写最小实现(GREEN)。
每项完成前必须跑出验证命令的**真实输出**作为证据 —— 「应该能过」不构成完成。

design.md 已按 schema 的条件性条款跳过(见 proposal 与本变更的收尾报告)。

---

## 1. 守卫先行

- [x] 1.1 在 `tests/cli-entrypoint.test.ts` 追加断言:构建产物的 `--help` 点名全部五拍。
  - 该文件已用符号链接 shim 跑真实制品,复用其 `run()` 辅助函数,不新建进程调用。
  - 验证:`npm run build && npx vitest run tests/cli-entrypoint.test.ts` —— 预期**红**(CLI 描述现为四拍)。

- [x] 1.2 新建 `tests/templates/pipeline-description.test.ts`,断言三份渲染产物均点名五拍且不含位置序数。
  - 覆盖 `composeCLAUDEmd()`、`composeFuseReviewSkill()`、`composeFuseQASkill()`。
  - 序数断言用 `/(first|second|third|fourth|fifth|sixth)\s+(pipeline\s+)?beat/i` 一类模式,并**先对已知阳性串验证该模式确实能命中**——零命中在没见过它命中之前不构成证据。
  - 同时断言两个技能的 frontmatter `description` 以「做什么」而非位置标识该拍。
  - 验证:`npx vitest run tests/templates/pipeline-description.test.ts` —— 预期**红**。

- [x] 1.3 新建 `tests/skills/installed-skills.test.ts`,断言 `.claude/skills/{fusereview,fuseqa}/SKILL.md` 与对应渲染产物逐字相等。
  - 防的是「改了模板忘了再生副本」,以及反向的「手改了副本」。
  - 验证:`npx vitest run tests/skills/installed-skills.test.ts` —— 预期**绿**(当前两份尚与产物一致),故须按 1.2 的方式先植入偏差确认会红,再还原。

## 2. 去序数并补全五拍

- [x] 2.1 [P] `src/templates/fusereview-skill.ts` —— 去序数,正文首句补入 FuseQA 使列举完整。
  - frontmatter `description` 改为按职责标识(如 `the pipeline's post-apply code review`),不带位置序数。
  - 验证:`npx vitest run tests/templates/fusereview-skill.test.ts tests/templates/pipeline-description.test.ts`

- [x] 2.2 [P] `src/templates/fuseqa-skill.ts` —— 同上处理。
  - 注意:其 spec Scenario 本就要求「naming the post-apply E2E verification beat」,本项是让实现回到该要求之下。
  - 验证:`npx vitest run tests/templates/fuseqa-skill.test.ts tests/templates/pipeline-description.test.ts`

- [x] 2.3 `src/templates/claude-md.ts` —— `renderApplyFuseReview()` 与 `renderFuseQA()` 的开场句去序数并补全五拍列举。
  - 两句与 2.1/2.2 的正文首句高度相似但服务于不同产物(生成的 CLAUDE.md vs 独立技能),本次不去重——去重是独立重构,已列为 Non-goal。
  - 验证:`npx vitest run tests/templates/claude-md.test.ts tests/templates/pipeline-description.test.ts`

- [x] 2.4 `src/index.ts` —— CLI 描述补入 FuseQA。
  - 验证:`npm run build && npx vitest run tests/cli-entrypoint.test.ts` —— 预期转绿。

## 3. 派生件同步

- [x] 3.1 由渲染产物重新生成 `.claude/skills/fusereview/SKILL.md` 与 `.claude/skills/fuseqa/SKILL.md`。
  - **改归属方 → 再生衍生物**,不得手改副本。
  - 生成方式:用 `dist/templates/*.js` 的 `composeFuseReviewSkill()` / `composeFuseQASkill()` 输出直接覆写对应文件。
  - 验证:`npx vitest run tests/skills/installed-skills.test.ts` —— 转绿。

## 4. 回归自证

- [x] 4.1 植入两种回归,确认守卫各自变红,随后还原:
  - (a) CLI 描述删掉 FuseQA → 1.1 应变红
  - (b) 把 `fourth beat` 写回 `renderApplyFuseReview()` → 1.2 应变红
  - 验证:两次 `npx vitest run`,记录各自的失败输出;还原后转绿。

## 5. 全量门

- [x] 5.1 `npx vitest run` —— 全绿,粘贴原始输出。
- [x] 5.2 `npx tsc --noEmit` —— 零错误。
- [x] 5.3 `npx eslint .` —— 零告警。
- [x] 5.4 人工确认:构建产物 `--help` 实际打印五拍;渲染出的 CLAUDE.md 两个片段读得通(机械断言证明字符串存在,证明不了句子成立)。
