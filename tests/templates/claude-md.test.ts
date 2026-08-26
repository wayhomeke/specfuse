import { describe, it, expect } from "vitest";
import {
  composeCLAUDEmd,
  renderGrillReview,
  renderApplyFuseReview,
} from "../../src/templates/claude-md.js";
import { getBuiltinStacks } from "../../src/stacks/index.js";

describe("renderGrillReview", () => {
  const output = renderGrillReview();

  it("returns string starting with ### Pre-Apply Review (Grill)", () => {
    expect(output.trimStart().startsWith("### Pre-Apply Review (Grill)")).toBe(
      true,
    );
  });

  it("accepts zero arguments", () => {
    expect(renderGrillReview.length).toBe(0);
  });

  it("contains all 7 review dimensions", () => {
    const dimensions = [
      "scope boundary",
      "error paths",
      "dependency risk",
      "testability",
      "security",
      "performance impact",
      "backward compatibility",
    ];
    for (const dim of dimensions) {
      expect(output.toLowerCase()).toContain(dim.toLowerCase());
    }
  });

  it("contains blocking categories", () => {
    const categories = [
      "artifact contradictions",
      "uncovered edge cases",
      "missing error handling",
      "security risks",
      "untestable specs",
    ];
    for (const cat of categories) {
      expect(output.toLowerCase()).toContain(cat.toLowerCase());
    }
  });

  it("contains exit commands grill-stop and grill-abort", () => {
    expect(output).toContain("grill-stop");
    expect(output).toContain("grill-abort");
  });

  it("contains soft limit 9", () => {
    expect(output).toContain("After 9 questions");
  });

  it("contains Data-flow integrity dimension", () => {
    expect(output).toContain("Data-flow integrity");
  });

  it("consistency scan covers reverse direction", () => {
    expect(output.toLowerCase()).toContain("reverse");
  });

  it("contains consistency scan keywords", () => {
    expect(output.toLowerCase()).toContain("reference integrity");
    expect(output.toLowerCase()).toContain("terminology");
    expect(output.toLowerCase()).toContain("logical conflict");
  });

  it("contains backup path .grill-backup/", () => {
    expect(output).toContain(".grill-backup/");
  });
});

describe("CLAUDE.md template", () => {
  const stacks = getBuiltinStacks();

  for (const stack of stacks) {
    describe(stack.id, () => {
      const output = composeCLAUDEmd({ projectName: "test", stack });

      it("contains FUSION markers", () => {
        expect(output).toContain("<!-- FUSION:START -->");
        expect(output).toContain("<!-- FUSION:END -->");
      });

      it("contains methodology invariant: Never skip TDD", () => {
        expect(output).toContain("Never skip TDD");
      });

      it("contains methodology invariant: verification evidence", () => {
        expect(output).toContain(
          "NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE",
        );
      });

      it("contains Path A and Path B", () => {
        expect(output).toContain("Path A: One-Shot Proposal");
        expect(output).toContain("Path B: Step-by-Step Change");
      });

      it("contains stack-specific test command", () => {
        expect(output).toContain(stack.commands.test);
      });

      it("contains stack-specific lint command", () => {
        expect(output).toContain(stack.commands.lint);
      });

      it("contains exploration section", () => {
        expect(output).toContain("Exploration");
        expect(output).toContain("brainstorming");
      });

      it("contains commit convention", () => {
        expect(output).toContain("conventional commits");
      });

      it("contains subagent trigger rules", () => {
        expect(output).toContain("Subagent-Driven Development trigger");
        expect(output).toContain("tasks.md");
        expect(output).toContain("blocked by");
      });

      it("contains worktree trigger rules in apply phase", () => {
        expect(output).toContain("Git Worktree isolation trigger");
        expect(output).toContain("destructive refactoring");
      });

      it("contains worktree trigger rules in explore phase", () => {
        expect(output).toContain("Worktree isolation (exploration)");
        expect(output).toContain("PoC");
      });

      it("contains Pre-Apply Review (Grill) between Exploration and Phase 2", () => {
        const explorationIdx = output.indexOf("### Exploration");
        const grillIdx = output.indexOf("### Pre-Apply Review (Grill)");
        const applyIdx = output.indexOf("### Phase 2: Apply");
        expect(grillIdx).toBeGreaterThan(explorationIdx);
        expect(grillIdx).toBeLessThan(applyIdx);
      });

      it("all existing sections remain present and in original order", () => {
        const sections = [
          "Path A: One-Shot Proposal",
          "Path B: Step-by-Step Change",
          "Exploration",
          "Pre-Apply Review (Grill)",
          "Phase 2: Apply",
          "Phase 3: Verify",
          "General Rules",
        ];
        let lastIdx = -1;
        for (const section of sections) {
          const idx = output.indexOf(section);
          expect(idx).toBeGreaterThan(lastIdx);
          lastIdx = idx;
        }
      });

      it("contains FuseReview checkpoint between Phase 2 and Phase 3", () => {
        const applyIdx = output.indexOf("### Phase 2: Apply");
        const fuseIdx = output.indexOf("### Phase 2.5: FuseReview");
        const verifyIdx = output.indexOf("### Phase 3: Verify");
        expect(fuseIdx).toBeGreaterThan(applyIdx);
        expect(fuseIdx).toBeLessThan(verifyIdx);
      });

      it("subagent two-stage review points at the FuseReview skill", () => {
        expect(output).not.toContain("spec compliance → code quality");
        expect(output.toLowerCase()).toContain("fusereview");
      });
    });
  }
});

describe("renderApplyFuseReview", () => {
  const output = renderApplyFuseReview();
  const lower = output.toLowerCase();

  it("returns string starting with ### Phase 2.5: FuseReview", () => {
    expect(output.trimStart().startsWith("### Phase 2.5: FuseReview")).toBe(
      true,
    );
  });

  it("accepts zero arguments", () => {
    expect(renderApplyFuseReview.length).toBe(0);
  });

  it("requires the checkpoint question (MUST) after the final task", () => {
    expect(output).toContain("MUST");
    expect(lower).toContain("checkpoint");
    expect(lower).toContain("last task");
  });

  it("forbids silent advancement to verify or archive", () => {
    expect(lower).toContain("silent advancement");
    expect(lower).toContain("forbidden");
    expect(lower).toContain("/opsx:verify");
    expect(lower).toContain("/opsx:archive");
  });

  it("presents facts without automatic thresholds", () => {
    expect(lower).toContain("task count");
    expect(lower).toContain("subagent");
    expect(lower).toContain("modules");
    expect(output).not.toContain("≥ 6");
    expect(lower).not.toContain("destructiveness");
    expect(lower).toContain("decision belongs to the user");
  });

  it("requires a skip trace in the apply completion report", () => {
    expect(lower).toContain("record the skip decision");
    expect(lower).toContain("auditable");
  });

  it("routes blocking findings through TDD with fix-diff-only re-review", () => {
    expect(lower).toContain("test-first");
    expect(lower).toContain("fix diff");
    expect(lower).toContain("no second full review");
  });

  it("requires baseline recording with merge-base fallback", () => {
    expect(lower).toContain("baseline");
    expect(lower).toContain("baseline..head");
    expect(lower).toContain("merge-base");
    expect(lower).toContain("apply start");
  });

  it("links the subagent merge gate to the skill", () => {
    expect(lower).toContain("merge gate");
    expect(lower).toContain("before merge");
  });

  it("preserves manual invocation", () => {
    expect(lower).toContain("at any time");
  });
});
