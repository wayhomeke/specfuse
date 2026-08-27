import { describe, it, expect } from "vitest";
import { composeFuseReviewSkill } from "../../src/templates/fusereview-skill.js";
import { getStack } from "../../src/stacks/index.js";

const rustStack = getStack("rust")!;
const ctx = { projectName: "test-app", stack: rustStack };

describe("fusereview-skill template", () => {
  const output = composeFuseReviewSkill(ctx);
  const lower = output.toLowerCase();

  it("returns non-empty string", () => {
    expect(output.length).toBeGreaterThan(0);
  });

  it("contains no Grill trace and names FuseReview the fourth beat", () => {
    expect(lower).not.toContain("grill");
    expect(lower).not.toContain("fifth");
    expect(lower).toContain("fourth beat");
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

  it("omits checks already enforced by mechanical gates", () => {
    expect(lower).toContain("mechanical gate");
  });

  it("is self-contained: review method does not route to external docs", () => {
    expect(lower).toContain("self-contained");
  });

  it("renders a stack-adaptive section with the rust stack's directives", () => {
    expect(output).toContain(rustStack.errorHandling);
    expect(output).toContain(rustStack.concurrency);
  });

  it("renders different directives for a different stack", () => {
    const goStack = getStack("go")!;
    const goOutput = composeFuseReviewSkill({
      projectName: "go-app",
      stack: goStack,
    });
    expect(goOutput).toContain(goStack.errorHandling);
    expect(goOutput).toContain(goStack.concurrency);
    expect(goOutput).not.toContain(rustStack.errorHandling);
  });
});
