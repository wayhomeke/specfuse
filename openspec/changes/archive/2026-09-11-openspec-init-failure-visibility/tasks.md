## 0. 基线

- [x] 0.1 记录 FuseReview 基线:`git rev-parse HEAD` 写入变更状态,确认起始套件全绿。验证:`git rev-parse HEAD` 与 `npx vitest run`(335 全绿)。

## 1. 先锁住成功路径(改动前的安全网)

E2E 环境恒为 `install-failed`(narrowed `PATH` + stub `npm`),所以成功路径只能靠单测守。先把它钉住,否则注解逻辑写错时没人发现。

- [x] 1.1 在 `tests/scaffolder.test.ts` 断言 OpenSpec 就绪时 stdout 含 `/opsx:propose   # start your first change` 逐字不变。既有 mock 已让 `initOpenspec` 返回 true,属现有行为补测。验证:`npx vitest run tests/scaffolder.test.ts`。
- [x] 1.2 断言 `initOpenspec: false`(用户拒绝)时同样逐字不变、且无 OpenSpec 提示块 —— `'skipped'` 与 `'ready'` 输出相同但状态不同。验证:同上。

*Blocks: 第 3 节。*

## 2. 状态类型与捕获

- [x] 2.1 RED:断言 OpenSpec 装不上时 stdout 含指向下方提示的注解、且**不含** `# start your first change`。此时无注解逻辑,应红。验证:`npx vitest run tests/scaffolder.test.ts`(预期红)。
- [x] 2.2 GREEN:在 `src/scaffolder.ts` 定义 `type OpenspecStatus = 'skipped' | 'ready' | 'install-failed' | 'init-failed'`,局部 `openspecStatus` 初值 `'skipped'`,在既有四个分支各赋值一次(不改控制流,不抽函数)。验证:`npx tsc --noEmit`。
- [x] 2.3 GREEN:`Next steps` 的 `/opsx:propose` 行按状态选择尾注 —— 非 `'ready'`/`'skipped'` 时替换为指向提示块的措辞(替换而非追加,见 design 决策 3)。验证:2.1 转绿,且 1.1/1.2 仍绿。

*Blocked by: 第 1 节。*

## 3. 提示块

- [x] 3.1 RED:断言 `'install-failed'` 时提示块同时含 `npm i -g @fission-ai/openspec` 与 `openspec init --tools claude --force`。验证:`npx vitest run tests/scaffolder.test.ts`(预期红)。
- [x] 3.2 RED:断言 `'init-failed'`(CLI 在但 init 失败)时含 init 命令、**不含**重新安装指引。需调整 mock 让 `detectOpenspec` 返回 true 而 `initOpenspec` 返回 false。验证:同上(预期红)。
- [x] 3.3 GREEN:实现提示块 —— `chalk.yellow` 标题 + `chalk.dim` 正文,位置在 `Next steps` 之后、与 Superpowers 提示并列;声明后果(`/opsx:*` 不可用,生成的工作流无法进入);修复命令按状态选择。验证:3.1/3.2 转绿。
- [x] 3.4 RED→GREEN:断言 `'ready'` 与 `'skipped'` 时**无**提示块。验证:`npx vitest run tests/scaffolder.test.ts`。
- [x] 3.5 断言提示块在 stdout 中的位置晚于 `Next steps`(比较 index,而非仅断言存在)。验证:同上。
- [x] 3.6 断言 Superpowers 提示措辞与触发条件未变、且与 OpenSpec 状态无关。验证:同上。

*Blocked by: 第 2 节。*

## 4. Next steps 结构不变

- [x] 4.1 断言两条路径的 `Next steps` 块行序列相同(新项目含 `cd`、`claude`、`/opsx:propose`),仅尾注不同。这条守的是「将来加行绕过注解」。验证:`npx vitest run tests/scaffolder.test.ts`。
- [x] 4.2 断言失败时 `Next steps` 块内**不含** `npm i -g` 与 `openspec init` —— 修复命令只出现在提示块。验证:同上。

*Blocked by: 第 2、3 节。*

## 5. 就绪状态来自记录而非探测

- [x] 5.1 RED→GREEN:断言目标目录预先存在 `.claude/commands/opsx/`(模拟上次运行残留)但本次 OpenSpec 装不上时,仍打印注解与提示块 —— 证明判断依据是本次记录的结果,不是文件系统探测。验证:`npx vitest run tests/scaffolder.test.ts`。

*Blocked by: 第 2、3 节。*

## 6. 端到端与全量验证

- [x] 6.1 `npx tsc --noEmit` 干净。
- [x] 6.2 `npx vitest run` 全量绿,粘贴原始输出。
- [x] 6.3 `npm run build`,然后在 scratch `HOME` 中以 `openspec` 移出 `PATH` + `npm` stub 退非零跑构建产物:断言**退出码 0**、stdout 含注解与两条修复命令、`.claude/commands/opsx/` 确实不存在(即被报告的那个条件)。清理 scratch,`git status --short` 无残留。
- [x] 6.4 正向对照:OpenSpec 可达时跑构建产物,断言 stdout 既无注解也无提示块,且 `/opsx:propose   # start your first change` 逐字出现。**注意此步会在真实环境执行 `openspec init`**,故须在 scratch `HOME` 内进行,禁止污染开发者全局状态(见 `tests/e2e/LEDGER.md` 的隔离教训)。
- [x] 6.5 现有 E2E 用例复核:它们恒走 `install-failed` 路径,确认新增输出未使其失败。验证:`npx vitest run tests/e2e/`。

*Blocked by: 第 1-5 节。*

## 7. 收尾检查点

- [x] 7.1 FuseReview 检查点:呈报事实(任务数、是否 subagent、涉及模块),询问是否冷读 `基线..HEAD`,记录决定。
- [x] 7.2 FuseQA 检查点:呈报事实(是否触及用户可观察入口、涉及 capability、现有 E2E 用例数),询问是否执行,记录决定。**收尾报告须含 7.1 与 7.2 两条决定**——缺一条即本变更未完成,不得进 `/opsx:verify`。

*Blocked by: 第 6 节。*
