import { describe, it, expect } from "vitest";
import {
  composeSpecfuseCommand,
  composeSpecfuseDshSkill,
  composeSpecfuseFullCommand,
} from "../../src/templates/specfuse-command.js";

/**
 * The command file is the whole contract between `/specfuse` and the model:
 * there is no runtime that enforces the order, so every clause below is a
 * behavioral requirement expressed as prose. Assertions are written against
 * exact clauses rather than loose keywords — a keyword such as "archive"
 * appears in many sentences and would stay green after the ordering rule
 * disappeared.
 */
describe("specfuse command template", () => {
  const output = composeSpecfuseCommand();

  it("renders a slash-command definition with frontmatter", () => {
    expect(output.startsWith("---\n")).toBe(true);
    expect(output).toMatch(/^description:\s+\S/m);
    expect(output).toMatch(/^argument-hint:\s+\S/m);
  });

  it("carries the requirement through $ARGUMENTS", () => {
    expect(output).toContain("$ARGUMENTS");
  });

  it("takes the prompt as its only input", () => {
    expect(output).toContain("/specfuse <requirement description>");
  });
});

describe("missing prompt stops before the pipeline", () => {
  const output = composeSpecfuseCommand();

  it("prints usage and stops", () => {
    expect(output).toMatch(/If `\$ARGUMENTS` is empty/i);
    expect(output).toMatch(/print usage/i);
    expect(output).toMatch(/stop/i);
  });

  it("forbids creating a change or asking a question", () => {
    expect(output).toMatch(/Do not create a change/i);
    expect(output).toMatch(/do not ask a question/i);
  });
});

describe("automatic decision policy", () => {
  const output = composeSpecfuseCommand();

  it("forbids AskUserQuestion at every decision point", () => {
    expect(output).toContain("Do not call AskUserQuestion");
  });

  it("answers brainstorming with the recommended alternative and records it", () => {
    expect(output).toMatch(/2–3 alternatives/i);
    expect(output).toMatch(/recommended/i);
    expect(output).toMatch(/design\.md/);
  });

  it("self-answers the design-md questionnaire without overwriting tokens", () => {
    expect(output).toMatch(/design-md/i);
    expect(output).toMatch(/recommended values/i);
    expect(output).toMatch(/never overwrite an existing `DESIGN-TOKENS\.md`/i);
  });

  it("defaults the model switch and does not ask", () => {
    expect(output).toContain("continue with current model");
    expect(output).toMatch(/do not switch/i);
    expect(output).toMatch(/do not ask/i);
  });

  it("records the FuseReview entry and leaves FuseQA on demand", () => {
    expect(output).toContain("auto: entered");
    expect(output).not.toContain("auto: declined");
    expect(output).toMatch(/FuseQA:\*\* not part of the pipeline/i);
    expect(output).toContain("/fuseqa");
  });

  it("disables Path B per-artifact review", () => {
    expect(output).toMatch(/do not stop between artifacts/i);
  });
});

describe("continuous execution order", () => {
  const output = composeSpecfuseCommand();

  it("names the phases in pipeline order", () => {
    const headings = [
      "### 0. Select the workspace",
      "### 1. Create the change",
      "### 2. Generate the artifacts",
      "### 3. Apply",
      "### 4. FuseReview",
      "### 5. Verify",
      "### 6. Archive",
    ];
    let last = -1;
    for (const heading of headings) {
      const at = output.indexOf(heading);
      expect(at, `missing or out of order: ${heading}`).toBeGreaterThan(last);
      last = at;
    }
  });

  it("generates the artifacts in order", () => {
    expect(output).toMatch(/`proposal\.md`, `specs\/`, `design\.md`, `tasks\.md`/);
  });

  it("keeps TDD and verification evidence mandatory", () => {
    expect(output).toMatch(/test-driven-development/i);
    expect(output).toMatch(/verification-before-completion/i);
    expect(output).toMatch(/failing test first/i);
    expect(output).toMatch(/paste the raw output/i);
  });

  it("disables implementation subagents, which would need a merge", () => {
    expect(output).toMatch(/Do not dispatch implementation subagents/i);
    expect(output).toMatch(/acquire a merge|require a merge/i);
  });

  it("runs FuseReview over the uncommitted working tree", () => {
    expect(output).toMatch(/working-tree diff/i);
    expect(output).toMatch(/including untracked files/i);
    expect(output).toMatch(/do not use `baseline\.\.HEAD`/i);
  });

  it("fixes blocking findings test-first and re-reviews only the fix diff", () => {
    expect(output).toMatch(/Blocking/i);
    expect(output).toMatch(/only the fix diff/i);
  });
});

