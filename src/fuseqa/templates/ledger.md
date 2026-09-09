# E2E case ledger

Cases are project assets, not one-off receipts. This ledger records their
lifecycle so the suite stays trustworthy as it grows.

Cases live in `tests/e2e/<capability>/`, the capability name matching
`openspec/specs/<capability>/`. That alignment IS the index — no separate
mapping file to drift.

A suite that only grows rots: cases outlive their requirements, drift into
permanent red, and get skipped wholesale. Retirement with a recorded reason is
what prevents that.

## Addition

| Field | Content |
|---|---|
| Case | file path and case name |
| Capability | the `<capability>` it sits under |
| Traces to | the spec Scenario it derives from, or the escaped defect it was written for |
| Shape | CLI / HTTP API / WebUI / Library / Data artifact (or the derived conclusion) |

A case with no traceable source cannot later be retired on evidence — nobody
will know what it was protecting.

## Correction

| Field | Content |
|---|---|
| Case | file path and case name |
| What changed | the assertion, the entry construction, or the isolation |
| Why the original was wrong | the actual misjudgment |
| Evidence the implementation is correct | how it was established that the product was not at fault |

The last field is what separates a legitimate correction from quietly editing a
test until it passes. A correction without it is not a correction.

## Removal

| Field | Content |
|---|---|
| Case | file path and case name |
| Reason no longer valid | requirement withdrawn / entry point restructured / superseded by a better case |
| Superseded by | the replacing case, if any |

**Removal always states a reason.** Without one, "deleting a red case" and
"hiding a defect" are indistinguishable in this ledger — and the second one is
how a suite silently stops protecting anything.
