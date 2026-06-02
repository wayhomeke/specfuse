export interface DetectionConfig {
    stackId: string;
    markerFiles: string[];
    markerDirs: string[];
    fileExtensions: string[];
    priority: number;
}
export declare function registerDetectionConfigs(configs: DetectionConfig[]): void;
export declare function getDetectionConfigs(): DetectionConfig[];
export declare function detectStacks(targetDir: string): Promise<string[]>;
//# sourceMappingURL=detect.d.ts.map