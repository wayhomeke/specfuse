export function composeOpenspecConfig(ctx) {
    return {
        schema: 'spec-driven',
        context: ctx.stack.openspecContext,
        rules: ctx.stack.openspecRules,
    };
}
//# sourceMappingURL=openspec-config.js.map