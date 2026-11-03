import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  rmSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * FuseQA case — authored per `.claude/skills/fuseqa/templates` contracts.
 *
 *   artifact:   dist/index.js (the build output), invoked as a real process
 *   entry:      subprocess with argv through a symlinked bin shim
 *   isolation:  scratch directory, scratch HOME/XDG_CONFIG_HOME, OpenSpec off
 *               PATH, stub npm that fails instantly
 *   observable: the CLI's stdout
 *   traces-to:  spec cli-version-banner / Scenarios "Non-interactive run prints
 *               the banner", "Banner is printed once", "Version output stays
 *               bare", "Help output stays banner-free"
 *
 * Why this cannot be a unit test: the unit assertion covers the formatter only.
 * Whether the action actually prints the line before scaffolding is observable
 * only by running the built CLI.
 */
const DIST = path.resolve(import.meta.dirname, "..", "..", "..", "dist", "index.js");
const PKG = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, "..", "..", "..", "package.json"), "utf-8"),
) as { version: string };

describe("the scaffolder prints its version", () => {
  let dir: string;
  let shim: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error("run `npm run build` before this suite");
    dir = mkdtempSync(path.join(tmpdir(), "version-banner-e2e-"));
    const home = path.join(dir, "home");
    mkdirSync(path.join(home, ".config"), { recursive: true });

    const binDir = path.join(dir, "node_modules", ".bin");
    mkdirSync(binDir, { recursive: true });
    shim = path.join(binDir, "create-specfuse");
    symlinkSync(DIST, shim);

    const narrowPath = (process.env.PATH ?? "")
      .split(path.delimiter)
      .filter((p) => !existsSync(path.join(p, "openspec")))
      .join(path.delimiter);
    const stubBin = path.join(dir, "stub-bin");
    mkdirSync(stubBin, { recursive: true });
    writeFileSync(path.join(stubBin, "npm"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });

    env = {
      ...process.env,
      HOME: home,
      XDG_CONFIG_HOME: path.join(home, ".config"),
      PATH: `${stubBin}${path.delimiter}${narrowPath}`,
      GIT_AUTHOR_NAME: "FuseQA",
      GIT_AUTHOR_EMAIL: "fuseqa@example.invalid",
      GIT_COMMITTER_NAME: "FuseQA",
      GIT_COMMITTER_EMAIL: "fuseqa@example.invalid",
    };
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const run = (args: string[]) =>
    execFileSync(process.execPath, [shim, ...args], { encoding: "utf-8", cwd: dir, env });

  it("prints the banner as the first stdout line, once, matching package.json", () => {
    const out = run(["banner-a", "--yes"]);
    const lines = out.split("\n");

    expect(lines[0]).toBe(`SpecFuse v${PKG.version}`);
    expect(lines.filter((line) => line.startsWith("SpecFuse v"))).toHaveLength(1);
  });

  it("keeps --version bare", () => {
    const out = run(["--version"]);

    expect(out.trim()).toBe(PKG.version);
    expect(out).not.toContain("SpecFuse v");
  });

  it("keeps --help banner-free", () => {
    const out = run(["--help"]);

    expect(out).not.toContain(`SpecFuse v${PKG.version}`);
  });
});
