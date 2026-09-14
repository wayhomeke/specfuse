## 0. 基线

- [x] 0.1 记录 FuseReview 基线:`git rev-parse HEAD` = `a81b4e9`(v0.10.1),变更前工作区仅有本变更目录未跟踪。**基线范围经裁决收窄为 `tests/templates/claude-md.test.ts`(48 用例全绿),未跑全量** —— 原因是全量单测会经 `trustDirectory()` 对真实 `~/.claude.json` 做**无锁读-改-写**,与正在运行的 Claude Code 本体并发时存在丢更新竞态(见下);而本变更改动面为模板层,与该文件无交集,收窄不损失基线效力。验证:`git rev-parse HEAD` 原始输出 + `npx vitest run tests/templates/claude-md.test.ts` 输出(48 passed)。

  **本次查证记录(均不在本变更范围内,供后续变更取用):**

  1. `trustDirectory()`(`src/scaffolder.ts:30-43`)的写入本身**纯增量且无损** —— 从不删除 key,`JSON.parse`→`stringify` 往返无损,故**不会**删除用户的真实项目条目。真实风险是同文件上的**无锁读-改-写竞态**(FuseReview `[lifecycle-concurrency]` 点名的经典缺陷类,只在真实进程下复现)。
     **Correction(写本节时未实测,后续实测推翻):** 本节初稿写的是「路径不可注入,单测无法像 E2E 那样用 scratch HOME 隔离」—— **该说法错误**。实测:
     ```
     $ HOME=/…/tmp/scratch-home node -e "console.log(require('node:os').homedir())"
     os.homedir() = /home/example/workspace/specfuse/tmp/scratch-home

     $ node -e "process.env.HOME='/x/y'; console.log(require('node:os').homedir())"
     进程内改写后 = /x/y                      ← 进程内改写同样生效
     ```
     即 `os.homedir()` 在当前 Node 下**认 `HOME`**。初稿是照抄台账未加验证的结论,与本节批评台账的毛病同类,记此以免再传。
  2. 台账 `tests/e2e/LEDGER.md:113-125` 的「约 35 条/全量运行」经**实测精确证实为 35**:以 scratch HOME 跑真·全量后,scratch 内 `.claude.json` 恰有 35 条 `projects`,全部为 `/tmp/fusion-*`。计数来源为 `tests/scaffolder.test.ts` 中 19 处直接 `await scaffold(` + 16 处 `captureScaffold(`,每次调用以其独有的临时目录路径为 key **新增一条**,不是累加到同一条。
     **但台账同段的「`os.homedir()` 忽略进程内 `process.env.HOME` 改写」不成立**(见上)。该段据此宣告的「已知缺口无法隔离、只能延后」**前提有误** —— 缺口本可隔离。真实 `~/.claude.json` 当前此类残留为 **0 条**,其原因(Claude Code 清理指向已消失目录的条目?)仍**未证实**,官方文档无记载。
  3. `composeGitignore()`(`src/templates/gitignore.ts`)不生成 `.claude/settings.local.json` 条目,而 scaffolder 会向每个目标项目写入该文件。本仓库靠全局 `/home/example/.config/git/ignore` 兜住,**换机器或 CI 则目标项目会把该文件提交进仓库**。内容为权限白名单、无密钥,危害低,但属 git 卫生缺口。
  4. `.claude/skills/excalidraw-diagram` 是作为 **gitlink 签入的嵌套 git 仓库**,内含一个 vendored 的 Python `.venv`(其中有 playwright 的 JS)。ESLint 首次运行时扫进去产出了大量第三方噪声。已由 6.1 的 ignore 列表排除,但该 vendoring 方式本身值得单独审视。

*规范:`tasks.md` 的任务构成一条严格 TDD 依赖链,几乎每个任务都被前一个 block —— 因此不满足 subagent 模式的「多数任务之间无 blocked by 依赖」触发条件,按主会话顺序执行。*

