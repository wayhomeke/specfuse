## 0. 基线

- [x] 0.1 记录 FuseReview 基线:`git rev-parse HEAD`,并记录起始状态。验证:`git rev-parse HEAD` 与下列原始输出。

  **基线 HEAD:** `aa4993569b85bfe4e74d8d5a2707e959172e1f8f`（`aa49935 chore: stop shipping the retired bin shim`）；变更前工作区仅有本变更目录未跟踪。

  **起始事实(实测):**
  ```
  stack 命中     : 14 行 / 16 处（不分大小写）；仅小写为 8 行 / 9 处
                   差集是 6 行只含大写 `Stack` 的行,含 `## Tech Stack`、
                   `Stack-specific permissions:`、以及最该删的 `## Stack Profiles Quick Reference`
  内联 FUSION 块 : 1 处（`### Phase 2: Apply / Implement`）
  {{...}} 占位符 : 4 行 / 5 处（第 93 行同时含 test_cmd 与 lint_cmd）
  总行数         : 316
  ```
  基线套件:带 `HOME` 覆盖的 `vitest run` → **17 files / 361 tests passed**；真实 `~/.claude.json` 临时条目 0。

  **两条记录以免重犯:**
  1. 本文件的行数/处数口径写过两次错(先 `stack`、后占位符):`rg -c` 数的是**行**,`rg -o | wc -l` 数的是**处**。凡断言"计数为 0"处,口径必须写明。
  2. 基线时真实 `~/.claude.json` 为 **5** 条(此前 4 条)。多出的是 `/mnt/e/dl/deepseek-harness` —— **真实目录,非测试临时路径**,mtime 早于本次套件启动,非本轮产生。无临时条目,隔离有效。记录在册以备日后对照。

## 1. RED —— 守护先写

守护是本变更**唯一**的机械保障:技能是文档,无法"运行"它,能断言的只有它指向的东西是否还在、副本是否还缺席。

- [x] 1.1 新建 `tests/skills/init-specfuse-skill.test.ts`,断言 `skills/init-specfuse/SKILL.md` 中 `stack` 出现 **0** 次(**必须不分大小写**,见 0.1 的计数口径)、且不含 `### Phase 2: Apply / Implement`。验证:`npx vitest run tests/skills/init-specfuse-skill.test.ts`,粘贴原始输出证明**红**(当前 16 处 / 1 处)。

  *写这条时踩到的坑,记录以免重犯:* 初稿的断言是大小写敏感的,那样**6 行只含大写 `Stack` 的行会全部漏过** —— 包括 `## Stack Profiles Quick Reference`,即最该删的那一段。守护会"绿着"放过它。这与上一变更里被前文命中的空洞断言同类:断言红不起来,就等于没守。
- [x] 1.2 补指针断言:从 `SKILL.md` 中解析出被点名的 `src/...` 路径与符号名,断言每个路径存在、且每个符号确实出现在其所归属的文件里。验证:同上,当前必红 —— 技能尚未点名这些源。
- [x] 1.3 补运行时自述断言:断言技能包含 `openspec init --help` 字样(即"工具 id 由运行时自述取得"),且**不含**被粘贴的平台清单 —— 以若干具辨识度的 OpenSpec 工具 id(`amazon-q`、`codeartsagent`、`minimax-code`、`oh-my-pi`、`roocode`)作代理,它们只会因清单被抄入而出现。验证:同上,仍红。

  *如实记录(经 FuseReview 修正):* "不含清单"是**代理断言**,且它只挡"整份 help 输出被粘进来"这一种走形。初稿在此写的"正向的 `openspec init --help` 断言承担主要守备"**不成立** —— 正向断言只问"指令在不在于文中",它对"文中另有一份清单"同样红不起来;手写一份缩写清单(`claude, cursor, gemini`)会同时通过两条。**本项没有任何机械保障,靠的是评审。** 已在测试注释里同步改正。

  **第 1 节实测汇总(RED,12 条断言 4 红 8 绿):**
  ```
  × contains no reference to the removed technology-stack layer
    → expected [ …(16) ] to have a length of +0 but got 16
  × carries no inlined copy of the methodology
    → expected '---\nname: init-specfuse…' not to contain '### Phase 2: Apply / Implement'
  × names every canonical source it depends on
    → expected [ { …(2) }, … ] to deeply equal []          ← 7 个源全未点名
  × tells the agent to read the tool id from openspec init --help
  ✓ does not carry a pasted copy of the supported-tools list
  ✓ ×7  'composeCLAUDEmd' / 'composeGitignore' / 'composeClaudeSettings' /
         'composeOpenspecConfig' / 'mergeFusionIntoCLAUDEmd' / 'mergeGitignore' /
         'mergeClaudeSettings' still live in their files
  Tests  4 failed | 8 passed (12)
  ```
  **结构说明:** 7 条 `still lives in` 现在就是绿的 —— 它们不是待转绿的断言,而是替代副本后唯一残留漂移面的守卫。真正待转绿的是前 4 条。

  > ⚠️ **本节当时的判断后来被推翻,不要照此理解:** 上面这句与同段"一旦改名或搬家即转红"的说法**都是错的**。第 3 节的反例先证明整组断言当时**什么都没守**(a);FuseReview 的 B2 再证明其"搬家"一半另有绕过路径(b);两处均已修复,见 §3 与 §5.2。原文保留以留痕。

