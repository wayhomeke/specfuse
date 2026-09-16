# Capability detection and generic probes

Detection reads host configuration; it never runs a command to test whether that command exists. A failing invocation is ambiguous — absent, broken, or unauthorized — and speculative execution in an unfamiliar repository is unsafe.

Each capability below lists **where to look**, the **generic fallback** when it is absent, and what that fallback **cannot** establish. Report an ambiguous detection as uncovered.

## Where to look

Read whichever of these the host has, then map what you find onto the table below:

- package or project manifests and their script/task definitions
- build, task, and CI configuration
- documentation-tooling configuration
- contributor and agent instruction files
- the repository tree itself (a `docs/` layout, a decision-record directory, an archive directory)

## Reference and link checking

**Present when** a script or CI step validates documentation links, or a documentation generator fails on a dead link.

**Generic fallback** — extract relative targets and test existence:

```sh
git ls-files '*.md' \
  | xargs grep -oE '\]\([^)#][^)]*\)' \
  | sed 's/](\(.*\))/\1/'
```

Resolve each target against its containing file's directory and check that the path exists.

**Cannot establish:** anchor validity. A `#fragment` onto a heading requires the host's slug algorithm, which differs between renderers. Report anchor validity as uncovered whenever the fallback is in use.

## Document size and budgets

**Present when** a manifest declares per-document limits, or a check rejects an oversized document.

**Generic fallback** — rank by size to find outliers:

```sh
git ls-files '*.md' | xargs wc -w | sort -rn | head -30
```

**Cannot establish:** any threshold. Ranking finds candidates; it does not decide that a document is too long. State explicitly that no limit was enforced.

## Generated documentation artifacts

**Present when** a generator writes documentation files and a check regenerates them to compare, or generated files carry a do-not-edit marker.

**Generic fallback** — none that is sound. Without knowing which files are generated, a scan cannot distinguish a generated file from an authored one.

**Consequence:** report the derivative-artifact rules as not applicable. Do not guess that a file is generated from its content.

## Translation pairing

**Present when** the repository holds sibling documents per language plus a consistency record, or a check reports unpaired or out-of-sync documents.

**Generic fallback** — find sibling-language candidates:

```sh
git ls-files '*.md' | sed -E 's/\.[a-z]{2}(-[A-Z]{2})?\.md$/.md/' | sort | uniq -d
```

**Cannot establish:** whether a pair is *consistent*. That needs the host's recorded hashes or an equivalent. Report pairing consistency as uncovered.

## Decision records

**Present when** the repository has a directory of numbered or dated decision documents, or an instruction file describing when a decision earns a record.

**Generic fallback** — locate candidate directories:

```sh
git ls-files | grep -iE '(adr|rfc|decision|design-doc)' | head -20
```

**Consequence when absent:** escalating a behavior-changing removal has no destination. Require the user to name one; do not delete the passage and do not invent a directory.

## Frozen archives

**Present when** a directory holds historical records excluded from ordinary maintenance, usually with its own instruction file or a seal/hash record.

**Generic fallback** — none. An archive convention is declared, not inferred.

**Consequence:** no archive exclusion applies. Say so, since a host that *does* freeze history without declaring it would be edited by mistake.

## Aggregate documentation gate

**Present when** one script or CI job runs the documentation checks together.

**Generic fallback** — the version-control formatting check only:

```sh
git diff --check
```

**Cannot establish:** anything the host's own checks would. Report validation as formatting-only.

## Changed scope

Needed by any audit that judges only what a change touched.

**A base reference is required.** Never guess one and never fetch one.

```sh
# committed paths relative to the merge base
git diff --name-only "$(git merge-base HEAD <base-ref>)"...HEAD

# working-tree state
git diff --name-only            # unstaged
git diff --name-only --cached   # staged
git ls-files --others --exclude-standard  # untracked
```

After the base moves, rerun this and audit prose introduced by the new base.

**Cannot establish:** which of those paths are *in scope* for prose review. Filter by the exclusion categories below.

## Resolving exclusion categories

Map each category onto the host's actual paths, then place every exclusion **after** the inclusions so a later include cannot re-admit it.

| Category | How to find it |
|---|---|
| Vendored / third-party source | A directory of pinned upstream copies, often with a manifest of upstream revisions |
| Dependency directories | The package manager's install directory |
| Frozen archives | The declared archive directory, if the host has one |
| Recorded fixtures and snapshots | Test directories holding recorded expected output |
| This skill's own directory | The directory containing this file |

Ordering with ripgrep and Git:

```sh
rg -n --hidden 'pattern' \
  --glob '!<vendored>/**' \
  --glob '!<dependencies>/**' \
  --glob '!<archive>/**' \
  --glob '!<snapshots>/**' \
  --glob '!<this-skill>/**'

git ls-files '*.md' ':(exclude)<vendored>/**' ':(exclude)<archive>/**'
```

Add `--hidden` when a category lives under a dot-directory; ripgrep skips those by default, and instruction or record trees are commonly hidden. Do not follow a symbolic link into an excluded tree.

Before reporting, confirm the final change set contains no excluded path:

```sh
git diff --name-only HEAD
```

Report an accidental match rather than claiming a clean exclusion history.