## 1. RED —— 把检查点契约钉成失败断言

契约先于实现。此刻 `renderApplyPhase()` 尚未导出、且只有 1 个选项,所以这一节写完必然是红的。

- [x] 1.1 在 `tests/templates/claude-md.test.ts` 新增 describe 组:从 `../../src/templates/claude-md.js` 具名导入 `renderApplyPhase`,断言其输出中 `选项 \d+:` 的出现次数 `>= 2`,并断言输出含 `切换模型`。验证:`npx vitest run tests/templates/claude-md.test.ts`,粘贴原始输出证明**红** —— 失败原因此刻应为「导出不存在 / 模块导入失败」,而非计数断言失败。

  **实测输出(RED):**
  ```
  FAIL  tests/templates/claude-md.test.ts [ tests/templates/claude-md.test.ts ]
  TypeError: (0 , renderApplyPhase) is not a function
   ❯ tests/templates/claude-md.test.ts:333:15
      333|   const out = renderApplyPhase();
  Test Files  1 failed (1)
        Tests  no tests
  ```
  失败原因与预期一致:**导出不存在**,`describe` 体在收集阶段即抛错,故 48 个既有用例本次未执行(非回归,是同一文件收集中止)。转绿后复跑确认既有用例完好。

- [x] 1.2 补两条边界断言:计数 `<= 4`;`继续使用当前模型` 与 `切换模型` 两个选项标签同时存在。验证:同上命令,仍红。

  **实测输出(RED):** 与 1.1 同一失败(`TypeError ... is not a function`,收集期中止)。如实记录:新加的两条断言**本次未被真正执行到**,它们的**独立**红将在 2.1 补上导出后单独观察到 —— 届时若计数断言之外还红,即为断言本身写错。

  **Correction(2.1 后观察到,已修正):** 观察到时,第三条断言 **通过了** —— 但此刻 `切换模型` 作为选项并**不存在**。原因是 `expect(out).toContain("切换模型")` 被同段前文的句子 `询问用户是否**切换模型**` 命中,属**空洞断言**:它在其针对的回归上不会变红,因此什么都不守(本项目 FuseReview `[test-strength]` 点名的缺陷类)。
  已重写为锚定**选项声明语法**而非整段文本:
  ```ts
  const optionLabels = [...out.matchAll(/选项 \d+:\s*"([^"]+)"/g)].map((m) => m[1]);
  ```
  重写后该断言在缺陷代码上**如实转红**:`expected [ '继续使用当前模型' ] to have a length of 2 but got 1`。修正理由记于此,而非只留"测试写错了"。

*Blocks: 第 2 节。*

## 2. GREEN —— 导出缝隙与文本修复

- [x] 2.1 为 `renderApplyPhase` 加 `export`,与 `renderApplyFuseReview` / `renderFuseQA` / `renderVerifyPhase` 三个既有兄弟导出对齐(仅改可见性,不动签名)。验证:`npx tsc --noEmit` 干净;`npx vitest run tests/templates/claude-md.test.ts` 从「导入失败」转为**仍红、但失败原因变为计数为 1** —— 这一步同时证明缝隙已通、缺陷仍在。
- [x] 2.2 重写 Step 0:新增 `选项 2: "切换模型"`;把「选择切换模型」与「通过 Other 输入命令」**合流为同一条后续行为**(提示手动执行 `/model <name>`,随后 MUST 停止、等待重跑 `/opsx:apply`);写入选项数 MUST 落在 2–4 的约束。验证:`npx vitest run tests/templates/claude-md.test.ts` 全绿,粘贴原始输出。

  **2.1 实测(RED 定向化):**
  ```
  ✓ tests/templates/claude-md.test.ts (48 既有用例全部通过)
  × names at least two options, so AskUserQuestion accepts the payload
    → expected 1 to be greater than or equal to 2
  Test Files  1 failed (1)
        Tests  2 failed | 49 passed (51)
  ```
  `tsc --noEmit` 干净。缺席的 48 个用例全部回归,证明 1.1 的整文件失败只是收集期中止,非回归。

  **2.2 实测(GREEN):**
  ```
  ✓ tests/templates/claude-md.test.ts (51 tests) 29ms
  Test Files  1 passed (1)
        Tests  51 passed (51)
  ```
  `npx tsc --noEmit` 干净。

