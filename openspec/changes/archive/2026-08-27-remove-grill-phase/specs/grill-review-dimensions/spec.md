## REMOVED Requirements

### Requirement: SKILL.md defines per-artifact review surfaces
**Reason**: 技能模板整体删除。
**Migration**: 无；制品审查回归 Path A/B 的人工审阅。

### Requirement: Structural contract checkpoints cover the signature-conflict family
**Reason**: 随技能模板移除。
**Migration**: 签名冲突类缺陷由 design/specs 制品审阅与实施期 TDD 兜底，无专门检查工具。

### Requirement: Assertion-strength triage boundary
**Reason**: 随技能模板移除。
**Migration**: 断言强度在实施层由 FuseReview 的 [test-strength] 检查承接；制品层分流取消。

### Requirement: Soft limit of nine questions
**Reason**: 随技能模板移除。
**Migration**: 无。
