import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stringify as toYAML } from 'yaml';
export async function createDir(dir) {
    await mkdir(dir, { recursive: true });
}
export async function writeText(filePath, content) {
    await createDir(path.dirname(filePath));
    await writeFile(filePath, content, 'utf-8');
}
export async function writeJSON(filePath, obj) {
    await writeText(filePath, JSON.stringify(obj, null, 2) + '\n');
}
export async function writeYAML(filePath, obj) {
    await writeText(filePath, toYAML(obj, { lineWidth: 120 }));
}
//# sourceMappingURL=fs.js.map