*Blocks: 第 3 节。*

## 3. 同步自举副本

- [x] 3.1 把根 `CLAUDE.md` 的 Model Switch Checkpoint 段改为与模板一致(FUSION 块内,手工合并,生成器不管此处)。验证:运行检查点段比对命令输出 `checkpoint 段 MATCH`,且 `rg -o '选项 \d+:' CLAUDE.md | wc -l` 为 `2`。

  **实测输出:**
  ```
  checkpoint 段 MATCH
  段长度 gen 475 | root 475
  gen  选项标签 ["继续使用当前模型","切换模型"]
  root 选项标签 ["继续使用当前模型","切换模型"]
  ── rg -o '选项 \d+:' CLAUDE.md | wc -l → 2
  ```
  比对前先 `npm run build` 重建 `dist`(该命令 import 的是构建产物),此步同时构成任务 5.1 的构建证据。

  **不要**用整块逐字比对作为判据 —— 根副本故意把模板的 stack-agnostic 文案 `Run the project's test command in the terminal` 特化为本仓库的 `npx vitest run (...)`,整块比对会永久误报 DIFF(见 `design.md` — Context;该命令已在写任务前实测确认)。

## 4. 断言强度(反例验证)

- [x] 4.1 把选项 2 从模板删回单项,证明第 1 节的断言**转红**;恢复后证明转绿。验证:两次 `npx vitest run tests/templates/claude-md.test.ts` 的原始输出(先红后绿)。无法被弄红的断言不守任何东西 —— 本节证明它守的是本缺陷,而非巧合。

  **实测输出:**
  ```
  ── 删回单项后:
  Test Files  1 failed (1)
        Tests  2 failed | 49 passed (51)
    失败的正是 >=2 与 toHaveLength(2) 两条

  ── 还原后:
  ✓ tests/templates/claude-md.test.ts (51 tests) 27ms
        Tests  51 passed (51)
  ```
  **还原完整性以指纹自证**(不用 `git checkout` —— 那会连带回滚本次全部改动,该文件改动未提交):
  ```
  实验前 H1 = 49b04df5f3287f63ddc150ca1d8882ebc527f92c75e6e77829c01973ce852995
  实验后     49b04df5f3287f63ddc150ca1d8882ebc527f92c75e6e77829c01973ce852995  ← 一致
  ```

*Blocks: 第 5 节。*

## 5. 全量验证与构建产物

- [x] 5.1 `npm run build` 成功,并从 `dist` 渲染该段断言计数为 `2`。既有 `dist/` 为 09-11 构建、内容陈旧;E2E 用例跑的是**构建产物**而非 `src/`,不重建则验证的是旧制品。验证:`npm run build` 后运行渲染命令输出计数 `2`。

  **实测输出:**
  ```
  > rm -rf dist && tsc && ... (build exit: 0)
  dist 渲染选项数: 2 | 标签: ["继续使用当前模型","切换模型"]
  PASS 计数为 2
  ```
