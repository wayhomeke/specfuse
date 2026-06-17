export function composeGrillMeSkill(): string {
  return `---
name: grill-me
description: Pre-apply review — stress-test all artifacts before implementation. Use when artifacts are complete and you want a structured review before /opsx:apply.
---

Activate the **Pre-Apply Review (Grill)** protocol defined in CLAUDE.md.

Follow the "Pre-Apply Review (Grill)" section rules exactly:
1. Backup change directory to \`.grill-backup/\` before grill begins
2. Review all artifacts (proposal, design, specs, tasks) one question at a time
3. Each question: [blocking/non-blocking] + issue + recommended answer + modification preview
4. Direct-modify artifacts on acceptance (user must see final diff before write)
5. Run consistency scan before summary
6. Output summary and prompt \`/opsx:apply\`

Exit commands: \`grill-stop\` (keep changes), \`grill-abort\` (rollback from backup).
`;
}
