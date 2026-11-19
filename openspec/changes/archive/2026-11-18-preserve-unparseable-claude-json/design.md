## Context

`scaffold()` ends by calling `trustDirectory(path.resolve(targetDir))`, which reads `~/.claude.json`, adds a `projects[<path>].hasTrustDialogAccepted` entry, and rewrites the whole file. The current `try/catch` conflates two different outcomes:

- the file does not exist, where creating a fresh object is correct;
- the file exists but cannot be read or parsed, where writing `{}` destroys the user's global config.

The existing malformed-input test covers a parseable `projects: 0` with other keys, not invalid JSON. See `proposal.md` for the failure impact.

## Goals / Non-Goals

**Goals:**

- Preserve an unreadable or unparseable `~/.claude.json` byte for byte.
- Keep the trust write working for missing files and valid objects.
- Make the skipped write visible without failing the scaffold.
- Cover the overwrite with a regression test.

**Non-Goals:**

- A lock or atomic replace for concurrent scaffold processes.
- A `.bak` copy or an automatic repair.
- Changing Claude Code's own trust behavior.
- Changing the public CLI output on successful runs.

## Decisions

### D1 — Distinguish a missing file from an unreadable one

`readFile` is caught by error code. `ENOENT` is the missing-file case and starts a fresh object. Any other read error (`EACCES`, `EISDIR`, I/O) skips the write and warns.

Alternatives: an `existsSync` pre-check adds a race between check and read and cannot distinguish an unreadable file from a missing one as precisely.

### D2 — An unparseable file is preserved, not rewritten

A `JSON.parse` failure, or a parsed value that is not a plain object (array, string, number, `null`), leaves the file untouched and skips the trust entry.

Alternatives: writing a `.bak` then a fresh file still mutates the live global config and can leave Claude Code broken until the user restores it; a lenient parser can silently change user data; deleting and recreating discards unknown settings. Preservation keeps the user in control.

### D3 — Keep the parseable falsy-`projects` self-heal

A parsed object with a falsy `projects` value (`0`, `''`, `false`, `null`) keeps the existing behavior: `projects` becomes `{}`, other top-level keys survive, and the target entry is written. A truthy non-object `projects` (string, number, array) is treated as malformed and preserved. The same rule applies to `projects[<target>]`: a truthy non-object entry is preserved and skipped rather than throwing or writing a discarded property.

Alternatives: treating every non-object `projects` as a skip would break the existing self-heal contract; resetting every non-object would discard a truthy malformed value without warning.

### D4 — Warn on stderr and keep the write non-fatal

The skip prints `console.warn` with the path and a repair hint, and explicitly says the file was left unchanged. The warning never includes file contents, which may contain credentials. The existing caller's `try/catch` remains for unexpected failures.

Alternatives: throwing a typed error would be swallowed by the caller's current catch and become silent unless the caller changed; returning a result type would require a wider API change for one caller. The warning is the smallest visible contract.

### D5 — Leave concurrency and atomicity out of scope

Two simultaneous scaffolds can still lose one entry through a read-modify-write race, and a crash during `writeFile` can truncate the file. Both are separate from the parse-failure overwrite. Recorded as non-goals rather than silently expanded.

## Decision tree

```
read ~/.claude.json
  ├─ ENOENT                 -> data = {}
  ├─ other read error       -> warn, return (file untouched)
  └─ read succeeded
       ├─ JSON.parse failed -> warn, return (file untouched)
       ├─ not a plain object -> warn, return (file untouched)
       └─ object
            ├─ projects falsy          -> projects = {}
            ├─ projects truthy object  -> keep
            └─ projects truthy non-obj -> warn, return (file untouched)
                ├─ target entry non-object -> warn, return (file untouched)
                -> set target entry, write
```

## Public API surface

No public API change. `trustDirectory()` stays module-private; `scaffold()` keeps its signature and non-fatal error boundary. The observable contract is the file bytes and the stderr warning.

## Error handling

- Expected malformed input is handled inside `trustDirectory()`: no throw, a warning, and no write.
- Unexpected write failures still propagate to the caller's existing `catch`, which keeps trust non-fatal; the global file is not rewritten on a read/parse skip.
- The warning text names the file and the repair action but never echoes its contents.

## Risks / Trade-offs

- **The user may not notice the warning.** The project then lacks pre-trust, so Claude Code shows its normal trust dialog. That is recoverable and safer than losing settings.
- **A malformed file remains malformed.** The warning tells the user to fix or remove it; SpecFuse does not guess at repairs.
- **Concurrency and atomic-write risks remain.** Recorded as non-goals; a lock or atomic replace is a separate change.

## Migration Plan

No migration. Existing valid files keep the same merge behavior; users with an unparseable file now get a warning and keep their bytes. Rollback is reverting the change; no persisted state is introduced.

## Open Questions

None. The automatic decisions selected skip-and-warn, strict parsing, the existing falsy-`projects` self-heal, and a content-free warning.