- [x] 5.2 `npx vitest run` 全量(含 `tests/e2e/` 下全部用例)绿,粘贴原始输出 —— 这一跑即 E2E 回归门禁。

  **范围收窄(经裁决):** 排除 `tests/scaffolder.test.ts` 与 `tests/scaffold-no-codegraph.test.ts` —— 只有这两个文件会经 `trustDirectory()` 写真实 `~/.claude.json`;其余全部安全(E2E 用 scratch HOME 隔离,`cli-entrypoint` 只跑 `--version/--help`,`cli` 只读 `program.options`)。排除项**显式带上默认排除值**,否则 `--exclude` 会替换默认值而把 `node_modules` 扫进来。

  **实测输出:**
  ```
  ✓ tests/e2e/scaffold-tool-boundary/skill-distribution.test.ts (8 tests) 4026ms
      ✓ confines home-directory writes to the scratch HOME
  ✓ tests/e2e/openspec-readiness-reporting/success-path.test.ts (2 tests) 10026ms
      ✓ confines the real openspec init and the trust write to the scratch HOME
  Test Files  14 passed (14)
        Tests  320 passed (320)
     Duration  11.80s
  ```
  **独立验证隔离生效:** 跑完后真实 `~/.claude.json` 仍为 4 条 projects、其中临时目录条目 0 条。

  已知代价:上述两个文件本次未跑(它们只测 scaffolder,与本次改动面无交集)。

  **Superseded:** 上述排除**已作废**。0.1 的实测推翻了「无法隔离」的前提 —— 运行时导出 `HOME` 即可把 `trustDirectory()` 的写入导向 scratch HOME。6.3 因此以**真·全量、零排除**重跑并全绿(16 files / 357 tests),两个此前被排除的文件均已覆盖。本条的排除方案只应视为一次基于错误前提的临时决定,不再有效。
- [x] 5.3 `npx tsc --noEmit` 干净 + `npx eslint .` 零警告,粘贴原始输出。

  **实测输出(6.2 完成后):**
  ```
  $ npx eslint .          → exit = 0，无输出
  $ npx tsc --noEmit      → clean (0 errors)
  ```

  **部分完成,被阻塞:** `npx tsc --noEmit` **干净(0 errors)**,但 `npx eslint .` **exit = 2**,输出 `ESLint couldn't find an eslint.config.* file.`。核查结论:**本仓库没有任何 eslint 配置文件**,`eslint` 与 `prettier` 均不在 `devDependencies`、不在 `node_modules/.bin`(`npx` 是临时拉取 eslint 10.10.0)。故「零警告」无从谈起。
  这是**既有事实,非本次改动引入**。它同时证伪了三处文档声称(根 `CLAUDE.md` 的 `Lint: npx eslint .` 与 `Format: npx prettier --write .`、openspec project context 的 `Code style: ESLint + Prettier`)。
  **裁决:本次搭起真实 ESLint 门禁** —— 见第 6 节。5.3 待 6.2 完成后勾选。
- [x] 5.4 `openspec validate fix-model-switch-checkpoint-options --strict` 通过。

  **实测输出:** `Change 'fix-model-switch-checkpoint-options' is valid`

## 6. 范围扩展:搭起真实的 lint 门禁(经 apply 收尾检查点裁决)

*本节**不在**原 proposal / design / specs 范围内。触发原因:5.3 核查发现根 `CLAUDE.md` 声称的 `Lint: npx eslint .` 在仓库中**并不存在**(无配置文件、未安装依赖),属假门禁。经用户在 apply 收尾检查点明确裁决「本次搭起」。它**无 spec delta** —— lint 配置是工具,不改变任何规格级行为。FuseReview 会在 diff 中看到本节全部改动,此处留痕以免被当作无主改动。*

- [x] 6.1 安装 `eslint` 与 `typescript-eslint`(及 `prettier`,使 `CLAUDE.md` 声称的 Format 命令真实可用)到 `devDependencies`,写 `eslint.config.js`(flat config;忽略 `dist/`、`node_modules/`、`openspec/`、`docs/`、`projects/`),并在 `package.json` 加 `lint` 脚本。验证:`npx eslint --version` 可用、`npx eslint .` 不再报「找不到配置」;`package-lock.json` 已更新。

  **实测:** 装得 `eslint@10.10.0`、`typescript-eslint@8.70.0`、`prettier@3.9.6`、`@eslint/js`。首次运行即暴露两个真实问题并已处置:
  - ESLint 10 不自带 `@eslint/js`,需显式安装(否则 `ERR_MODULE_NOT_FOUND`)。
  - ignore 列表初版只有 5 项,扫描撞进 `.claude/skills/excalidraw-diagram/references/.venv/`(vendored 的 Python venv 内含 playwright 的 JS),产出 2.4MB 第三方噪声。已加 `.claude/**` 排除并写明理由。
  首次有效运行产出 **57 处发现 / 12 个文件**。
