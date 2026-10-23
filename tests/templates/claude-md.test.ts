import { describe, it, expect } from "vitest";
import {
  composeCLAUDEmd,
  renderApplyPhase,
  renderApplyFuseReview,
  renderFuseQAOnDemand,
  renderVerifyPhase,
  renderFuseDocStandard,
  renderAutoMode,
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

  it("contains no Grill trace and labels no beat by position", () => {
    // Used to require the literal "fourth beat", which pinned the stale ordinal:
    // the string was numbered while Grill occupied a slot, and removing Grill
    // shifted every beat down by one without this assertion being revisited.
    expect(lower).not.toContain("grill");
    expect(lower).not.toMatch(/\b(first|second|third|fourth|fifth|sixth)\s+(pipeline\s+)?beat\b/);
    expect(lower).toContain("post-apply review");
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

// --- FuseQA on demand ---
// spec: fuseqa-checkpoint
describe("FuseQA on demand", () => {
  const fq = renderFuseQAOnDemand();

  it("declares that it is not part of the pipeline and has no checkpoint", () => {
    expect(fq).toMatch(/not part of the pipeline/i);
    expect(fq).toMatch(/no checkpoint/i);
    expect(fq).not.toMatch(/MUST ask the user whether to enter FuseQA/i);
  });

  it("states that neither completion nor Verify depends on a FuseQA decision", () => {
    expect(fq).toMatch(/neither apply completion nor entry to Verify depends/i);
  });

  it("requires explicit invocation", () => {
    expect(fq).toContain("/fuseqa");
    expect(fq).toMatch(/explicitly/i);
  });

  it("states the local and distributed boundary", () => {
    expect(fq).toMatch(/deployed and exercised locally/i);
    expect(fq).toMatch(/distributed/i);
    expect(fq).toMatch(/CI\/CD/i);
  });

  it("assigns regression execution to the Verify phase", () => {
    expect(fq).toMatch(/Verify phase full test run/i);
  });

  it("defines no separate red-diagnosis stage", () => {
    expect(fq).toMatch(/no separate red-diagnosis stage/i);
    expect(fq).toMatch(/TDD RED step/);
  });

  it("references the skill path", () => {
    expect(fq).toContain(".claude/skills/fuseqa/SKILL.md");
  });
});

describe("FuseQA grading by attribution", () => {
  const fq = renderFuseQAOnDemand();

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
    expect(fq).toMatch(/MUST NOT hold up completion/i);
  });
});

describe("FuseQA case lifecycle", () => {
  const fq = renderFuseQAOnDemand();

  it("places cases under tests/e2e/<capability>/ aligned with specs", () => {
    expect(fq).toContain("tests/e2e/<capability>/");
    expect(fq).toContain("openspec/specs/<capability>/");
  });

  it("requires a reason for removal", () => {
    expect(fq).toMatch(/Removal records why/i);
    expect(fq).toMatch(/indistinguishable in the ledger/i);
  });

  it("requires an added case to trace to its source", () => {
    expect(fq).toMatch(/Addition records its source/i);
    expect(fq).toMatch(/spec Scenario|escaped defect/i);
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

describe("FuseReview is the only apply-exit checkpoint", () => {
  it("records the skip and proceeds to Verify", () => {
    const fr = renderApplyFuseReview();
    expect(fr).toMatch(/recording the skip is the required trace/i);
    expect(fr).toMatch(/one checkpoint/i);
    expect(fr).not.toMatch(/FuseQA checkpoint/i);
  });
});

describe("CLAUDE.md assembly order", () => {
  const out = composeCLAUDEmd({ projectName: "test" });

  it("orders FuseReview before Verify, with FuseQA after Verify as on-demand", () => {
    const fr = out.indexOf("Phase 2.5: FuseReview Checkpoint");
    const vp = out.indexOf("Phase 3: Verify / Archive");
    const fq = out.indexOf("On-Demand: FuseQA");
    expect(fr).toBeGreaterThan(-1);
    expect(vp).toBeGreaterThan(fr);
    expect(fq).toBeGreaterThan(vp);
  });
});

describe("FuseReview lower bound is the Do phase (spec: apply-exit-checkpoint)", () => {
  it("places FuseReview after the apply phase", () => {
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
    // The pipeline is Think -> Do -> FuseReview -> Verify.
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

  it("keeps the exit sequence at exactly one checkpoint", () => {
    // Structural property, not a particular sentence: a second mandatory
    // checkpoint would appear as a second "MUST ask" on the apply exit path.
    const mandatoryQuestions = output.match(/the AI MUST ask the user whether to enter \w+/g) ?? [];
    expect(mandatoryQuestions.sort()).toEqual([
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

// spec: specfuse-auto-mode
describe("Auto Mode: /specfuse", () => {
  const out = composeCLAUDEmd({ projectName: "test" });
  const auto = renderAutoMode();

  it("is an exported zero-argument renderer", () => {
    expect(renderAutoMode.length).toBe(0);
  });

  it("is assembled before Path A", () => {
    const autoAt = out.indexOf("### Auto Mode: /specfuse");
    const pathAAt = out.indexOf("### Path A: One-Shot Proposal");
    expect(autoAt).toBeGreaterThan(-1);
    expect(autoAt).toBeLessThan(pathAAt);
  });

  it("names every decision point it answers automatically", () => {
    const lower = auto.toLowerCase();
    for (const point of [
      "brainstorming",
      "model switch",
      "fusereview",
      "design-md",
      "pace control",
    ]) {
      expect(lower, `missing decision point: ${point}`).toContain(point);
    }
  });

  it("states the default model decision and the single exit record", () => {
    expect(auto).toContain("continue with current model");
    expect(auto).toContain("auto: entered");
    expect(auto).not.toContain("auto: declined");
    expect(auto).toMatch(/with its rationale/i);
  });

  it("leaves FuseQA on demand rather than recording a decision", () => {
    expect(auto).toMatch(/FuseQA is not part of the pipeline/i);
    expect(auto).toContain("/fuseqa");
  });

  it("keeps the verification discipline and disables subagent integration", () => {
    expect(auto).toContain("verification-before-completion");
    expect(auto).toMatch(/Subagent-driven development is not used/i);
  });

  it("selects the worktree before artifacts and records the fallback", () => {
    expect(auto).toMatch(/before writing any artifact/i);
    expect(auto).toMatch(/worktree creation fails/i);
    expect(auto).toMatch(/record the fallback/i);
  });

  it("gates archive on the verify phase, not a nonexistent CLI", () => {
    expect(auto).toContain("/opsx:verify");
    expect(auto).not.toContain("openspec verify");
  });

  it("gates archive on verify and preserves the change on failure", () => {
    expect(auto).toMatch(/archive only after/i);
    expect(auto).toMatch(/keep the change directory/i);
    expect(auto).toMatch(/raw output/i);
  });

  it("forbids commit, push, and merge", () => {
    expect(auto).toMatch(/Never run `git commit`, `git push`, or `git merge`/);
  });

  it("leaves interactive /opsx:* rules unchanged", () => {
    expect(auto).toMatch(/`\/opsx:\*`/);
    expect(auto).toMatch(/unchanged/i);
  });

  it("adds no second mandatory checkpoint question", () => {
    const mandatory = out.match(/the AI MUST ask the user whether to enter \w+/g) ?? [];
    expect(mandatory.sort()).toEqual([
      "the AI MUST ask the user whether to enter FuseReview",
    ]);
  });
});
