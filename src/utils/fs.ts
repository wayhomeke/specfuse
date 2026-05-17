import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { stringify as toYAML } from 'yaml';

export async function createDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function writeText(filePath: string, content: string): Promise<void> {
  await createDir(path.dirname(filePath));
  await writeFile(filePath, content, 'utf-8');
}

export async function writeJSON(filePath: string, obj: object): Promise<void> {
  await writeText(filePath, JSON.stringify(obj, null, 2) + '\n');
}

export async function writeYAML(filePath: string, obj: object): Promise<void> {
  await writeText(filePath, toYAML(obj, { lineWidth: 120 }));
}