- [x] 6.2 跑 `npx eslint .` 并处置全部发现 —— 逐条修正,或对确需保留者给出显式豁免与理由。验证:`npx eslint .` exit 0 且无输出,粘贴原始输出。

  **处置台账(57 → 0):**

  | 发现 | 数量 | 处置 |
  |---|---|---|
  | `no-explicit-any` @ `src/scaffolder.ts` | 4 | **真修**:`trustDirectory` 与 `mergeClaudeSettings` 改窄类型(`ClaudeJson` / `ClaudeProjectEntry` / `ClaudeSettings` 接口 + 索引签名保证未知键原样往返) |
  | `no-explicit-any` @ `tests/**` | 45 | **显式限定豁免**(`files: ['tests/**/*.ts']`)。测试替身需宽松类型;且 `scaffold-no-codegraph.test.ts` 有一处是 spec 场景**要求**的「无类型调用方」。规则在 `src/` 仍强制 |
  | `no-unused-vars` @ `_ctx` ×2 | 2 | 配置 `argsIgnorePattern: '^_'`(签名对齐的既有约定) |
  | `no-unused-vars` @ `composeCLAUDEmd(ctx)` | 1 | 改 `_ctx` 并加注释。**不改签名** —— 移除未读参数会破坏 scaffolder 与测试的调用点,属独立的破坏性变更 |
  | `no-unused-vars` @ `basename` / `mockExecFailure` | 2 | **真修**:删死代码 |
  | `no-control-regex` ×2 | 2 | 就地 `eslint-disable-next-line` + 理由(匹配 ANSI 转义正是其用途) |

  **实测输出:**
  ```
  $ npx eslint .      → exit = 0，无输出
  ```
- [x] 6.3 复核新增依赖未破坏既有测试。验证:重跑 5.2 的同一条排除式全量命令,仍全绿,粘贴原始输出。

  **方案升级:** 不再用排除式命令,改用 scratch HOME 跑**真·全量、零排除**(依据见 0.1 的 Correction)。
  ```
  跑前真实 ~/.claude.json : projects 条目 4
  $ HOME=$PWD/tmp/scratch-home ./node_modules/.bin/vitest run
  Test Files  16 passed (16)
        Tests  357 passed (357)
     Duration  12.05s
  跑后真实 ~/.claude.json : projects 条目 4，临时目录条目 0     ← 未被触碰
  scratch HOME 内 .claude.json : projects 条目 35            ← 写入全部落在隔离区
  ```
  37 个此前未跑的用例(两个 scaffold 文件)现已覆盖,**包括 6.1 改动的 `src/scaffolder.ts`** —— 该文件原本正落在 5.2 的排除区内,是一次被自己制造的验证缺口,现已关闭。

*Blocks: 5.3(其 lint 半部门禁由 6.2 兑现)。*

**本节明确不做的边界:**

- **不跑 `prettier --write .` 全仓重排。** 现有源码引号风格本身已不一致(部分文件单引号、部分双引号),全仓重排会产生一个与本次缺陷无关、且体量足以淹没 FuseReview 审查面的 diff。安装 `prettier` 只为使文档声称的命令真实可用,不改变任何文件内容;真正的重排应作为独立变更、带自己的审查面。
- **不顺带修正根 `CLAUDE.md` 的其他声称。** 本节的产出是让声称变真,不是改声称。

## 7. 范围扩展二:修正 E2E 台账的错误前提(经 apply 收尾检查点裁决)

