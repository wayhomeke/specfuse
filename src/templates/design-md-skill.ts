export function composeDesignMdSkill(): string {
  return `---
name: design-md
description: Generate a DESIGN.md file for the current project via interactive questionnaire and archetype matching. Use for brownfield projects that need design tokens.
---

Generate a \`DESIGN.md\` file in the current working directory.

**Trigger:** User invokes \`/design-md\` manually in a brownfield project.

**What it does:**

1. Runs a 5-question interactive questionnaire (product type, audience, mood, density, reference)
2. Derives a dimension vector from answers
3. Matches against 15 design archetypes using weighted Euclidean distance + category bonus
4. Presents the best match for confirmation
5. Optionally allows fine-tuning individual dimensions (1-5 scale)
6. Renders DESIGN.md with YAML front matter (design tokens) + Markdown rationale

**Usage:**

\`\`\`
import { generateDesignMd } from 'specfuse/design-md';
const result = await generateDesignMd(process.cwd());
\`\`\`

If \`DESIGN.md\` already exists, prompts for overwrite confirmation and creates a \`.bak\` backup.

Returns the output file path on success, or \`null\` if the user aborts.
`;
}
