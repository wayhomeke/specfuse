import { describe, it, expect } from "vitest";
import {
  composeCLAUDEmd,
  renderApplyPhase,
  renderApplyFuseReview,
  renderFuseQA,
  renderVerifyPhase,
  renderFuseDocStandard,
} from "../../src/templates/claude-md.js";

describe("CLAUDE.md template", () => {
  const output = composeCLAUDEmd({ projectName: "test" });
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

  it("generalizes the verification command to project-owned wording", () => {
    expect(output).toContain("project's test command");
    expect(output).not.toContain("npm test");
  });

  it("generalizes the lint command to project-owned wording", () => {
    expect(output).toContain("project's linter");
    expect(output).not.toContain("npx eslint");
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

  it("all existing sections remain present and in original order", () => {
    const sections = [
      "Path A: One-Shot Proposal",
      "Path B: Step-by-Step Change",
      "Exploration",
      "Phase 2: Apply",
      "Phase 2.5: FuseReview",
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

  it("contains no Grill trace anywhere", () => {
    expect(output.toLowerCase()).not.toContain("grill");
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

describe("renderApplyFuseReview", () => {
  const output = renderApplyFuseReview();
  const lower = output.toLowerCase();

  it("contains no Grill trace and names FuseReview the fourth beat", () => {
    expect(lower).not.toContain("grill");
    expect(lower).not.toContain("fifth beat");
    expect(lower).toContain("fourth beat");
  });

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

// --- FuseQA checkpoint (fifth beat) ---
// spec: fuseqa-checkpoint
describe("FuseQA checkpoint", () => {
  const fq = renderFuseQA();

  it("asks a MUST-level question and forbids silent advancement", () => {
    expect(fq).toContain("MUST");
    expect(fq).toMatch(/forbidden/i);
    expect(fq).toContain("/opsx:verify");
  });

  it("states the question is independent of the FuseReview answer", () => {
    expect(fq).toMatch(/FuseReview/);
    expect(fq).toMatch(/any FuseReview answer|regardless of/i);
  });

  it("forbids merging the two checkpoints into one question", () => {
    expect(fq).toMatch(/never merge|MUST NOT be merged|single question/i);
  });
});

describe("FuseQA facts, scope and skill reference", () => {
  const fq = renderFuseQA();

  it("presents the three change facts", () => {
    expect(fq).toMatch(/user-observable entry point/i);
    expect(fq).toMatch(/capabilit/i);
    expect(fq).toMatch(/E2E case count/i);
  });

  it("states there are no automatic thresholds and the user decides", () => {
    expect(fq).toMatch(/no automatic trigger thresholds/i);
    expect(fq).toMatch(/decision belongs to the user/i);
  });

  it("assigns regression execution to the Verify phase", () => {
    expect(fq).toMatch(/Regression execution is NOT part of this beat/i);
    expect(fq).toMatch(/Verify phase full test run/i);
  });

  it("defines no separate red-diagnosis stage", () => {
    expect(fq).toMatch(/no separate red-diagnosis stage/i);
    expect(fq).toMatch(/TDD RED step/);
  });

  it("references the skill path and preserves manual invocation", () => {
    expect(fq).toContain(".claude/skills/fuseqa/SKILL.md");
    expect(fq).toMatch(/invoke the FuseQA skill explicitly at any time/i);
  });
});

describe("FuseQA grading by attribution", () => {
  const fq = renderFuseQA();

  it("grades an implementation defect as Blocking", () => {
    expect(fq).toMatch(/Implementation defect .*Blocking/i);
  });

  it("grades a spec gap as Suggestion with escalation", () => {
    expect(fq).toMatch(/Spec gap .*Suggestion/i);
    expect(fq).toMatch(/Escalate to Blocking/i);
  });

  it("treats a false red as case debt outside the grading", () => {
    expect(fq).toMatch(/False red .*case debt/i);
    expect(fq).toMatch(/why the implementation is correct/i);
  });

  it("bounds attribution with a time box that cannot hold up completion", () => {
    expect(fq).toMatch(/time box/i);
    expect(fq).toMatch(/MUST NOT hold up apply completion/i);
  });
});

describe("FuseQA case lifecycle", () => {
  const fq = renderFuseQA();

  it("places cases under tests/e2e/<capability>/ aligned with specs", () => {
    expect(fq).toContain("tests/e2e/<capability>/");
    expect(fq).toContain("openspec/specs/<capability>/");
  });

  it("requires a reason for removal", () => {
    expect(fq).toMatch(/Removal.*records why/i);
    expect(fq).toMatch(/indistinguishable in the ledger/i);
  });

  it("requires an added case to trace to its source", () => {
    expect(fq).toMatch(/Addition\*\* records its source/i);
    expect(fq).toMatch(/spec Scenario|escaped defect/i);
  });
});

describe("FuseQA dual-record completion condition", () => {
  const fq = renderFuseQA();

  it("requires both checkpoint decisions in the completion report", () => {
    expect(fq).toMatch(/MUST record the FuseReview decision AND the FuseQA decision/i);
  });

  it("states a missing record means apply is incomplete and blocks verify", () => {
    expect(fq).toMatch(/not complete/i);
    expect(fq).toMatch(/\/opsx:verify.*MUST NOT be entered/i);
  });
});

describe("Verify phase names the E2E regression gate", () => {
  const vp = renderVerifyPhase();

  it("declares the full test run to be the E2E regression gate", () => {
    expect(vp).toMatch(/E2E regression gate/i);
    expect(vp).toContain("tests/e2e/");
    expect(vp).toMatch(/MUST NOT be skipped/i);
  });
});

describe("FuseReview decline does not end the exit sequence", () => {
  it("states FuseQA remains mandatory after declining FuseReview", () => {
    const fr = renderApplyFuseReview();
    expect(fr).toMatch(/Declining does not end the apply exit sequence/i);
    expect(fr).toMatch(/FuseQA checkpoint that follows remains mandatory/i);
  });
});

describe("CLAUDE.md assembly order", () => {
  const out = composeCLAUDEmd({ projectName: "test" });

  it("orders FuseReview before FuseQA before Verify", () => {
    const fr = out.indexOf("Phase 2.5: FuseReview Checkpoint");
    const fq = out.indexOf("Phase 2.6: FuseQA Checkpoint");
    const vp = out.indexOf("Phase 3: Verify / Archive");
    expect(fr).toBeGreaterThan(-1);
    expect(fq).toBeGreaterThan(-1);
    expect(vp).toBeGreaterThan(-1);
    expect(fr).toBeLessThan(fq);
    expect(fq).toBeLessThan(vp);
  });
});

describe("FuseQA skip is recorded with facts (spec: fuseqa-checkpoint)", () => {
  it("requires a declined FuseQA to be recorded with the change facts", () => {
    // Asserted against renderFuseQA specifically: the FuseReview section has its
    // own auditable-skip line, so a suite-wide match would pass on the wrong text.
    const fq = renderFuseQA();
    expect(fq).toMatch(/declined FuseQA is recorded together with the change facts/i);
    expect(fq).toMatch(/auditable rather than invisible/i);
  });
});

describe("FuseReview lower bound is the Do phase (spec: apply-exit-checkpoint)", () => {
  it("places FuseReview after the apply phase, not merely before FuseQA", () => {
    const out = composeCLAUDEmd({ projectName: "test" });
    const apply = out.indexOf("Phase 2: Apply / Implement");
    const fr = out.indexOf("Phase 2.5: FuseReview Checkpoint");
    expect(apply).toBeGreaterThan(-1);
    expect(fr).toBeGreaterThan(apply);
  });
});

describe("model switch checkpoint option set (spec: model-switch-checkpoint)", () => {
  const out = renderApplyPhase();

  // Anchored on the option-declaration syntax (`选项 N: "label"`), not on the
  // section text. A bare `toContain("切换模型")` passes vacuously here — the
  // surrounding prose already reads "询问用户是否切换模型", so it stays green
  // even when no such option exists. That version was written first, observed
  // passing against the defective text, and replaced.
  const optionLabels = [...out.matchAll(/选项 \d+:\s*"([^"]+)"/g)].map((m) => m[1]);

  it("names at least two options, so AskUserQuestion accepts the payload", () => {
    // The quantity AskUserQuestion validates against: `options` is minItems 2.
    expect(optionLabels.length).toBeGreaterThanOrEqual(2);
  });

  it("stays within the tool's four-option maximum", () => {
    expect(optionLabels.length).toBeLessThanOrEqual(4);
  });

  it("names exactly the pass-through and the generic switch, binding no model identifier", () => {
    // Pinning the exact set is deliberate: a specific model name appearing as an
    // option would bind every generated project to an identifier it never chose.
    // A legitimate third option means revisiting this assertion on purpose.
    expect(optionLabels).toHaveLength(2);
    expect(optionLabels).toContain("继续使用当前模型");
    expect(optionLabels).toContain("切换模型");
  });
});

// spec: fusedoc-integration
describe("FuseDoc is a standard, not a beat", () => {
  const fd = renderFuseDocStandard();
  const output = composeCLAUDEmd({ projectName: "test" });

  it("declares a documentation standard spanning the pipeline", () => {
    expect(fd).toMatch(/documentation standard/i);
    expect(fd).toMatch(/span(n)?ing the pipeline|across the pipeline/i);
  });

  it("states it is invoked on demand, not gated", () => {
    expect(fd).toMatch(/on demand/i);
    expect(fd).toMatch(/any time|at any point/i);
  });

  it("names the skill path so it can be invoked manually", () => {
    expect(fd).toContain(".claude/skills/fusedoc/SKILL.md");
  });

  it("does not add FuseDoc to the pipeline beat sequence", () => {
    // The pipeline is Think -> Do -> FuseReview -> FuseQA -> Verify.
    // FuseDoc is named as none of them.
    expect(output).not.toMatch(/FuseDoc is the (first|second|third|fourth|fifth|sixth) beat/i);
  });
});

describe("FuseDoc pointer direction (review finding: misdirecting reference)", () => {
  const output = composeCLAUDEmd({ projectName: "test" });

  it("places the standard before every reference that calls it 'above'", () => {
    // Three of four pointers said "see Documentation Standard above" while the
    // section sat below them — a reader following Path A is sent the wrong way.
    const sectionAt = output.indexOf("### Documentation Standard: FuseDoc");
    expect(sectionAt).toBeGreaterThan(-1);

    const pointerLines = output
      .split("\n")
      .map((line, i) => ({ line, at: output.indexOf(line), i }))
      .filter(({ line }) => /see Documentation Standard above/.test(line));

    expect(pointerLines.length).toBeGreaterThan(0);
    for (const { line, at } of pointerLines) {
      expect(at, `points above but sits below: ${line.slice(0, 70)}`).toBeGreaterThan(sectionAt);
    }
  });
});

describe("FuseDoc introduces no checkpoint", () => {
  const output = composeCLAUDEmd({ projectName: "test" });

  it("defines no mandatory FuseDoc question", () => {
    expect(output).not.toMatch(/FuseDoc checkpoint/i);
    expect(output).not.toMatch(/MUST ask the user whether to enter FuseDoc/i);
  });

  it("keeps the exit sequence at exactly the two existing checkpoints", () => {
    // Structural property, not a particular sentence: a third mandatory
    // checkpoint would appear as a third "MUST ask" on the apply exit path.
    const mandatoryQuestions = output.match(/the AI MUST ask the user whether to enter \w+/g) ?? [];
    expect(mandatoryQuestions.sort()).toEqual([
      "the AI MUST ask the user whether to enter FuseQA",
      "the AI MUST ask the user whether to enter FuseReview",
    ]);
  });

  it("does not make apply completion depend on a FuseDoc decision", () => {
    expect(output).not.toMatch(/apply completion (requires|depends on).*FuseDoc/i);
    expect(output).not.toMatch(/FuseDoc decision/i);
  });
});

describe("FuseDoc references reach the prose-producing phases", () => {
  const output = composeCLAUDEmd({ projectName: "test" });

  it("references the standard in the artifact-drafting phases", () => {
    // renderPathA/renderPathB are private; slice the assembled output by heading
    // rather than widening the module's public surface for a test.
    const slice = (start: string, end: string) => {
      const from = output.indexOf(start);
      const to = output.indexOf(end);
      expect(from).toBeGreaterThan(-1);
      return output.slice(from, to);
    };

    expect(slice("### Path A: One-Shot Proposal", "### Path B: Step-by-Step Change")).toMatch(
      /FuseDoc/,
    );
    expect(slice("### Path B: Step-by-Step Change", "### Exploration")).toMatch(/FuseDoc/);
  });

  it("references the standard from FuseReview", () => {
    expect(renderApplyFuseReview()).toMatch(/FuseDoc/);
  });

  it("references the standard from the archive step", () => {
    expect(renderVerifyPhase()).toMatch(/FuseDoc/);
  });

  it("keeps the references as pointers, not restatements", () => {
    // The skill owns these; the generated CLAUDE.md must not duplicate them.
    expect(output).not.toContain("Dead design-session citations");
    expect(output).not.toContain("Flipping an obligation into an endorsement");
    expect(output).not.toContain("Standing agent instructions");
    expect(output).not.toContain("overcorrection traps");
  });
});
