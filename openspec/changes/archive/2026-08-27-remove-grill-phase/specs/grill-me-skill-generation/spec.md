## REMOVED Requirements

### Requirement: composeGrillMeSkill function exists
**Reason**: Grill 拍整体移除，技能模板不再需要。
**Migration**: 无替代；存量目标项目的技能文件保留为纯手动技能。

### Requirement: SKILL.md contains valid frontmatter
**Reason**: 随技能模板移除。
**Migration**: 无。

### Requirement: SKILL.md is a self-contained review method
**Reason**: 随技能模板移除；实施后审查由 FuseReview 承接，实施前审查取消。
**Migration**: 制品质量把关依赖 Path A/B 的人工审阅与 FuseReview 检查点。

### Requirement: SKILL.md contains protocol activation steps
**Reason**: 随技能模板移除。
**Migration**: 无。

### Requirement: Scaffolder generates skill file
**Reason**: 脚手架停止分发 grill-me 技能。
**Migration**: 存量项目已安装的文件保留不动（脚手架无删除逻辑）。

### Requirement: Scaffolder does not overwrite existing skill file
**Reason**: 分发行为整体移除，不覆盖约束随之失效。
**Migration**: 无。
