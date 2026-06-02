import { access, readdir } from 'node:fs/promises';
import path from 'node:path';
let _configs = [];
export function registerDetectionConfigs(configs) {
    _configs = configs;
}
export function getDetectionConfigs() {
    return _configs;
}
async function exists(p) {
    try {
        await access(p);
        return true;
    }
    catch {
        return false;
    }
}
async function detectByMarkers(targetDir, configs) {
    const detected = new Set();
    for (const config of configs) {
        let found = false;
        for (const marker of config.markerFiles) {
            if (marker.includes('*')) {
                try {
                    const entries = await readdir(targetDir);
                    const pattern = marker.replace('*', '');
                    if (entries.some(e => e.endsWith(pattern))) {
                        found = true;
                        break;
                    }
                }
                catch {
                    continue;
                }
            }
            else if (await exists(path.join(targetDir, marker))) {
                found = true;
                break;
            }
        }
        if (!found) {
            for (const dir of config.markerDirs) {
                if (await exists(path.join(targetDir, dir))) {
                    found = true;
                    break;
                }
            }
        }
        if (found) {
            detected.add(config.stackId);
        }
    }
    return Array.from(detected);
}
async function detectByExtensions(targetDir, configs) {
    let entries;
    try {
        entries = await readdir(targetDir);
    }
    catch {
        return [];
    }
    const extMap = new Map();
    for (const config of configs) {
        for (const ext of config.fileExtensions) {
            if (!extMap.has(ext)) {
                extMap.set(ext, config.stackId);
            }
        }
    }
    const detected = new Set();
    for (const entry of entries) {
        const ext = path.extname(entry).toLowerCase();
        const stackId = extMap.get(ext);
        if (stackId) {
            detected.add(stackId);
        }
    }
    return Array.from(detected);
}
export async function detectStacks(targetDir) {
    try {
        const configs = getDetectionConfigs();
        if (configs.length === 0)
            return [];
        const markerResults = await detectByMarkers(targetDir, configs);
        let detected;
        if (markerResults.length > 0) {
            detected = markerResults;
        }
        else {
            detected = await detectByExtensions(targetDir, configs);
        }
        const priorityMap = new Map();
        configs.forEach((c, i) => priorityMap.set(c.stackId, c.priority * 1000 + i));
        detected.sort((a, b) => (priorityMap.get(a) ?? 999) - (priorityMap.get(b) ?? 999));
        return detected;
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=detect.js.map