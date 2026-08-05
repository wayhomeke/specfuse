import { describe, it, expect } from "vitest";
import { composeGrillMeSkill } from "../../src/templates/grill-me-skill.js";

describe("grill-me-skill template", () => {
  const output = composeGrillMeSkill();

  it("returns non-empty string", () => {
    expect(output.length).toBeGreaterThan(0);
  });

  it("starts with --- frontmatter containing name: grill-me", () => {
    expect(output.startsWith("---\n")).toBe(true);
    const frontmatter = output.split("---")[1];
    expect(frontmatter).toContain("name: grill-me");
  });

  it("frontmatter contains non-empty description", () => {
    const frontmatter = output.split("---")[1];
    expect(frontmatter).toMatch(/description:\s*.+/);
  });

  it("contains reference to CLAUDE.md and Pre-Apply Review", () => {
    expect(output).toContain("CLAUDE.md");
    expect(output).toContain("Pre-Apply Review");
  });

  it("contains .grill-backup/", () => {
    expect(output).toContain(".grill-backup/");
  });

  it("contains grill-stop and grill-abort", () => {
    expect(output).toContain("grill-stop");
    expect(output).toContain("grill-abort");
  });

  it("accepts zero arguments", () => {
    expect(composeGrillMeSkill.length).toBe(0);
  });

  it("contains per-artifact review surface markers", () => {
    for (const marker of [
      "[proposal.md]",
      "[design.md]",
      "[specs/]",
      "[tasks/]",
    ]) {
      expect(output).toContain(marker);
    }
  });

  it("contains structural contract checkpoints", () => {
    expect(output.toLowerCase()).toContain("signature contract");
    expect(output.toLowerCase()).toContain("assertion strength");
  });

  it("contains soft limit of nine questions", () => {
    expect(output).toContain("After 9 questions");
  });
});
