import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { composeCLAUDEmd } from "../../src/templates/claude-md.js";

/**
 * This repository is scaffolded by its own tool, so its `CLAUDE.md` carries a
 * generated FUSION block. The composer owns that block; the installed file is
 * derived. Regenerating is what keeps `/specfuse`'s override visible to the
 * agent reading this repository's own instructions — without it the command
 * arrives while the MUST-level interactive checkpoints remain unqualified.
 *
 * Contract: openspec/specs/specfuse-auto-mode/
 */
const REPO = path.resolve(import.meta.dirname, "..", "..");
const START = "<!-- FUSION:START -->";
const END = "<!-- FUSION:END -->";

function fusionBlock(text: string): string {
  const from = text.indexOf(START);
  const to = text.indexOf(END);
  expect(from, "missing FUSION:START").toBeGreaterThan(-1);
  expect(to, "missing FUSION:END").toBeGreaterThan(from);
  return text.slice(from, to + END.length);
}

describe("installed CLAUDE.md fusion block equals its rendered output", () => {
  const installed = readFileSync(path.join(REPO, "CLAUDE.md"), "utf-8");
  const rendered = composeCLAUDEmd({ projectName: "specfuse" });

  it("contains the Auto Mode section", () => {
    expect(installed).toContain("### Auto Mode: /specfuse");
  });

  it("matches composeCLAUDEmd() between the FUSION markers", () => {
    expect(fusionBlock(installed)).toBe(fusionBlock(rendered));
  });
});
