import { describe, it, expect } from "vitest";
import { composeFuseReviewSkill } from "../../src/templates/fusereview-skill.js";

const ctx = { projectName: "test-app" };

describe("fusereview-skill template", () => {
  const output = composeFuseReviewSkill(ctx);
  const lower = output.toLowerCase();

  it("returns non-empty string", () => {
    expect(output.length).toBeGreaterThan(0);
  });

  it("contains no Grill trace and labels no beat by position", () => {
    // This assertion used to require the literal "fourth beat", which pinned the
    // stale ordinal in place: the string had been numbered when Grill occupied a
    // slot, and removing Grill shifted every beat down by one without the
    // assertion being revisited. Asserting absence is what keeps it from coming
    // back; the beat's identity is asserted by what it does, not where it sits.
    expect(lower).not.toContain("grill");
    expect(lower).not.toMatch(/\b(first|second|third|fourth|fifth|sixth)\s+(pipeline\s+)?beat\b/);
    expect(lower).toContain("post-apply code review");
  });

  it("starts with --- frontmatter containing name: fusereview", () => {
    expect(output.startsWith("---\n")).toBe(true);
    const frontmatter = output.split("---")[1];
    expect(frontmatter).toContain("name: fusereview");
  });

  it("frontmatter description covers colloquial triggers", () => {
    const frontmatter = output.split("---")[1];
    expect(frontmatter).toMatch(/description:\s*.+/);
    expect(frontmatter.toLowerCase()).toContain("code review");
  });

  it("accepts one argument (TemplateContext)", () => {
    expect(composeFuseReviewSkill.length).toBe(1);
  });

  it("defines the review object as baseline..HEAD with surrounding-code duty", () => {
    expect(output).toContain("baseline");
    expect(lower).toContain("surrounding code");
  });

  it("contains markers for all eleven checks", () => {
    for (const marker of [
      "[test-strength]",
      "[missing-detection]",
      "[scope-fit]",
      "[real-entry]",
      "[interface-both-sides]",
      "[lifecycle-concurrency]",
      "[enforcement-paths]",
      "[config-choices]",
      "[capability-consumer]",
      "[borrowed-state]",
      "[boundary-values]",
    ]) {
      expect(output).toContain(marker);
    }
  });

  it("test-strength check carries the regression recipe", () => {
    expect(lower).toContain("introduce the regression");
    expect(lower).toContain("revert");
  });

  it("lifecycle check carries the seven defect classes, scoped to its section", () => {
    const start = output.indexOf("### [lifecycle-concurrency]");
    const nextHeading = output.indexOf("### ", start + 1);
    expect(start).toBeGreaterThan(-1);
    expect(nextHeading).toBeGreaterThan(start);
    const section = output.slice(start, nextHeading).toLowerCase();
    for (const token of [
      "orthogonal",
      "normalize",
      "async",
      "quiescen",
      "callback",
      "untrusted",
      "symlink",
    ]) {
      expect(section).toContain(token);
    }
  });

  it("requires defect/location/impact/evidence per finding, scoped to the discipline section", () => {
    const start = output.indexOf("## Output discipline");
    const nextHeading = output.indexOf("## ", start + 1);
    expect(start).toBeGreaterThan(-1);
    expect(nextHeading).toBeGreaterThan(start);
    const section = output.slice(start, nextHeading).toLowerCase();
    for (const token of ["defect", "location", "impact", "evidence"]) {
      expect(section).toContain(token);
    }
  });

  it("separates blocking findings from suggestions", () => {
    expect(output).toContain("Blocking");
    expect(output).toContain("Suggestion");
  });

  it("omits checks already enforced by the project's mechanical gates", () => {
    expect(lower).toContain("project's");
    expect(lower).toContain("mechanical gate");
  });

  it("is self-contained: review method does not route to external docs", () => {
    expect(lower).toContain("self-contained");
  });

  it("contains no stack-adaptive section (stack layer removed)", () => {
    expect(lower).not.toContain("stack-adaptive");
    expect(lower).not.toContain("error handling policy");
    expect(lower).not.toContain("concurrency model");
  });
});
