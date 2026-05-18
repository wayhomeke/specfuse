import type { StackProfile } from '../types.js';
export declare function getBuiltinStacks(): StackProfile[];
export declare function getStack(id: string): StackProfile | undefined;
export declare function loadCustomStack(filePath: string): Promise<StackProfile>;
//# sourceMappingURL=index.d.ts.map