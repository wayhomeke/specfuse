## Why

`trustDirectory()` writes `~/.claude.json` to mark the scaffolded directory trusted. Its read/parse `catch` treats a missing file and a malformed file the same: it assigns `data = {}` and then writes only `{ projects: { ... } }`. If the user's global config exists but cannot be parsed — a partial write, a concurrent edit, or invalid JSON — the scaffold silently replaces the whole file and destroys every other setting. The existing malformed-input test covers only a parseable `projects: 0`; the unparseable path is untested.

## What Changes

- Separate "file missing" from "read or parse failed". A missing file still creates the trust entry. A read or parse failure leaves the file byte-identical, skips the trust entry, and prints a warning naming the path and a repair hint.
- Treat a parsed non-object root (array, string, number, null) as malformed: preserve the file, skip, warn.
- Treat a truthy non-object `projects` container as malformed: preserve, skip, warn.
- Keep the existing valid-object merge, unknown-key preservation, and parseable falsy-`projects` self-heal.
- Add tests that reproduce the overwrite before the fix.

## Capabilities

### New Capabilities

- `trust-list-safety`: missing-file creation, unparseable-file preservation, valid-object merge, and the visible-warning contract for skipped writes.

### Modified Capabilities

- None. The trust write has no existing capability spec.

## Impact

- `src/scaffolder.ts`: `trustDirectory()` distinguishes missing, unreadable, unparseable, and valid input.
- `tests/scaffolder.test.ts`: new regression cases.
- No CLI, API, dependency, or output-contract change for successful runs.

## Non-goals

- A concurrency lock. The read-modify-write race between two scaffold processes is a separate concern.
- A backup-and-rewrite strategy. Rewriting a malformed global file still mutates it and can leave Claude Code broken.
- A lenient JSON parser or automatic repair.
- Changes to how Claude Code itself consumes `~/.claude.json`.

## Trade-offs

- **Skip-and-warn vs backup-and-rewrite.** A `.bak` preserves the bytes but still replaces the live file and may break other settings until restored. Skipping leaves the user in control; the cost is that the project is not pre-trusted until the file is fixed.
- **Strict parse vs lenient repair.** Repair can silently change user data. Strict parse plus skip is predictable and keeps the original bytes.
- **Warning vs thrown error.** The caller treats trust as non-fatal; a warning keeps scaffolding successful while making the skip visible. A thrown error would be swallowed by the existing `catch` and become silent.

## Verification strategy

- A RED test writes invalid JSON with a user key, runs the scaffold, and asserts the file is byte-identical and a warning was printed.
- Additional cases cover a non-object root, a truthy non-object `projects` field, missing-file creation, and the existing valid merge.
- The full test suite, lint, and `openspec validate` gate the change.
