import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { composeSpecfuseCommand } from "../../src/templates/specfuse-command.js";

/**
 * This repository is scaffolded by its own tool, so `.claude/commands/` holds
 * a generated command file. The template owns the content; the installed file
 * is derived. Editing the installed copy diverges silently — regeneration from
 * the template is the only supported path.
 *
 * Contract: openspec/specs/specfuse-auto-mode/
 */
const REPO = path.resolve(import.meta.dirname, "..", "..");
const INSTALLED = path.join(REPO, ".claude", "commands", "specfuse.md");

describe("installed specfuse command equals its rendered output", () => {
  it("is present in this repository", () => {
    expect(existsSync(INSTALLED), `${INSTALLED} is missing`).toBe(true);
  });

  it("matches composeSpecfuseCommand() byte for byte", () => {
    expect(readFileSync(INSTALLED, "utf-8")).toBe(composeSpecfuseCommand());
  });
});
