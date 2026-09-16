## Why

规格树有七处腐坏,而没有任何东西检测它。`openspec validate --specs --strict` 报 **15 项中 7 项失败** —— 这个事实本身说明问题不在工具,在于不跑它。

七个失败分两类,成因不同:

**四份不是主 spec。** `openspec/specs/design-md-*/` 里的四份没有 `# … Specification` / `## Purpose` / `## Requirements` 三段结构,它们是 **delta** —— 直接被写进了规格树。根因是 `ade71c9` 与 `c2f2ff2` 两个 `feat` 提交绕过了 archive 的同步转换。后果不止是格式:其中 `design-md-generator` 描述的能力在代码里**已不存在**(无 `generateDesignMd()`),`design-md-archetypes-v2` 的版本后缀永久留在了 capability 名里,而 v1 的「移除」记录针对的是一份从未成为规范 spec 的东西。

**三份 Purpose 是占位。** `fuseqa-checkpoint`、`fuseqa-skill-generation`、`openspec-readiness-reporting` 仍是 `openspec archive` 自动写入的 `TBD - created by archiving…`。归档时没人回来填。

另有一处**工具检测不到**的矛盾:`scaffold-tool-boundary` 的 Purpose 写「the setup questionnaire asks exactly **three** questions」,而同文件 `### Requirement: Setup questionnaire asks exactly **two** questions` 的正文写「SHALL prompt for git initialization and OpenSpec initialization only」——后者与 `collectProjectConfig()` 一致。Purpose 是三问时代的残留,规格自述与实际契约相反。

## What Changes

- **`design-md-archetypes` 建立为规范主 spec** —— 补齐三段结构,Requirement 取 `-v2` 的四条(已与当前 16 份 YAML 及 `_schema.yaml` 核对相符)。
- **删除 `design-md-archetypes-v2/`** —— 内容并入上一条;capability 名不携带版本后缀。
- **删除 `design-md-generator/`** —— 该 capability 在代码中已不存在,规格不应为一个不存在的能力保留席位。
- **`design-md-skill-generation` 建立为规范主 spec** —— 内容不变,补齐三段结构。
- **填三处 TBD Purpose** —— 用该 capability 实际管辖的内容重写,不再留占位。
- **订正 `scaffold-tool-boundary` 的 Purpose** —— 「three questions」→「two questions」,与同文件 Requirement 及实现一致。这是事实订正,不是行为变更。
- **加守卫** —— 断言规格树通过 `openspec validate --specs --strict`。检测手段用工具自己的规则,而非复刻一套。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无。本变更声明 `skip_specs: true`。

理由:没有任何 capability 的**行为契约**改变。`design-md-archetypes` 的 v2 四条 Requirement 逐字存在于规格树中(只是活在一份未同步的 delta 里),`design-md-generator` 的 Requirement 早已被移除。本次改变的是这些文件**住在哪、以什么结构存在**,不是任何一条契约的内容。

另一层理由是本变更自身立论的延伸:给它写 ADDED delta 意味着让 archive 的同步把新内容施加到一个畸形基底上 —— 而「施加到畸形基底」正是本变更要消灭的那类机械脆弱。修复直接作为实现施加于 `openspec/specs/`,不经过同步。

`skip_specs` 的判据是「无 spec 级行为变更(纯重构、工具、文档)」—— 本变更正是规格树这一文档语料的结构修复。

## Impact

**重写为规范形式**(内容不变,补 `# … Specification` / `## Purpose` / `## Requirements`):
- `openspec/specs/design-md-archetypes/spec.md` —— 吸收 `-v2` 的四条 Requirement
- `openspec/specs/design-md-skill-generation/spec.md`

**删除**:
- `openspec/specs/design-md-archetypes-v2/`(内容已并入)
- `openspec/specs/design-md-generator/`(能力不存在)

**填补 Purpose**:
- `openspec/specs/fuseqa-checkpoint/spec.md`
- `openspec/specs/fuseqa-skill-generation/spec.md`
- `openspec/specs/openspec-readiness-reporting/spec.md`

**订正 Purpose**:
- `openspec/specs/scaffold-tool-boundary/spec.md:3`

**新增测试**:
- `tests/specs/spec-corpus.test.ts` —— 经子进程运行 `openspec validate --specs --strict`;`openspec` 不在 PATH 时**可见跳过**(打印原因),不判红。理由见 Trade-offs。

**不影响**:
- 无源码改动。`src/` 与 `tests/` 的既有 477 项测试不受影响。
- 无代码或测试引用被删/改的 capability 名(已核实:四个 design-md capability 名在 `src/`、`tests/`、`.claude/`、`docs/` 中零引用),也无对应的 `tests/e2e/design-md-*/` 目录,故不影响 FuseQA 的目录对齐约定。
- 其余八份 spec 不动。

## Non-goals

- **不改任何 Requirement 的行为契约。** 本次是文件结构与 Purpose 的修复;`scaffold-tool-boundary` 那处是事实订正。若某项 Requirement 与实现不符,另开 change。
- **不动 `openspec/changes/archive/`。** 已归档的 delta 是历史记录,正是它们记录了设计决策的由来。
- **不回溯重命名其余 capability。** `design-md-skill-generation` 等名称保持不变。
- **不引入 CI。** 仓库当前无 CI 配置;守卫作为测试存在,由全量套件承载。
- **不改 `src/` 下任何代码。**

## Trade-offs

- **守卫用子进程跑工具 vs 复刻文件结构断言(chosen:子进程)** —— 纯文件断言零依赖且任何环境生效,但它**复刻了 openspec 的校验规则**;规则演进时断言会漂移,而「规则漂移而无人察觉」恰是本变更要消灭的东西 —— 用复刻规则去守卫规则漂移在逻辑上不自洽。代价是无 openspec 的环境下守卫形同虚设,故按本项目既有模式(FuseQA §4 的浏览器规则)**可见跳过而非判红**:打印跳过原因,不让缺工具把套件变红,也绝不让跳过是静默的。
- **收敛为两个 capability vs 四份各补结构(chosen:收敛)** —— 四份各补结构改动更小且不动历史命名,但会永久保留 `-v2` 后缀与一个已不存在能力的规格席位。收敛的代价是删除两份文件,需要在变更记录里写清理由 —— 已写在 What Changes 中。
- **删除 v1 的 REMOVED 记录 vs 保留** —— v1 的要求从未成为规范 spec,「移除一个不存在的东西」不承载信息;保留反而会让读者以为规格树里曾经有过 v1。删除,并在本提案中记录其由来。

## Verification strategy

1. **守卫先行(RED)**:先写 `tests/specs/spec-corpus.test.ts`,运行应报出当前 7 项失败 —— 这是变更前的真实状态,不是构造的。
2. **逐项修复后转绿**:每修一份重跑,确认失败数单调下降至 0。
3. **跳过路径自证**:把 `openspec` 从 PATH 中滤除后运行守卫,确认它**打印跳过原因并判绿**,而非静默通过或误判红。
4. **内容保真核对**:`design-md-archetypes` 吸收的四条 Requirement 与 16 份 YAML + `_schema.yaml` 逐条对照(原型数、`_schema.yaml` 顶层 required 七项、锚点 hex 合法性)。
5. **无回归**:`npx vitest run` 全量 477 项仍绿、`npx tsc --noEmit` 零错、`npx eslint .` 零告警。
