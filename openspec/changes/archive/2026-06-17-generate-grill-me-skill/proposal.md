## Why

SpecFuse 生成的 CLAUDE.md 中已包含完整的 "Pre-Apply Review (Grill)" 协议规则，但用户无法通过 `/grill-me` slash 命令触发它。Claude Code 的 skill 通过 `.claude/skills/<name>/SKILL.md` 文件自动发现注册。scaffolder 需要在初始化项目时生成这个 skill 文件，使 `/grill-me` 命令开箱可用。

## What Changes

- 新增模板函数 `composeGrillMeSkill()` 生成 SKILL.md 内容
- scaffolder 在写入 `.claude/settings.local.json` 之后生成 `.claude/skills/grill-me/SKILL.md`
- 已存在的 skill 文件不会被覆盖（保护用户自定义）

## Non-goals

- 不修改 CLAUDE.md 中已有的 grill 规则内容
- 不依赖外部 grill-me 包或安装——完全自包含
- 不修改 `openspec init` 的行为（它生成 openspec-* skills，grill-me 由 scaffolder 自己生成）
- skill 内容不重复 CLAUDE.md 的完整协议——只激活模式并引用 CLAUDE.md 规则

## Trade-offs

| Alternative | Why rejected |
|---|---|
| 让用户手动安装 grill-me skill（从 GitHub 复制） | 增加摩擦，违背 SpecFuse "开箱即用"的设计理念 |
| 把完整协议写在 SKILL.md 中（不依赖 CLAUDE.md） | 导致协议定义有两处来源，维护时容易不一致。SKILL.md 应轻量，指向 CLAUDE.md 作为 single source of truth |

## Capabilities

### New Capabilities
- `grill-me-skill-generation`: scaffolder 生成 `.claude/skills/grill-me/SKILL.md` 文件的能力

### Modified Capabilities

## Impact

- `src/templates/grill-me-skill.ts`（新文件）：模板函数
- `src/scaffolder.ts`：新增 skill 文件写入步骤
- `tests/templates/grill-me-skill.test.ts`（新文件）：模板测试
- `tests/scaffolder.test.ts`：新增 greenfield 断言
