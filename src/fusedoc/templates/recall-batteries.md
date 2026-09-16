# Recall batteries

Search probes for the leakage taxonomy. **Every hit needs semantic judgment.** The batteries over-match by design, and they under-match by nature — pair them with an unpatterned read of the densest prose in scope (module documentation, READMEs, decision records).

## Invocation rules

- **Search hidden paths.** Add `--hidden --glob '!.git/**'` when instruction files, decision records, or agent notes live under dot-directories; ripgrep skips those by default, and hidden record trees are the easiest place to miss leakage.
- **Exclusions go last** so a later include cannot re-admit them. Resolve the categories against the host project and append each as a glob: vendored source, dependency directories, frozen archives, recorded fixtures and snapshots, and this skill's own directory (its calibration files quote flawed wording deliberately).
- **Case sensitivity differs by line.** Natural-language patterns take `-i` so sentence-initial capitals hit ("This change adds…", "Probably fine…"). The code-shorthand pattern stays case-sensitive: `-i` would turn `\bT\d\b` and `\bP-I\b` into noise.
- **A zero-hit pattern proves nothing until you have seen it match.** Test it against a known-positive string before trusting the negative. Every pattern below matches at least one line of the calibration examples, which is how to check that a pattern still works.

## English battery

Append the resolved exclusion globs to each line.

```sh
# 1. Dead design-session citations (case-sensitive)
rg -n --hidden '\(decision \d|\(audit [A-Z]\d|design §|plan §|design ledger|\bP-I\b|\bW\d\b|\bT\d\b'

# 2. Series and review-thread vantage
rg -n --hidden -i 'this change|this branch|this series|later change|previous commit|this commit'

# 3. Change narration
rg -n --hidden -i 'used to |no longer|previously|the old |was renamed|was moved'

# 4. Indexical version stamps
rg -n --hidden -i '\bv1\b|this release|this cut|\btoday\b|\bfor now\b|roadmap'

# 5. Review choreography
rg -n --hidden -i 'rejected in review|review round|reviewer|as of v\d|revision of this'

# 6. Hedges and reviewer-addressed justification
rg -n --hidden -i 'probably |should be enough|should suffice|it simply|is safe —|is safe --'

# 7. Section numbers
rg -n --hidden '§\d'
```

## Chinese battery

For prose whose primary language is Chinese, or to catch working-language slips in prose that is otherwise not.

```sh
rg -n --hidden '设计稿|评审|上一?轮|旧版|老的|不再|以前|本版|遗留|私有'

# Single-character slip: the bare 端 where "side" or "client" belongs
rg -n --hidden '(^|[^a-zA-Z])端([^a-zA-Z]|$)' --glob '*.md'
```

## Known false-positive families

Expect each of these; judge and keep them.

- **Instrumental "used to"** — "the key used to sign requests" is instrumental, not temporal. The temporal form has a subject state before it ("colors used to come from…").
- **Runtime old/new** — "the old connection drains before the new one accepts" names live objects during handover, not repository states.
- **"This change" in process documentation** — documentation *about* review workflow ("the change description should…", templates, contributor guides) legitimately says "change"; the ban is on a document adopting one change's vantage about the code.
- **`v1` as a protocol or path segment** — `/v1/items` endpoints and wire-format names are identifiers, not version stamps.
- **`§N` with a committed owner** — external standards (RFC 9110 §10.1.5) and committed documents that own their section numbering stay citable by section.
- **Contrastive "actually" and the noun "wait"** — ordinary English, not hedging. No pattern above probes them; they surface only if you extend the hedging line.
- **"Today" in generated timestamps and sample output** — recorded output keeps its voice.
- **Versioned-artifact Chinese** — 本版本 is a legitimate rendering of "this release" where a release is the subject; the banned indexical is the bare 本版 stamp.
- **Alternatives-considered sections** — "rejected" inside a decision record's genre slot is the sanctioned home, not review choreography.

## After the audit

Re-run the batteries and expect only sanctioned keeps, this skill's own directory, and quoted evidence inside decision records. Confirm every remaining citation resolves at the current commit, then run the host's detected checks.