*同样不在原 proposal / design / specs 范围内。触发原因是 0.1 的实测推翻了台账「已知缺口无法隔离」的前提。经裁决本次就地修正。**无 spec delta** —— 改的是台账文档,不是行为。*

- [x] 7.1 在 `tests/e2e/LEDGER.md` 追加 `## Correction — 2026-09-14` 条目,按该文件既有的 Correction 表格格式,写明:原判为何错(`os.homedir()` 实测认 `HOME`,已附两次实测命令与输出)、证据(scratch HOME 内恰 35 条 vs 真实文件 4 条 0 临时)、隔离的正确做法、以及**仍未解释**的部分(真实文件为何当前为 0,「Claude Code 清理已消失目录」仍未证实)。原「Known gap」段落**保留不删** —— 台账协议是保留被取代的原文并另记 Correction。验证:见 7.2 的终态复验(文档改动不影响测试,复验确认无副作用)。

  **附带发现(已记入该条目):** `LEDGER.md` 抬头引用 `.claude/skills/fuseqa/templates/ledger.md`,根 `CLAUDE.md` 指向 `.claude/skills/fuseqa/SKILL.md`,而**这两个路径在本仓库均不存在** —— 本项目自举了 `design-md` 与 `fusereview`,唯独没有 `fuseqa`。两处指向「它自己为别人生成的技能」的悬空引用。已记录,本次不修。

## 8. FuseReview 发现处置(第四拍)

*评审以未参与实现的独立冷读上下文执行,对象为工作区 diff vs 基线 `a81b4e9`(本变更未提交,`baseline..HEAD` 为空)。评审结论:**Blocking 0 条, Suggestion 6 条**。*

- [x] 8.1 **修复 S3(实现缺陷,本次改动自身引入的回归)** —— 6.2 的类型收窄把 `if (!data.projects) data.projects = {}` 换成了 `??=`,而 `??=` 只对 `null`/`undefined` 赋值、`if (!x)` 对所有 falsy 赋值。当 `~/.claude.json` 可解析但 `projects` 为 falsy 标量(`0` / `''` / `false`)时,旧行为重置为 `{}` 并写入,**新行为保留该标量后抛 `TypeError`**,调用点的 `try/catch` 吞掉异常,「自愈并写入」静默退化为「跳过」。该函数开头注释 `// file missing or malformed — start fresh` 表明容忍畸形输入正是其意图。

  **处置:TDD 修复。** 先在 `tests/scaffolder.test.ts` 新增 `trust write tolerates a malformed ~/.claude.json`(利用 0.1 证实的 `os.homedir()` 认 `HOME`,在进程内把 `HOME` 指向 scratch 目录隔离写入;`HOME` 在 `afterEach` 还原而非测试体内 —— 测试体还原在失败时会被跳过,把假 HOME 泄漏给后续用例)。

  **实测(RED → GREEN → 反例):**
  ```
  ── RED（修复前）
  AssertionError: expected 'number' to be 'object'
    tests/scaffolder.test.ts:424   expect(typeof written.projects).toBe('object');

  ── GREEN（还原 if (!…) 语义后）
  Tests  1 passed | 36 skipped (37)

  ── 反例：把修复临时退回 ??= 版
  AssertionError: expected 'number' to be 'object'
  Tests  1 failed | 36 skipped (37)      ← 该断言确实守的是本缺陷，非巧合
  ```
  源码改为 `if (!data.projects) data.projects = {}` / `if (!data.projects[absPath]) …`,与原实现**语义完全一致**,仅保留类型收窄(`any` 仍为 0)。

  **评审者其余 5 条 Suggestion 记入收尾报告,不强制执行**(S1 规格 Scenario 覆盖不足 / S2 `toHaveLength(2)` 严于规格的 2–4 / S4 prettier 无配置与 `.prettierignore` / S5 `skills/init-specfuse/SKILL.md` 是第三份且严重落后的 FUSION 副本 / S6 台账新旧条目的数字未标注各自 HOME)。

