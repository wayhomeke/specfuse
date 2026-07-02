# Design: design-md-production-quality

## Context

specfuse 当前 design-md 系统依赖 Node.js 运行时（questionnaire → matcher → renderer），但实际消费者是 Claude 读取 SKILL.md 指令。本设计将该系统重构为纯静态文件分发架构：SKILL.md 作为 Claude 的完整生成指南 + 混合种子模板 YAML。

## Goals

- 输出质量对齐 awesome-design-md 标准（Airbnb 级别：15+ 语义色、完整字体系统、命名间距/圆角/阴影、组件 token 交叉引用）
- 移除所有 Node.js 运行时生成逻辑
- SKILL.md 成为 Claude 生成 DESIGN.md 的唯一权威指南
- 混合种子模板提供意图方向 + 具体参考锚点

## Non-Goals

- CLI 模式生成（无 `specfuse design-md` 命令）
- 暗色/亮色主题切换
- 动画/motion token
- 图标系统
- Figma 集成

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  specfuse scaffold / init                                │
│                                                          │
│  src/templates/design-md-skill.ts  ──→  SKILL.md        │
│  src/design-md/templates/*.yaml    ──→  templates/*.yaml │
│                                                          │
│  src/scaffolder.ts (copyFile loop, unchanged)            │
└─────────────────────────────────────────────────────────┘
          │
          │ Static file copy (no runtime transform)
          ▼
┌─────────────────────────────────────────────────────────┐
│  Target project: .claude/skills/design-md/               │
│                                                          │
│  SKILL.md          ← Claude 生成指南（完整流程）          │
│  templates/        ← 16 混合种子 YAML + _schema.yaml    │
└─────────────────────────────────────────────────────────┘
          │
          │ Claude reads SKILL.md → follows instructions
          ▼
┌─────────────────────────────────────────────────────────┐
│  Output: DESIGN.md                                       │
│                                                          │
│  YAML front matter:                                      │
│    colors: {primary, secondary, ...15+ semantic tokens}  │
│    typography: {scale with size/weight/lineHeight/...}   │
│    spacing: {6 named levels}                             │
│    rounded: {6 named levels}                             │
│    elevation: {shadow system}                            │
│    components: {8-10 universal definitions}              │
│    breakpoints: {responsive system}                      │
│                                                          │
│  Markdown body:                                          │
│    Design philosophy + decision rationale narrative      │
└─────────────────────────────────────────────────────────┘
```

## Component Hierarchy

```
SKILL.md (generation guide)
├── §1 Questionnaire Logic
│   ├── 5-question interactive flow
│   ├── Dimension vector derivation rules
│   └── Archetype matching algorithm (weighted Euclidean + category bonus)
├── §2 Token Derivation Rules
│   ├── Color: primary → semantic expansion rules (15+ tokens)
│   ├── Typography: base size → full scale derivation
│   ├── Spacing: density dimension → named 6-level system
│   ├── Rounded: borderRadius dimension → named 6-level system
│   ├── Elevation: tone dimension → shadow system
│   ├── Components: universal component token definitions
│   └── Cross-reference syntax: "{category.token}"
├── §3 Output Format Specification
│   ├── YAML front matter schema (complete token structure)
│   └── Markdown body structure (philosophy + rationale)
└── §4 Archetype Template Reference
    └── How to read and adapt hybrid seed templates

templates/*.yaml (hybrid seed format, per archetype)
├── Meta: id, name, category
├── Intent: mood description, density intent, design philosophy
├── Anchors: concrete reference values (hex colors, px, rem)
│   ├── colors.primary, colors.auxiliary[0..1]
│   ├── typography.baseSize, typography.scale
│   ├── spacing.unit
│   └── radius.base
└── Structure: required output sections with depth hints
```

## Public API Surface

### Archetype YAML Schema (v2 — hybrid seed)

```yaml
id: string                    # kebab-case identifier
name: string                  # human-readable name
category: enum                # product category for matching bonus

intent:
  mood: string                # directional guidance (e.g., "warm and approachable")
  density: string             # UI density description
  philosophy: string          # design philosophy narrative seed

dimensions:
  colorTemp: 1-5
  lightness: 1-5
  density: 1-5
  borderRadius: 1-5
  tone: 1-5

anchors:
  colors:
    primary: string           # hex value
    auxiliary: string[]       # 1-2 hex values
  typography:
    baseSize: string          # e.g., "16px"
    scale: number             # e.g., 1.25 (major third)
  spacing:
    unit: string              # e.g., "8px"
  radius:
    base: string              # e.g., "6px"

structure:
  requiredSections: string[]  # output sections that must appear
  componentTokens: string[]   # which component definitions to include
```

### SKILL.md Contract (consumed by Claude)

SKILL.md is a Markdown instruction document. Claude reads it when `/design-md` is invoked. It contains:

1. **Trigger**: `/design-md` invocation
2. **Questionnaire**: 5 questions with dimension mapping
3. **Matching**: Algorithm to select best archetype from templates/
4. **Derivation**: Rules to expand archetype anchors into full L2 token set
5. **Output**: Exact YAML front matter schema + Markdown body structure
6. **Backup**: If DESIGN.md exists, create `.bak` before overwriting

### Cross-Reference Syntax

Component tokens reference design tokens using `"{category.token}"` format:

```yaml
components:
  button:
    background: "{colors.primary}"
    borderRadius: "{rounded.md}"
    paddingX: "{spacing.md}"
    fontSize: "{typography.body.size}"
```

## Decisions

### D1: Hybrid Seed Strategy (Intent + Anchors)

Templates contain both:
- **Intent descriptions** (mood, density philosophy) — Claude uses for directional adaptation
- **Concrete reference anchors** (hex colors, px values) — Claude uses as numerical baseline

Why: Pure intent leads to arbitrary values; pure seed removes Claude's ability to adapt. Hybrid gives deterministic starting points while allowing contextual reasoning.

### D2: L2 Token Depth

Full token system at generation time:
- 15+ semantic colors (not just primary/secondary)
- Type scale with size/weight/lineHeight/letterSpacing per level
- 6 named spacing levels (xs through 3xl)
- 6 named radius levels
- Elevation/shadow system (3-4 levels)
- 8-10 universal component token definitions
- Responsive breakpoints

Why: This matches awesome-design-md standard. Shallow tokens (current 5-color system) are insufficient for real implementation.

### D3: YAML Front Matter = Tokens, Markdown Body = Rationale

Output format mirrors awesome-design-md convention:
- Front matter holds all structured token data (machine-parseable)
- Body contains design philosophy and decision rationale (human-readable)

Why: Validated against actual Airbnb DESIGN.md on GitHub. Enables downstream tools to parse tokens while preserving design intent narrative.

### D4: Static File Distribution Only

`src/scaffolder.ts` copies SKILL.md + template YAMLs to target project. No runtime transformation, no dynamic generation, no CLI command.

Why: The actual generator is Claude following SKILL.md instructions. Node.js runtime adds complexity with zero value — Claude cannot import/execute it.

### D5: Remove @inquirer/prompts Dependency

Questionnaire logic moves into SKILL.md as instructions for Claude's interactive questioning. The npm dependency becomes dead code.

Why: No Node.js runtime means no programmatic prompts. Claude handles interactivity natively.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Claude misinterprets SKILL.md derivation rules | Low-quality token output | Extensive examples in SKILL.md; anchors provide fallback values |
| Template YAML schema too complex for maintenance | Hard to add new archetypes | Keep schema minimal; validate with _schema.yaml + tests |
| Breaking change for `generateDesignMd` importers | External consumers broken | Document in CHANGELOG; version bump to 0.4.0 |
| Anchor values become outdated design trends | Templates feel stale | Anchors are baselines, not final values; Claude adapts per project context |

## Error Handling Strategy

- **DESIGN.md exists**: SKILL.md instructs Claude to prompt user + create `.bak` backup (unchanged from current behavior)
- **Template YAML parse failure**: Claude falls back to SKILL.md's inline defaults (no runtime crash possible)
- **Missing template directory**: scaffolder.ts already handles via `readdir` — if src templates missing, build fails at compile time
- **Schema validation**: Tests validate all 16 YAML files against _schema.yaml at CI time

## Testing Strategy

1. **YAML schema compliance**: All 16 archetypes validate against updated _schema.yaml
2. **SKILL.md content correctness**: Snapshot test ensures SKILL.md contains required sections (questionnaire, derivation, output format)
3. **Scaffolder integration**: Existing tests already verify file copy behavior (retained unchanged)
4. **Cross-reference syntax**: Regex test ensures component tokens use valid `"{category.token}"` references in templates
