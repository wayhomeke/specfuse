# Entry construction recipes

These recipes fix the **contract**, not the tool. Use whatever test framework the
project already has — introducing a second one for E2E is a cost with no return.

Before reaching for a recipe, answer the three questions: how does the user
obtain this artifact, how is it triggered, and what is externally observable
afterwards. The recipe follows from the answers. A shape absent from this file
is derived the same way and its conclusion recorded in the case's `entry` field.

## CLI

Spawn a **real subprocess** with argv. Assert on exit code, stdout/stderr, and
files written.

**Must also cover invocation through a symlinked bin shim.** Package managers
install binaries as symlinks, and that path has its own failure mode: an entry
guard comparing a resolved module path against an unresolved `argv[1]` matches
when the file is called directly and silently fails through the symlink — the
process exits 0 having done nothing. Testing only the real path misses it.

Forbidden: importing the CLI module and calling its exported function. That
skips argv parsing, the shebang, the shim, and the process boundary.

## HTTP API

Issue a **real request against a live port**. Assert on status, headers, body.

Forbidden: calling the handler function directly. That skips routing,
middleware, serialization and the error mapper — where the defects live.

## WebUI

Drive a **real browser** against a served page. Assert on rendered DOM state.

Forbidden: mounting a component and asserting on its props — that is a unit test.

**Environment self-check is mandatory.** A missing browser binary means *cannot
execute*, which is not *failed*. Detect it, skip rather than fail, and print the
reason so the skip is visible. An unexecutable case must never turn the
regression gate red — a red gate nobody can fix gets disabled wholesale, which
is worse than having no E2E at all.

## Library

Import from the **build output**, via the paths declared in `package.json`
`exports`. The published contract is what users get; an internal path that keeps
working while the declared export is broken is exactly the defect class this
catches.

Forbidden: importing internal source paths, or reaching past `exports` into the
package's file tree.

## Data artifact

Config files, design tokens, generated docs, template packs — anything with no
executable entry. Hand it to its **real consumer** and assert on the consumer's
behavior.

Forbidden: asserting on the artifact's own text. Checking that a generated file
contains a given string is a unit test; it proves nothing about whether the
consumer can use the file.
