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
 *   traces-to:  spec specfuse-auto-mode / Scenarios "New project receives the
 *               command", "Auto-mode section is present", "Interactive rules
 *               are preserved"
 *
 * Why this cannot be a unit test: the unit guards call
 * `composeSpecfuseCommand()` and `composeCLAUDEmd()` and read source-level
 * output. They cannot observe whether a scaffolded project receives either —
 * a regression in `scaffold()`'s write step, the build output, or the symlinked
 * bin path would leave every unit guard green.
 */
const DIST = path.resolve(import.meta.dirname, "..", "..", "..", "dist", "index.js");

describe("a scaffolded project receives the unattended command", () => {
  let dir: string;
  let shim: string;
  let env: NodeJS.ProcessEnv;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error("run `npm run build` before this suite");
    dir = mkdtempSync(path.join(tmpdir(), "specfuse-auto-e2e-"));
    const home = path.join(dir, "home");
    mkdirSync(path.join(home, ".config"), { recursive: true });

    const binDir = path.join(dir, "node_modules", ".bin");
    mkdirSync(binDir, { recursive: true });
    shim = path.join(binDir, "create-specfuse");
    symlinkSync(DIST, shim);

    // OpenSpec off PATH and a stub npm that fails instantly: this case asserts
    // on what the scaffold writes, not on OpenSpec provisioning.
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

  it("writes .claude/commands/specfuse.md into the project", () => {
    const base = scaffold("auto-a");
    const command = path.join(base, ".claude", "commands", "specfuse.md");

    expect(existsSync(command), `${command} is missing`).toBe(true);
    expect(readFileSync(command, "utf-8").length).toBeGreaterThan(0);
  });

  it("the command carries the unattended policy", () => {
    const base = scaffold("auto-b");
    const command = readFileSync(path.join(base, ".claude", "commands", "specfuse.md"), "utf-8");

    for (const clause of [
      "$ARGUMENTS",
      "Do not call AskUserQuestion",
      "continue with current model",
      "auto: entered",
      "auto: declined",
      "Archive only when every verify check passes",
      "Never run `git commit`, `git push`, or `git merge`",
    ]) {
      expect(command, `missing clause: ${clause}`).toContain(clause);
    }
  });

  it("CLAUDE.md declares Auto Mode and keeps the interactive checkpoints", () => {
    const base = scaffold("auto-c");
    const md = readFileSync(path.join(base, "CLAUDE.md"), "utf-8");

    expect(md).toContain("### Auto Mode: /specfuse");
    expect(md).toContain("continue with current model");
    expect(md).toContain("auto: entered");
    expect(md).toContain("auto: declined");
    expect(md).toContain("### Phase 2.5: FuseReview Checkpoint");
    expect(md).toContain("### Phase 2.6: FuseQA Checkpoint");
  });

  it("prints the command in the file listing", () => {
    const out = run(["auto-d", "--yes"]);

    expect(out).toContain(".claude/commands/specfuse.md");
  });
});
