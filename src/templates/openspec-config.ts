import type { TemplateContext } from '../types.js';

export function composeOpenspecConfig(ctx: TemplateContext): object {
  return {
    schema: 'spec-driven',
    context: ctx.stack.openspecContext,
    rules: ctx.stack.openspecRules,
  };
}