*Blocks: 第 2 节。*

## 2. GREEN —— 重写技能

- [x] 2.1 把方法论来源改为**指针**:点名 `composeCLAUDEmd`(`src/templates/claude-md.ts`)、`composeGitignore`、`composeClaudeSettings`、`composeOpenspecConfig`,以及 `mergeFusionIntoCLAUDEmd` / `mergeGitignore` / `mergeClaudeSettings`(`src/scaffolder.ts`);删除内联的 FUSION 块与另外三份内联内容。同时写明它是 Claude Code 方言、需翻译而非照抄。验证:1.1 与 1.2 转绿。
- [x] 2.2 加入**三项运行时检查**与**条件降级**:本平台是否 OpenSpec 支持(取 id 用 `openspec init --help`)、是否 Superpowers 支持、指令文件名换成该 agent 的(`AGENTS.md` / `.cursor/rules` / `copilot-instructions.md` / `GEMINI.md` …)。明确 `subagent` 与 `git worktree` **归 Superpowers**,不单独降级;仅当目标平台不在 Superpowers 支持范围内才把那几项纪律展开为散文(脑暴先行 / 先写失败测试 / 完成前须有新鲜证据)。验证:1.3 转绿。
- [x] 2.3 **两问照搬 CLI 语义**:git 仅在新建目录时问、已存在目录不问不建;OpenSpec 总是问。**拒绝** → `/opsx:*` 原样不注解;**尝试失败** → 加注解 + 尾部通知(缺什么、怎么修),且失败后摘要**不得**把 `/opsx:propose` 当作可用下一步。验证:`npx vitest run tests/skills/init-specfuse-skill.test.ts` 全绿,并人工核对上述二分行为已写清。
- [x] 2.4 **删净栈层**:Step 2 的栈问题、3a–3d 的 "stack-specific" 内容、末尾 `## Stack Profiles Quick Reference`;并把 `{{test_cmd}}` / `{{lint_cmd}}` 占位符替换为 CLI 的 stack-free 措辞(`the project's test command` / `the project's linter`,见 `src/templates/claude-md.ts:111,214`)—— 这两个变量只服务于栈层,栈层消失后它们没有产出者。验证:1.1 的 `stack` 不分大小写计数为 0、占位符计数为 0。

  **第 2 节实测(GREEN):**
  ```
  ✓ tests/skills/init-specfuse-skill.test.ts (20 tests)
  Tests  20 passed (20)
  ```
  指标对照（起点 → 终点）:
  ```
  stack 命中（不分大小写）  16 处 →  0
  内联 FUSION 块             1 处 →  0
  {{...}} 占位符             5 处 →  0
  总行数                    316   → 181（-43%）
  ```

  **内容断言的非空洞验证:** spec 的 25 个 Scenario 中,前 12 条断言只覆盖 4 条行为,其余为内容断言。为免重蹈上一轮评审 S1 的覆盖缺口,补齐 8 条内容断言,并**逐条在重写前的文件上(`git show aa49935:…/SKILL.md`)验证其为红**:
  ```
  检查项                     旧文件上
  instruction files          ✅ 红
  dialect warning            ✅ 红
  superpowers attribution    ✅ 红
  no-unavailability claim    ✅ 红
  git only new dir           ✅ 红
  decline vs failure         ✅ 红
  merge rules                ✅ 红
  no {{...}}                 ✅ 红
  ```
  一条旧文件**也**能通过的内容断言等于没守 —— 故必须有此步。

*Blocks: 第 3 节。*

## 3. 反例验证(断言强度)

