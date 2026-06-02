import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { detectStacks, getDetectionConfigs } from '../../src/stacks/detect.js';
// Trigger registration of detection configs
import '../../src/stacks/index.js';

describe('stack detection', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = path.join(os.tmpdir(), `detect-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array for empty directory', async () => {
    const result = await detectStacks(tmpDir);
    expect(result).toEqual([]);
  });

  it('returns empty array for non-existent directory', async () => {
    const result = await detectStacks('/non-existent-path-xyz');
    expect(result).toEqual([]);
  });

  it('detects rust via Cargo.toml marker file', async () => {
    writeFileSync(path.join(tmpDir, 'Cargo.toml'), '[package]\nname = "test"');
    const result = await detectStacks(tmpDir);
    expect(result).toContain('rust');
  });

  it('detects go via go.mod marker file', async () => {
    writeFileSync(path.join(tmpDir, 'go.mod'), 'module example.com/test');
    const result = await detectStacks(tmpDir);
    expect(result).toContain('go');
  });

  it('detects java-maven via pom.xml', async () => {
    writeFileSync(path.join(tmpDir, 'pom.xml'), '<project></project>');
    const result = await detectStacks(tmpDir);
    expect(result).toContain('java-maven');
  });

  it('detects java-gradle via build.gradle', async () => {
    writeFileSync(path.join(tmpDir, 'build.gradle'), 'apply plugin: "java"');
    const result = await detectStacks(tmpDir);
    expect(result).toContain('java-gradle');
  });

  it('detects typescript-react via package.json', async () => {
    writeFileSync(path.join(tmpDir, 'package.json'), '{}');
    const result = await detectStacks(tmpDir);
    expect(result).toContain('typescript-react');
  });

  it('detects python-fastapi via requirements.txt', async () => {
    writeFileSync(path.join(tmpDir, 'requirements.txt'), 'fastapi');
    const result = await detectStacks(tmpDir);
    expect(result).toContain('python-fastapi');
  });

  it('detects multiple stacks and sorts by priority', async () => {
    writeFileSync(path.join(tmpDir, 'go.mod'), 'module test');
    writeFileSync(path.join(tmpDir, 'package.json'), '{}');
    const result = await detectStacks(tmpDir);
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result).toContain('go');
    expect(result).toContain('typescript-react');
    const goIdx = result.indexOf('go');
    const tsIdx = result.indexOf('typescript-react');
    expect(goIdx).toBeLessThan(tsIdx);
  });

  it('falls back to extension scan when no markers match', async () => {
    writeFileSync(path.join(tmpDir, 'script.sh'), '#!/bin/bash');
    const result = await detectStacks(tmpDir);
    expect(result).toContain('bash');
  });

  it('extension scan does not recurse into subdirectories', async () => {
    mkdirSync(path.join(tmpDir, 'sub'), { recursive: true });
    writeFileSync(path.join(tmpDir, 'sub', 'main.rs'), 'fn main() {}');
    const result = await detectStacks(tmpDir);
    expect(result).not.toContain('rust');
  });

  it('never throws on permission errors', async () => {
    const result = await detectStacks('/root/no-access-path');
    expect(result).toEqual([]);
  });

  it('all detection configs have required fields', () => {
    const configs = getDetectionConfigs();
    for (const config of configs) {
      expect(config.stackId).toBeTruthy();
      expect(config.priority).toBeTypeOf('number');
      expect(Array.isArray(config.markerFiles)).toBe(true);
      expect(Array.isArray(config.markerDirs)).toBe(true);
      expect(Array.isArray(config.fileExtensions)).toBe(true);
    }
  });

  it('detection configs cover all built-in stacks', () => {
    const configs = getDetectionConfigs();
    const configIds = configs.map(c => c.stackId);
    expect(configIds.length).toBeGreaterThanOrEqual(15);
    expect(new Set(configIds).size).toBe(configIds.length);
  });
});