- [x] 8.2 修复后复审范围:**仅复审修复 diff**(协议规定的终止条件,不做第二轮全量评审)。验证:终态门禁全绿 —— `npx eslint .` exit 0 / `npx tsc --noEmit` 干净 / `npm run build` exit 0 / scratch HOME 真·全量 **16 files, 358 tests passed** / 真实 `~/.claude.json` 仍 4 条、临时条目 0。所有原始输出见本文件各节。

## 9. FuseQA 用例(第五拍)

*经 apply 收尾检查点裁决进入。方法源取自仓库内 `src/fuseqa/templates/`(本仓库未安装 `fuseqa` 技能 —— 见 7.1 附带发现)。*

- [x] 9.1 新建 `tests/e2e/model-switch-checkpoint/shipped-checkpoint.test.ts`,3 条用例,能力名与 `openspec/specs/model-switch-checkpoint/` 对齐。**被测物为构建产物 `dist/index.js`,经符号链接 bin shim 调用;隔离为 scratch HOME/XDG + OpenSpec 移出 PATH + stub npm** —— 沿用 `scaffold-tool-boundary/skill-distribution.test.ts` 的既有配方。**不 import 任何 `src/`**(机械可查)。

  三条用例各自覆盖单测够不到的路径:
  1. **出厂产物** —— 单测断言的是 `src/` 的 `renderApplyPhase()`;`tsc` 与 build 脚本的模板拷贝横在中间,v0.9.0 的转义反引号缺陷正是这一层。
  2. **brownfield 合并** —— `npm create specfuse@latest .` 打到已带**陈旧单选项 FUSION 块**的目录,验证修复能经 `mergeFusionIntoCLAUDEmd` 抵达,且标记外的用户文本原样保留。**此前无任何用例覆盖合并路径**,而它是 proposal Impact 明写的迁移路径。
  3. **重复幂等** —— 同一条命令跑两次。合并按标记索引切片,第二次是重复段落的暴露点。

- [x] 9.2 **反例验证(用例不空洞):** 把模板 Step 0 回退到修复前文本、重建、重跑 —— 三条**全红**,失败原因精准:
  ```
  × ships a two-option checkpoint ...   AssertionError: expected 1 to be greater than or equal to 2
  × replaces an already-initialized ... AssertionError: expected [ '继续使用当前模型' ] to include '切换模型'
  × is idempotent on repeat ...         AssertionError: expected 1 to be greater than or equal to 2
  ```
  还原修复并重建后全绿。**首次即通过**的用例若无法被弄红则不守任何东西,故必须有此步。

- [x] 9.3 按台账协议在 `tests/e2e/LEDGER.md` 追加 `## Addition — 2026-09-14`,记录来源(spec Scenario)、形状(CLI/符号链接 shim)、不可为单测的理由、反例验证、隔离配方,以及**推导边界**:生成 `CLAUDE.md` 的真实消费者是读指令的编码 agent,测试无法驱动,故用例止于「修复后的段落确实在用户项目收到的文件里」—— 写明以免后人误当作检查点行为的完整端到端覆盖。

- [x] 9.4 终态门禁:`.eslint` exit 0 / `tsc --noEmit` 干净 / `npm run build` exit 0 / scratch HOME 真·全量 **17 files, 361 tests passed** / 真实 `~/.claude.json` 仍 4 条、临时条目 0 / `openspec validate --strict` valid。

  **FuseQA 发现:无。** 三条新用例对修复后的代码全部通过,未暴露实现缺陷,故无需归因分级。附带效果:评审 S1 指出的「Scenario 无断言」缺口被**部分关闭** —— "At least two options are named"、"Switch and Other share one behavior"、"The 2–4 bound is asserted in the rendered text" 三条现已在对**出厂产物**的断言中有覆盖。