describe("verify gates archive", () => {
  const output = composeSpecfuseCommand();

  it("runs the verify phase, not structural validation alone", () => {
    expect(output).toMatch(/\/opsx:verify/);
    expect(output).not.toMatch(/openspec verify/);
    expect(output).toMatch(/full test suite/i);
    expect(output).toMatch(/linter/i);
    expect(output).toMatch(/Structural validation alone does not check implementation against specs/i);
  });

  it("archives only after every check passes", () => {
    expect(output).toMatch(/Archive only when every verify check passes/i);
    expect(output).toMatch(/openspec archive/);
  });

  it("preserves the change directory on failure", () => {
    expect(output).toMatch(/do not archive/i);
    expect(output).toMatch(/leave the change directory in place/i);
    expect(output).toMatch(/raw output/i);
  });
});

describe("worktree isolation never merges back", () => {
  const output = composeSpecfuseCommand();

  it("selects the worktree before artifacts and runs the pipeline inside it", () => {
    expect(output).toMatch(/create and enter a dedicated worktree before writing anything/i);
    expect(output).toMatch(/entire pipeline runs inside it/i);
  });

  it("forbids merging back and preserves the worktree", () => {
    expect(output).toMatch(/Never merge[^.]*trunk/i);
    expect(output).toMatch(/leave it in place/i);
  });

  it("falls back to the working tree when creation fails", () => {
    expect(output).toMatch(/worktree creation fails/i);
    expect(output).toMatch(/continue in the current working tree/i);
  });
});

describe("prohibitions and final report", () => {
  const output = composeSpecfuseCommand();

  it("never commits or pushes", () => {
    expect(output).toMatch(/Never run `git commit`, `git push`, or `git merge`/);
  });

  it("records every automatic decision in the final report", () => {
    for (const item of [
      "change name",
      "FuseReview decision",
      "archive outcome",
      "every automatic decision with its rationale",
      "no commit",
      "no push",
    ]) {
      expect(output.toLowerCase()).toContain(item.toLowerCase());
    }
  });

  it("points artifact prose at the FuseDoc standard", () => {
    expect(output).toContain(".claude/skills/fusedoc/SKILL.md");
  });
});

describe("specfuse full command template", () => {
  const output = composeSpecfuseFullCommand();

  it("renders the namespaced command and usage", () => {
    expect(output.startsWith("---\n")).toBe(true);
    expect(output).toContain("# /specfuse:full");
    expect(output).toContain("/specfuse:full <requirement description>");
    expect(output).toContain("$ARGUMENTS");
  });

  it("enters FuseQA automatically between FuseReview and Verify", () => {
    expect(output).toMatch(/\*\*FuseQA:\*\* record `auto: entered`/);
    expect(output).toMatch(/after FuseReview, before Verify/i);
    expect(output).not.toContain("auto: declined");
  });

  it("orders FuseReview, FuseQA, Verify, and Archive", () => {
    const headings = [
      "### 4. FuseReview",
      "### 5. FuseQA",
      "### 6. Verify",
      "### 7. Archive",
    ];
    let last = -1;
    for (const heading of headings) {
      const at = output.indexOf(heading);
      expect(at, `missing or out of order: ${heading}`).toBeGreaterThan(last);
      last = at;
    }
  });

  it("records both decisions in the final report", () => {
    expect(output).toContain("FuseReview decision (`auto: entered`)");
    expect(output).toContain("FuseQA decision (`auto: entered`)");
  });

  it("keeps the shared prohibitions and verify gate", () => {
    expect(output).toMatch(/Archive only when every verify check passes/i);
    expect(output).toMatch(/Never run `git commit`, `git push`, or `git merge`/);
    expect(output).toMatch(/Do not call AskUserQuestion/);
  });

  it("includes FuseQA in the worktree pipeline list", () => {
    expect(output).toMatch(/FuseReview, FuseQA, verify, and archive/i);
  });
});

