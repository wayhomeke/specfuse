import { z } from 'zod';
export declare const stackCommandsSchema: z.ZodObject<{
    build: z.ZodString;
    test: z.ZodString;
    lint: z.ZodString;
    format: z.ZodOptional<z.ZodString>;
    typecheck: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    build: string;
    test: string;
    lint: string;
    format?: string | undefined;
    typecheck?: string | undefined;
}, {
    build: string;
    test: string;
    lint: string;
    format?: string | undefined;
    typecheck?: string | undefined;
}>;
export declare const stackProfileSchema: z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    languages: z.ZodArray<z.ZodString, "many">;
    framework: z.ZodOptional<z.ZodString>;
    architecture: z.ZodString;
    commands: z.ZodObject<{
        build: z.ZodString;
        test: z.ZodString;
        lint: z.ZodString;
        format: z.ZodOptional<z.ZodString>;
        typecheck: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        build: string;
        test: string;
        lint: string;
        format?: string | undefined;
        typecheck?: string | undefined;
    }, {
        build: string;
        test: string;
        lint: string;
        format?: string | undefined;
        typecheck?: string | undefined;
    }>;
    errorHandling: z.ZodString;
    concurrency: z.ZodString;
    permissions: z.ZodArray<z.ZodString, "many">;
    gitignorePatterns: z.ZodArray<z.ZodString, "many">;
    openspecContext: z.ZodString;
    openspecRules: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    label: string;
    languages: string[];
    architecture: string;
    commands: {
        build: string;
        test: string;
        lint: string;
        format?: string | undefined;
        typecheck?: string | undefined;
    };
    errorHandling: string;
    concurrency: string;
    permissions: string[];
    gitignorePatterns: string[];
    openspecContext: string;
    openspecRules: Record<string, string[]>;
    framework?: string | undefined;
}, {
    id: string;
    label: string;
    languages: string[];
    architecture: string;
    commands: {
        build: string;
        test: string;
        lint: string;
        format?: string | undefined;
        typecheck?: string | undefined;
    };
    errorHandling: string;
    concurrency: string;
    permissions: string[];
    gitignorePatterns: string[];
    openspecContext: string;
    openspecRules: Record<string, string[]>;
    framework?: string | undefined;
}>;
//# sourceMappingURL=schema.d.ts.map