# Case derivation checklist

Functional cases come from spec Scenarios: each Scenario's THEN clause is a
user-observable promise, and the case rebuilds its WHEN as a real entry point.
The techniques below go beyond the happy path. They are project-independent —
no framework, language or domain assumption.

## Scope boundary first

Read the change proposal's **Non-goals** before deriving anything. They mark
what must NOT be tested. Writing a case against behavior the proposal explicitly
excluded manufactures a false failure, and false failures are how suites lose
their credibility.

Also skip requirements with no externally observable consequence. If a THEN
clause cannot be translated into an exit code, a response, a file or a rendered
state, it has no E2E case.

## Equivalence partitioning and boundary values

For every input: empty, one, many, maximum, over-limit, malformed. Pick one
representative per equivalence class rather than enumerating — the classes are
what matter, not the count.

Boundaries worth naming explicitly: zero-length input, single element,
off-by-one at any declared limit, and the first value past a documented cap.

## State transitions

Map the artifact's states and exercise the edges, not just the nodes:
uninitialized → initializing → initialized, and every path back.

**Idempotence on repeat** is the most commonly skipped case: run the same
command twice. Second-run failures (already-exists errors, duplicated entries,
clobbered config) are extremely common and invisible to any single-run test.

## Concurrency and races

Two **real processes** touching one resource. The classic shape is unlocked
read-modify-write on a shared file: both read, both modify, the second write
erases the first.

This class only reproduces with real processes, which is why no in-process unit
test finds it — and why it belongs here rather than in TDD.

## Error injection

Make the environment hostile: dependency unreachable, permission denied, disk
full, timeout exceeded, malformed response from a dependency.

Assert on the *handling*, not just the failure: a clear message, a non-zero exit
code, no partial state left behind.

## Re-entry after interruption

Kill the artifact mid-run, then run it again. Assert it recovers rather than
refusing to start or resuming into a corrupted state.

Partial-write recovery belongs here: interrupt during a multi-file write and
confirm the next run either completes or cleanly reports what it found.