- [x] 3.1 临时把 `src/templates/claude-md.ts` 的 `composeCLAUDEmd` 改名,证明 1.2 的指针断言**转红**;还原后证明转绿,并以指纹自证还原完整(不用 `git checkout` —— 该文件若属本次改动面,回滚会牵连其它改动)。验证:两次 `npx vitest run tests/skills/init-specfuse-skill.test.ts` 的原始输出(先红后绿)+ `sha256sum` 前后一致。无法被弄红的断言不守任何东西。

  **第一次跑:反例失败,断言是空洞的。** 改名 `composeCLAUDEmd` → `composeCLAUDEmdRenamed` 后 **20 条仍全绿**。原因:断言写的是 `expect(source).toContain('composeCLAUDEmd')`,而文件里剩下的是 `composeCLAUDEmdRenamed` 的**前缀** —— `toContain` 对符号名不成立,任何以它开头的更长标识符都能满足。
  这推翻了我刚在第 1 节写下的判断("7 条 `still lives in` 是唯一残留漂移面的守卫")——**它们当时什么都没守**。

  **修复:** 改为整标识符匹配 `new RegExp(`\\b${name}\\b`)`;同样的空洞写法在"技能点名源"那条里也存在,一并修掉。

  **修复后重做反例:**
  ```
  改名后: × 'composeCLAUDEmd' still lives in 'src/templates/claude-md.ts'
            → expected false to be true
          Tests  1 failed | 19 passed (20)
  还原后: Tests  20 passed (20)
  指纹:   H1 = b02d5592dffd3339a3630f8533d801f4599c23001da90d6725ef641f23158daa
          H2 = 同                    ✅ 一致（未用 git checkout —— 该文件不在本次改动面,回滚会牵连其它改动）
  ```

  **本节的价值正在于此:反例没通过,反而抓出了一条一直绿着的空洞断言。** 若跳过本节,一条"永远绿"的守卫会随变更一起归档,并被我写进报告说成"唯一残留漂移面的守卫"。

*Blocks: 第 4 节。*

## 4. 全量验证

- [x] 4.1 `HOME=$PWD/tmp/scratch-home ./node_modules/.bin/vitest run` 全量(含 `tests/e2e/`)绿,粘贴原始输出 —— 这一跑即 E2E 回归门禁。跑完核对真实 `~/.claude.json` 为 5 条（见 0.1 的说明）、临时条目 0。
- [x] 4.2 `npx tsc --noEmit` 干净 + `npx eslint .` 零警告,粘贴原始输出。
- [x] 4.3 `openspec validate update-init-specfuse-skill --strict` 通过。

  **第 4 节实测:**
  ```
  npx tsc --noEmit                          → clean
  npx eslint .                              → exit 0（无输出）
  openspec validate … --strict               → Change 'update-init-specfuse-skill' is valid
  HOME=… vitest run                          → Test Files 18 passed (18)
                                                     Tests 381 passed (381)
  真实 ~/.claude.json                         → 5 条 | 临时条目 0
  ```
  与基线（17 files / 361 tests）相比:+1 文件 / +20 测试,即本次新增的守护文件,既有 361 条全数保留。

## 5. FuseReview 发现处置(第四拍)

*评审以未参与实现的独立冷读上下文执行,对象为工作区 diff vs 基线 `aa49935`(本变更未提交)。评审结论:**Blocking 2 条, Suggestion 8 条**。评审者对 19 条断言逐一施加定向反例,确认全部因预期原因转红;并独立复现了两条 Blocking 的实验。*

- [x] 5.1 **修复 B1(产物集合不全)** —— 技能只列了 4 个产物,而 `scaffold()` 还装 `.claude/skills/{design-md,fusereview,fuseqa}/SKILL.md` 及两份模板目录;`composeCLAUDEmd()` 的输出**正引用**这三条路径。照原技能装完,生成的指令文件会指向从未创建的文件,第四拍与第五拍在该渠道不可达 —— 即本变更要治的"承诺不存在的东西",换到产物侧。

  **TDD:** 先把 3 个技能作曲家 + 2 份模板目录纳入 `SOURCES`/`TEMPLATE_DIRS` → `names every canonical source` **转红**(`expected [ … ] to deeply equal []`)→ 在技能产物表补上三行并加一段说明 → 转绿。验证:33 passed。

- [x] 5.2 **修复 B2(指针断言可被"搬家"绕过)** —— 断言原为 `\\bNAME\\b`,而 import 语句也满足它。评审者实测:把 `mergeGitignore` 抽到新文件、`scaffolder.ts` 改为 import,**tsc 干净且守护全绿**,而技能里"… in `src/scaffolder.ts`"已成假话。

  **修复:** 改为要求**声明**形态 `/(?:export\s+)?(?:async\s+)?(?:function|const|class)\s+NAME\b/`。
  **复现评审者的实验以证明修复有效:**
  ```
  抽出 mergeGitignore → src/utils/merge.ts,scaffolder.ts 改为 import
  npx tsc --noEmit  → exit 0（重构合法）
  守护             → × 'mergeGitignore' is declared in 'src/scaffolder.ts'
                      Tests  1 failed | 32 passed
  还原                → src/scaffolder.ts 与 HEAD 逐字一致 ✅，33 passed
  ```

