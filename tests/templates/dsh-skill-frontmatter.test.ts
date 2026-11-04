import { describe, it, expect } from "vitest";
import { parse as parseYaml } from "yaml";
import { composeDesignMdSkill } from "../../src/templates/design-md-skill.js";
import { composeFuseDocSkill } from "../../src/templates/fusedoc-skill.js";
import { composeFuseReviewSkill } from "../../src/templates/fusereview-skill.js";
import { composeFuseQASkill } from "../../src/templates/fuseqa-skill.js";
import { composeSpecfuseDshSkill } from "../../src/templates/specfuse-command.js";

/**
 * dsh rejects a skill whose frontmatter name is not kebab-case, whose
 * description is missing, or whose invocation fields are not booleans. The
 * scaffolder has no dsh parser to catch that at build time, so these guards
 * parse the rendered bodies with the same rules.
 */
const CONTEXT = { projectName: "frontmatter-project" };

interface SkillCase {
  directory: string;
  compose: () => string;
  userOnly: boolean;
}

const SKILLS: SkillCase[] = [
  { directory: "design-md", compose: () => composeDesignMdSkill(), userOnly: false },
  { directory: "fusedoc", compose: () => composeFuseDocSkill(), userOnly: false },
  { directory: "fusereview", compose: () => composeFuseReviewSkill(CONTEXT), userOnly: false },
  { directory: "fuseqa", compose: () => composeFuseQASkill(CONTEXT), userOnly: false },
  { directory: "specfuse", compose: () => composeSpecfuseDshSkill("default"), userOnly: true },
  { directory: "specfuse-full", compose: () => composeSpecfuseDshSkill("full"), userOnly: true },
];

function frontmatter(markdown: string): Record<string, unknown> {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(markdown);
  if (!match) throw new Error("missing YAML frontmatter");
  const parsed = parseYaml(match[1]);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("frontmatter is not a mapping");
  }
  return parsed as Record<string, unknown>;
}

describe("every rendered dsh skill has valid frontmatter", () => {
  for (const skill of SKILLS) {
    describe(skill.directory, () => {
      const body = skill.compose();
      const data = frontmatter(body);

      it("names the skill with the kebab-case directory name", () => {
        expect(data.name).toBe(skill.directory);
        expect(data.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      });

      it("carries a non-empty description within the catalog cap", () => {
        expect(typeof data.description).toBe("string");
        expect((data.description as string).trim().length).toBeGreaterThan(0);
        expect((data.description as string).length).toBeLessThanOrEqual(500);
      });

      it("uses boolean invocation fields when present", () => {
        for (const key of ["disable-model-invocation", "user-invocable"]) {
          if (key in data) expect(typeof data[key]).toBe("boolean");
        }
      });

      it("keeps a non-empty instruction body", () => {
        const after = body.slice(body.indexOf("\n---\n", 4) + 5);
        expect(after.trim().length).toBeGreaterThan(0);
      });

      if (skill.userOnly) {
        it("is user-invocable and hidden from the model catalog", () => {
          expect(data["disable-model-invocation"]).toBe(true);
          expect(data["user-invocable"]).toBe(true);
        });
      }
    });
  }
});