describe("specfuse dsh entry skill", () => {
  const output = composeSpecfuseDshSkill("default");

  it("renders dsh frontmatter that hides the skill from the model catalog", () => {
    expect(output.startsWith("---\n")).toBe(true);
    expect(output).toMatch(/^name: specfuse$/m);
    expect(output).toMatch(/^disable-model-invocation: true$/m);
    expect(output).toMatch(/^user-invocable: true$/m);
    expect(output).toMatch(/^description:\s+\S/m);
    expect(output).not.toContain("argument-hint:");
  });

  it("takes the requirement from the text following the invocation", () => {
    expect(output).toMatch(/text following `\/specfuse`/i);
    expect(output).not.toContain("$ARGUMENTS");
  });

  it("prints the exact usage line and stops when the requirement is absent", () => {
    expect(output).toContain("SPECFUSE_USAGE: /specfuse <requirement description>");
    expect(output).toMatch(/stop/i);
    expect(output).toMatch(/Do not create a change/i);
  });

  it("keeps the phase order and the automatic decision policy", () => {
    const headings = [
      "### 0. Select the workspace",
      "### 1. Create the change",
      "### 2. Generate the artifacts",
      "### 3. Apply",
      "### 4. FuseReview",
      "### 5. Verify",
      "### 6. Archive",
    ];
    let last = -1;
    for (const heading of headings) {
      const at = output.indexOf(heading);
      expect(at, `missing or out of order: ${heading}`).toBeGreaterThan(last);
      last = at;
    }
    expect(output).toContain("continue with current model");
    expect(output).toContain("auto: entered");
  });

  it("uses the dsh-discoverable FuseDoc path", () => {
    expect(output).toContain(".agents/skills/fusedoc/SKILL.md");
    expect(output).not.toContain(".claude/skills/");
  });

  it("uses the OpenSpec verify path available in dsh", () => {
    expect(output).toContain("openspec validate <change> --strict");
    expect(output).not.toContain("/opsx:verify");
  });

  it("keeps TDD and the no-commit prohibitions without Claude-only tools", () => {
    expect(output).toMatch(/Red-Green-Refactor/);
    expect(output).toMatch(/paste the raw output/i);
    expect(output).toMatch(/Never run `git commit`, `git push`, or `git merge`/);
    expect(output).not.toContain("AskUserQuestion");
    expect(output).toMatch(/do not ask/i);
  });
});

describe("specfuse-full dsh entry skill", () => {
  const output = composeSpecfuseDshSkill("full");

  it("names the full entry point and frontmatter", () => {
    expect(output).toMatch(/^name: specfuse-full$/m);
    expect(output).toMatch(/^disable-model-invocation: true$/m);
    expect(output).toMatch(/^user-invocable: true$/m);
    expect(output).toMatch(/text following `\/specfuse-full`/i);
    expect(output).toContain("SPECFUSE_FULL_USAGE: /specfuse-full <requirement description>");
  });

  it("uses the dsh entry name in the title, not the Claude namespace", () => {
    expect(output).toContain("# /specfuse-full — complete unattended pipeline");
    expect(output).not.toContain("/specfuse:full");
  });

  it("orders FuseReview, FuseQA, Verify, and Archive", () => {
    const headings = [
      "### 4. FuseReview",
      "### 5. FuseQA",
      "### 6. Verify",
      "### 7. Archive",
    ];
    let last = -1;
    for (const heading of headings) {
      const at = output.indexOf(heading);
      expect(at, `missing or out of order: ${heading}`).toBeGreaterThan(last);
      last = at;
    }
    expect(output).toContain("FuseQA decision (`auto: entered`)");
  });

  it("points at the dsh-discoverable FuseQA skill", () => {
    expect(output).toContain(".agents/skills/fuseqa/SKILL.md");
    expect(output).toContain(".agents/skills/fusedoc/SKILL.md");
    expect(output).not.toContain(".claude/skills/");
  });
});
