import { z } from 'zod';
export const stackCommandsSchema = z.object({
    build: z.string().min(1),
    test: z.string().min(1),
    lint: z.string().min(1),
    format: z.string().optional(),
    typecheck: z.string().optional(),
});
export const stackProfileSchema = z.object({
    id: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Must be kebab-case'),
    label: z.string().min(1),
    languages: z.array(z.string().min(1)).min(1),
    framework: z.string().optional(),
    architecture: z.string().min(1),
    commands: stackCommandsSchema,
    errorHandling: z.string().min(1),
    concurrency: z.string().min(1),
    permissions: z.array(z.string().min(1)).min(1),
    gitignorePatterns: z.array(z.string().min(1)).min(1),
    openspecContext: z.string().min(1),
    openspecRules: z.record(z.string(), z.array(z.string().min(1))),
});
//# sourceMappingURL=schema.js.map