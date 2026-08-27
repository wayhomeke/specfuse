## REMOVED Requirements

### Requirement: Protocol adds Data-flow integrity dimension
**Reason**: Grill 协议段落整体移除；该维度随段落删除。
**Migration**: 数据流完整性思想在 FuseReview 的 [test-strength]/[scope-fit] 检查中以实现层形态延续，制品层的签名代入检查不再提供。

### Requirement: Soft limit set to nine
**Reason**: 随协议段落移除。
**Migration**: 无。

### Requirement: Consistency scan is bidirectional
**Reason**: 随协议段落移除。
**Migration**: 制品与实现的正向对照由 `/opsx:verify` 承接；反向（spec 输入 → 签名参数位）不再有机制化检查。
