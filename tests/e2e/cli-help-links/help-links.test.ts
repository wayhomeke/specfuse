import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, mkdirSync, symlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * FuseQA case — authored per `.claude/skills/fuseqa/templates` contracts.
 *
 *   artifact:   dist/index.js (the build output), invoked as a real process
 *   entry:      subprocess with argv through a symlinked bin shim
 *   isolation:  one scratch directory, removed on teardown
 *   observable: the help text on stdout
 *   traces-to:  spec cli-help-links / Scenarios "Repository link present",
 *               "README link present", "Version output unchanged"
 *
 * Why this cannot be a unit test: the unit guard in `tests/cli-entrypoint.test.ts`
 * also spawns the built CLI, but this capability's contract is the help footer
 * a package manager installs. Keeping the case under its own capability means
 * the ledger can locate and retire it by the same name as the spec.
 */
const DIST = path.resolve(import.meta.dirname, "..", "..", "..", "dist", "index.js");

describe("help output links to the repository and README", () => {
  let dir: string;
  let shim: string;

  beforeAll(() => {
    if (!existsSync(DIST)) throw new Error("run `npm run build` before this suite");
    dir = mkdtempSync(path.join(tmpdir(), "help-links-e2e-"));
    const binDir = path.join(dir, "node_modules", ".bin");
    mkdirSync(binDir, { recursive: true });
    shim = path.join(binDir, "create-specfuse");
    symlinkSync(DIST, shim);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const run = (args: string[]) =>
    execFileSync(process.execPath, [shim, ...args], { encoding: "utf-8", cwd: dir });

  it("prints both links in the help footer", () => {
    const help = run(["--help"]);

    expect(help).toMatch(/^Repository: https:\/\/github\.com\/wayhomeke\/specfuse$/m);
    expect(help).toMatch(
      /^Documentation: https:\/\/github\.com\/wayhomeke\/specfuse\/blob\/main\/README\.md$/m,
    );
    expect(help.indexOf("Repository:")).toBeGreaterThan(help.indexOf("-h, --help"));
  });

  it("keeps version output free of links", () => {
    const version = run(["--version"]);

    expect(version.trim()).toMatch(/^\d+\.\d+\.\d+$/);
    expect(version).not.toContain("github.com");
  });
});
