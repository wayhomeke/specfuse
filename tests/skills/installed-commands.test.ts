import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  composeSpecfuseCommand,
  composeSpecfuseFullCommand,
} from "../../src/templates/specfuse-command.js";

/**
 * This repository is scaffolded by its own tool, so `.claude/commands/` holds
 * generated command files. The templates own the content; the installed files
 * are derived. Editing an installed copy diverges silently — regeneration from
 * the template is the only supported path.
 *
 * Contract: openspec/specs/specfuse-auto-mode/ and specfuse-full/.
 */
const REPO = path.resolve(import.meta.dirname, "..", "..");

const COMMANDS = [
  {
    label: "specfuse",
    file: path.join(REPO, ".claude", "commands", "specfuse.md"),
    compose: composeSpecfuseCommand,
  },
  {
    label: "specfuse:full",
    file: path.join(REPO, ".claude", "commands", "specfuse", "full.md"),
    compose: composeSpecfuseFullCommand,
  },
] as const;

describe("installed specfuse commands equal their rendered output", () => {
  for (const { label, file, compose } of COMMANDS) {
    it(`${label} is present in this repository`, () => {
      expect(existsSync(file), `${file} is missing`).toBe(true);
    });

    it(`${label} matches its composer byte for byte`, () => {
      expect(readFileSync(file, "utf-8")).toBe(compose());
    });
  }
});
