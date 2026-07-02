import { stringify as yamlStringify, parse as parseYaml } from 'yaml';
import type { Archetype, DimensionVector } from './types.js';

export function renderDesignMd(archetype: Archetype, vector: DimensionVector): string {
  const templateTokens = parseYaml(archetype.template);

  const frontMatter = {
    archetype: archetype.id,
    dimensions: vector,
    tokens: templateTokens.tokens,
  };

  const yamlContent = yamlStringify(frontMatter).trim();

  const markdown = `
# Style Direction

Based on **${archetype.name}** archetype (reference: ${archetype.anchors.primary}).

Dimension profile: colorTemp=${vector.colorTemp}, lightness=${vector.lightness}, density=${vector.density}, borderRadius=${vector.borderRadius}, tone=${vector.tone}.

## Color Palette

Primary: \`${templateTokens.tokens.colors.primary}\`
Background: \`${templateTokens.tokens.colors.background}\`
Surface: \`${templateTokens.tokens.colors.surface}\`
Text: \`${templateTokens.tokens.colors.text}\`
Accent: \`${templateTokens.tokens.colors.accent}\`

## Typography

Font family: ${templateTokens.tokens.typography.fontFamily}
Scale: ${templateTokens.tokens.typography.scale.join(', ')}

## Spacing

Base unit: ${templateTokens.tokens.spacing.base}
Scale: ${templateTokens.tokens.spacing.scale.join(', ')}

## Components

Border radius: ${templateTokens.tokens.radius.default} (default), ${templateTokens.tokens.radius.large} (large)
Density: ${templateTokens.tokens.density.compact ? 'compact' : 'comfortable'}
Table row height: ${templateTokens.tokens.density.tableRowHeight}
`;

  return `---\n${yamlContent}\n---\n${markdown}`;
}