- [x] 5.3 **S3 与 B2 同类,一并修掉** —— 原"无内联副本"守卫只查 `### Phase 2: Apply / Implement` 一个标题;评审者实测把 `### Path A: One-Shot Proposal` 整段粘回,**20 条全绿**。改为对**全部 7 个权威节标题**逐一断言缺席。

- [x] 5.4 **S1 与上一轮 S1 同类,一并修掉** —— 3 个 Scenario 无断言(评审者实测删掉对应句子守护仍全绿)。补齐:FUSION 标记可移植、不支持 Superpowers 时三项纪律的具体要求、OpenSpec 总是问。

  **非空洞验证:** 5 条新增内容断言 + 7 条标题断言,**在重写前的文件上逐条为红**:
  ```
  portable as-is / discipline×3 / Ask this either way   → ✅ 红
  7 个权威节标题                                        → ✅ 红（旧文件全部含之）
  ```

- [x] 5.5 **S2:更正我对自己断言的不实定性** —— 我在 tasks/design/测试注释里写的"正向的 `openspec init --help` 断言承担主要守备"**是错的**:正向断言只问"指令在不在文中",对"文中另有一份清单"同样红不起来;手写一份缩写清单会同时通过两条。三处已改为如实陈述:**本项没有机械保障,靠评审**。

- [x] 5.6 **S4:修掉制品内的自相矛盾** —— 技能 3d 称 `openspec/config.yaml`"无需翻译",但其 `context` 字段写着 `The project's own CLAUDE.md declares its build/test/lint commands`(`src/templates/openspec-config.ts:5`),与 3b 的指令文件替换直接冲突。已改为"需一处替换"并指明是哪一处。

- [x] 5.7 修复后**仅复审修复 diff**(协议规定的终止条件,不做第二轮全量评审)。终态门禁:`npx eslint .` exit 0 / `tsc --noEmit` clean / `openspec validate --strict` valid / scratch HOME 全量 **18 files, 394 tests passed** / 真实 `~/.claude.json` 5 条、临时条目 0。技能终态:**194 行,stack 0,内联块 0,占位符 0**。

  **记入收尾报告、不强制执行的 4 条 Suggestion:**
  - **S5** Step 1 的检测块硬编码 `AGENTS.md`/`CLAUDE.md`,与 3b"指令文件是你自己的那个"不一致 —— Cursor/Gemini/Copilot agent 会看到 "no AGENTS.md"
  - **S6** 默认消费者"有 git、无 node",而 Step 4 的修复路径("that includes installing it")落到 npm 上不可执行;3c 有正确降级但其触发条件写的是"tool id 不在清单里"而非"CLI 不存在"
  - **S7** 合并细则与 `src/scaffolder.ts` 实际有三处未写(gitignore 不追加注释行且会加 `# Added by specfuse` 头;settings 在既有 JSON 解析失败时直接覆盖;FUSION 半标记会走追加分支产生重复)
  - **S8** 占位符正则 `/\{\{[a-z_]+\}\}/` 不匹配 `{{TEST_CMD}}` 形态(真实回归是 snake_case,可接受)

## 6. FuseQA 检查点决定(第五拍)

**决定:跳过。** 连同变更事实记录,使跳过可审计而非隐形。

| 事实 | 值 |
|---|---|
| 触及用户可观察入口 | **否** —— 本变更产物是文档,没有可驱动的可执行入口;它的消费者是"另一个 agent 的模型",无法从测试驱动 |
| 受影响能力 | `init-specfuse-skill`(本次新增) |
| 决策时 E2E 用例数 | **10**(`scaffold-tool-boundary` 8 + `openspec-readiness-reporting` 2);本能力无用例 |
| 本次作者用例数 | **0** |

**跳过理由:** FuseQA 的配方对"无可执行入口的产物"要求交给**真实消费者**验证;此处的真实消费者不可从测试驱动。最接近的替代做法(从子进程断言技能文件的文本)与守护测试断言的是**同一件事**,只多一层子进程外壳,不增加覆盖。另:本轮唯一的真实缺陷 B1 不在 CLI 路径上,而在技能文档的产物清单里 —— E2E 抓不到它,抓到它的是冷读评审。

**已知覆盖缺口(留档):** 本能力**无 E2E 层守护**。其内容契约由 `tests/skills/init-specfuse-skill.test.ts` 的 33 条断言承担 —— 该文件是**单测**层面的文件内容断言,不经过任何真实入口。
