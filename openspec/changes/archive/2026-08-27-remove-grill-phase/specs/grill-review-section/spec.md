## REMOVED Requirements

### Requirement: renderGrillReview function exists
**Reason**: Grill 拍整体移除，协议段落渲染函数删除。
**Migration**: 无替代渲染物。

### Requirement: Grill section inserted in correct position
**Reason**: 段落随函数删除；`composeCLAUDEmd()` 不再包含 Grill 段落。
**Migration**: 流水线顺序变为 Think → Do → FuseReview → Verify。

### Requirement: Trigger prompt content
**Reason**: 制品完成后不再强制提示 `/grill-me`。
**Migration**: 制品完成后直接进入 `/opsx:apply`（含既有的模型切换节拍）。

### Requirement: Review dimensions listed
**Reason**: 随协议段落移除。
**Migration**: 无。

### Requirement: Problem classification with blocking categories
**Reason**: 随协议段落移除。
**Migration**: 阻塞/建议分级在 FuseReview 的输出纪律中延续。

### Requirement: Backup and rollback mechanism
**Reason**: 随协议段落移除；`.grill-backup/` 不再生成。
**Migration**: 无。

### Requirement: Exit commands
**Reason**: 随协议段落移除。
**Migration**: 无。

### Requirement: Soft question limit
**Reason**: 随协议段落移除。
**Migration**: 无。

### Requirement: Consistency scan at end
**Reason**: 随协议段落移除。
**Migration**: 制品间一致性依赖逐制品人工审阅与 `/opsx:verify` 的对照。

### Requirement: Summary format at grill end
**Reason**: 随协议段落移除。
**Migration**: 无。

### Requirement: Modification protocol
**Reason**: 随协议段落移除。
**Migration**: 无。

### Requirement: Gitignore includes grill-backup
**Reason**: `.grill-backup/` 不再产生，生成的 `.gitignore` 移除该模式。
**Migration**: 存量项目已有的行保留（追加式合并）。
