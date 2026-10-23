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
 *   observable: the files the scaffolded project receives
 *   traces-to:  spec specfuse-full / Scenarios "New project receives the full
 *               command", "Phase order stated", "Full variant named"
 *
 * Why this cannot be a unit test: the unit guards call
 * `composeSpecfuseFullCommand()` and `composeCLAUDEmd()` and read source-level
 * output. They cannot observe whether a scaffolded project receives the
 * namespaced command or the regenerated instruction file.
 */
const DIST = path.resolve(import.meta.dirname, "..", "..", "..", "dist", "index.js");

describe("a scaffolded project receives the complete unattended command", () => {
  let dir: string;
  let shim: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error("run `npm run build` before this suite");
    dir = mkdtempSync(path.join(tmpdir(), "specfuse-full-e2e-"));
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

  const scaffold = (name: string) => {
    run([name, "--yes"]);
    return path.join(dir, name);
  };

  it("writes both the default and the complete command", () => {
    const base = scaffold("full-a");
    const defaultCommand = path.join(base, ".claude", "commands", "specfuse.md");
    const fullCommand = path.join(base, ".claude", "commands", "specfuse", "full.md");

    expect(existsSync(defaultCommand), `${defaultCommand} is missing`).toBe(true);
    expect(existsSync(fullCommand), `${fullCommand} is missing`).toBe(true);
    expect(readFileSync(defaultCommand, "utf-8")).toContain("/specfuse <requirement description>");
    expect(readFileSync(fullCommand, "utf-8")).toContain("/specfuse:full <requirement description>");
  });

  it("the complete command orders FuseQA between FuseReview and Verify", () => {
    const base = scaffold("full-b");
    const command = readFileSync(
      path.join(base, ".claude", "commands", "specfuse", "full.md"),
      "utf-8",
    );

    for (const clause of [
      "record `auto: entered` and run the `fuseqa` skill",
      "### 4. FuseReview",
      "### 5. FuseQA",
      "### 6. Verify",
      "### 7. Archive",
      "FuseQA decision (`auto: entered`)",
      "Never run `git commit`, `git push`, or `git merge`",
    ]) {
      expect(command, `missing clause: ${clause}`).toContain(clause);
    }
    expect(command).not.toContain("auto: declined");
  });

  it("CLAUDE.md names /specfuse:full as the variant that enters FuseQA", () => {
    const base = scaffold("full-c");
    const md = readFileSync(path.join(base, "CLAUDE.md"), "utf-8");

    expect(md).toContain("/specfuse:full");
    expect(md).toMatch(/enters FuseQA after FuseReview and before Verify/i);
    expect(md).toMatch(/not part of the pipeline/i);
    expect(md).toMatch(/under `\/specfuse`/i);
  });

  it("prints the complete command in the file listing", () => {
    const out = run(["full-d", "--yes"]);

    expect(out).toContain(".claude/commands/specfuse/full.md");
  });
});
