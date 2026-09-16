export function composeFuseDocSkill(): string {
  return `---
name: fusedoc
description: Use when writing, reviewing, auditing, trimming, or relocating prose — Markdown docs, code comments, API documentation, READMEs, decision records, prompts, tool descriptions, diagnostics, visible strings. Decides what a passage must state, what may be deleted, whether it reads as a leaked reasoning transcript, and where a fact belongs. Also for "improve the docs", "audit the docs", "where should this be documented", "this doc is too long", "this comment reads like notes-to-self".
---

# FuseDoc — prose, vantage, and placement

Write enough to preserve the contract, then remove reasoning transcripts, repetition, and decoration. A **contract** is an obligation, invariant, precondition, postcondition, or compatibility promise that a caller, callee, implementer, producer, or consumer relies on.

**This is guidance, not a script.** Use judgment beyond the named checks; documented requirements still apply. Length alone is never a defect.

Three axes, each owning its rules: [§2 proposition judgment](#2-axis--proposition-judgment) (what a passage must say), [§3 vantage correction](#3-axis--vantage-correction) (whether it reads from the repository or from an authoring session), [§4 structural placement](#4-axis--structural-placement) (where the fact belongs, and at what detail).

## 0. Inputs, detection, exclusions

### Inputs

**\`scope\` is required.** If the invocation names no scope, report the missing input and stop — do not infer a repository-wide scope and do not begin an interview.

**\`mode\`** is \`automatic\` (default) or \`interactive\`. It controls *questions only*. Write authority comes from the task instead: review and audit tasks report findings and edit nothing; only an explicitly authorized write, fix, or trim task applies changes.

### Host capability detection (run before any judgment)

Several rules below apply only when the host project has the corresponding facility. Detect all of them **first**, in one pass, so the final report can name every dimension left uncovered. Read the host's manifests, script definitions, and configuration files — **do not run a command to see whether it exists**: a failure is ambiguous (absent, broken, or unauthorized), and speculative execution in an unfamiliar repository is unsafe.

**Two capabilities are present by construction in a SpecFuse-scaffolded project.** Treat these as known; do not probe for them:

| Capability | Where it lives here | What it enables |
|---|---|---|
| Decision-record convention | \`openspec/changes/<name>/\` — proposal and design own the rationale | Escalation destination (§4); record coverage (§2) |
| Frozen-archive convention | \`openspec/changes/archive/**\` | The archive exclusion (§0) |

Detect the rest. Detection commands and generic fallbacks: [references/probes.md](references/probes.md).

| Capability | What it enables | Absent → |
|---|---|---|
| Reference/link checker | Rename and move safety (§4) | Generic reference probe; report anchor validity as uncovered |
| Document size or budget mechanism | The size policy (§4) | Measure and rank; assert no threshold |
| Generated documentation artifacts + freshness check | Derivative-artifact rules (§2) | Report those rules as not applicable |
| Translation pairing contract | Paired-home cost (§4); counterpart repair (§3) | Report as not applicable |
| Aggregate documentation gate | Validation (§5) | Report validation as version-control formatting only |

Record ambiguity as *uncovered*, never as present.

### Exclusions

Resolve these **categories** against the host project; never assume a path:

- vendored or third-party source trees
- dependency directories
- frozen archives of historical records
- recorded fixtures and snapshots — recorded output keeps its original voice
- **this skill's own directory** — \`.claude/skills/fusedoc/\` — its calibration material quotes flawed prose deliberately

Put exclusion arguments **after** inclusion arguments so a later include cannot re-admit an excluded path. Do not follow a symbolic link into an excluded tree. Inspect an archived record only to understand an inbound citation — never to modernize its prose or its outbound links. Before reporting, verify the final change set contains no excluded path; report an accidental match rather than claiming a clean exclusion history.

## 1. Task navigation

Each entry routes; the rules live in §2–§4.

**Write new prose.** Set structure first ([§4 structural review](#structural-review-precedes-prose)), then satisfy required coverage for the location ([§2 coverage](#required-coverage-by-prose-location)). Check the result against the resolvability test ([§3](#the-one-test)) before finishing.

**Review or edit existing prose.** Enumerate propositions before touching anything ([§2 proposition rule](#preserve-the-complete-proposition)), then check vantage ([§3 taxonomy](#taxonomy)) and the overcorrection traps ([§3](#overcorrection-traps)). Classify each passage and report ([§5](#5-report-and-validation)).

**Audit a corpus.** Follow the ordered probe sequence ([§4 audit](#corpus-audit-cheapest-probe-first)), which delegates leakage hunting to §3's batteries. Escalate any removal that changes a promised behavior ([§4](#escalate-a-removal-that-changes-a-promise)).

**Relocate or rename.** Account for placement cost and find inbound references first ([§4 placement cost](#placement-cost-accounting)); a move is atomic. Confirm the destination tier from the taxonomy ([§4](#document-taxonomy)).

## 2. Axis — proposition judgment

### Preserve the complete proposition

Before editing, identify every proposition in the passage. Preserve each relevant:

- actor and action;
- condition, timing, and ordering;
- modality such as must, may, or never;
- negative guarantee and exception;
- ownership, side effect, failure mode, and consequence.

Remove adjectives, repetition, and narration **only when every factual clause survives and the result is clearer**. A smaller word count alone is not an improvement. When one sentence carries both narration and a load-bearing fact, delete the clause — not the sentence.

Keep a complete local contract at the point of use: behavior, failure, ownership, and consequence that a caller or maintainer needs *there*. Link aggressively to the owning document for architecture, rationale, algorithms, history, or extended examples. One explanation has one home; essential contract facts may repeat locally.

Keep non-obvious rationale when omitting it could plausibly cause misuse or an incorrect simplification. Otherwise state the consequence and link the rationale home.

### Terminology discipline

Treat \`contract\`, \`boundary\`, \`shape\`, \`surface\`, \`seam\`, \`gate\`, and \`vocabulary\` as terms to check before use, not banned words. First ask whether the exact rule, API, field set, type, validation, timing point, component split, or failure states the fact better — write *response fields*, *JSON validation*, or *module exports* rather than *response shape*, *validation boundary*, or *module shape*. Keep a term when it names the exact technical subject, including caller/callee contracts and process or security boundaries.

Comments describe non-obvious contracts or rationale that code cannot express; they do not restate what code already implies.

### Required coverage by prose location

This is **not** a one-way shortening pass. Add or restore prose when code, types, and structure do not communicate a required fact below. Do not add a comment when those facts are already obvious locally.

- **Public API documentation:** caller-visible return distinctions, throws or rejections, side effects, ownership, timing, cancellation, durability.
- **Internal comments:** non-local structure and obviously complicated local structure — invariants, race ordering, ownership, security boundaries, surprising failure behavior. Delete control-flow narration and code restatement.
- **Module comments:** the module's role, dependencies, responsibilities, and non-obvious architecture choices; link each architecture choice to its owning explanation.
- **Tests:** only non-obvious test design — why a fixture, assertion, platform accommodation, real entry path, or indirect observation is necessary. Delete walkthroughs and inventories.
- **How-to guides:** prerequisites, required actions, the real entry path, observable verification, concise warnings.
- **READMEs:** the consumer contract — configuration, semantics, failures, limitations, extension points, and model-visible effects. Quote stable model-visible text the component owns; link generated references and cross-component owners. Keep durable gaps and maintainer traps, not ordinary cleanup inventories.
- **Decision records** (ADR / RFC / design note): unique rationale, mechanisms, alternatives, consequences, shipped verification evidence, and named coverage gaps. A record describing shipped state uses the present tense; remove planning checklists, not the evidence of what pins the decision.
- **Incident reports:** the incident sequence, evidence, causal chain, impact, prevention. Remove repeated persuasion and implementation detail that does not establish causality.
- **Agent instructions and skills:** behavioral guardrails and explicit scope limitations such as "guidance, not a script". Keep the workflow concise and link its source of truth.
- **Examples and configuration comments:** access limits, non-obvious wiring or load order, security stance, replay behavior, exceptions, likely misuse. Do not narrate entries the configuration already shows.
- **Prompts and visible strings:** wording is behavior. Inspect the generated output and run behavior validation, or state why no validation applies.
- **Diagnostics:** the failing subject or path, the violated rule, and the correction when it is non-obvious. Remove internal execution narration.

Preserve searchable mechanism names and meaningful modal, temporal, or negative emphasis. Normalize decorative emphasis only.

### Derivative artifacts are edited at their owner

*Applies when detection found generated artifacts.* Treat generated output, recorded snapshots, and recorded fixtures as derivative: edit the owning source or scenario, then regenerate. Never hand-edit a recorded snapshot or fixture. When a generator extracts a summary from owner prose, make the extracted fragment complete **for the surface it reaches** — knowing what the generator takes is part of writing the owner.

*Applies when detection found a pairing contract.* A translated pair has no permanent owner: either language may be the authored side for an update. Make the smallest counterpart edit that covers the change, then re-record the pair's consistency record.

### Edit classification and reporting

Classify every candidate as **keep / add / trim / restore / restructure / defer**. Apply clear changes only when the task authorizes edits. **Do not manufacture edits to satisfy a deletion target.**

### Borderline resolution

A case is borderline **only** when at least two versions satisfy the complete-proposition rule but trade accepted principles. A rewrite with one proposition-preserving answer is not borderline.

- \`automatic\`: apply clear edits when authorized; report genuine borderline cases without asking. Do not weaken a proposition to make progress.
- \`interactive\`: group analogous passages under the governing principle, present two or three viable versions, recommend one, and state the factual or structural difference. Do not offer inferior distractors. After the user decides, **report the principle and apply it to every analogous passage in scope** — this skill does not modify its own reference files.

Calibration for both: [references/examples.md](references/examples.md).

## 3. Axis — vantage correction

Leakage is prose whose vantage is the authoring session rather than the repository: it cites artifacts only that session could see, narrates the change instead of the state, or argues with a reviewer who has left.

### The one test

**Could a reader at the current commit, with no access to any session transcript, review thread, or uncommitted draft, resolve every reference and verify every claim?**

If no: restate the surviving facts from the repository's vantage, then delete the transcript around them. A passage carrying no factual clause (an audit code, control-flow narration) is deleted outright. If yes, it is not leakage, however historical it sounds — but resolvability only clears *this* axis: on a current-state surface (README, guide, API documentation) a resolvable change story is still change narration, and class 3 routes it to its sanctioned home.

The fix is never deletion alone when a passage carries factual clauses.

### Taxonomy

1. **Dead design-session citations** — decision ordinals, audit item codes, section numbers of uncommitted drafts, phase labels. If the decision has a committed owner, cite it by name and path; otherwise delete the citation and restate its factual clause to stand alone.
2. **Stack and review-thread vantage** — "a later change in this series", "this change adds", "the previous commit". State the shipped mechanism or the extension point; deferred work moves to a tracking marker or an issue reference.
3. **Change narration and version stamps** — "used to", "no longer", "the old X", and indexical stamps ("v1", "this release", "today", "now" contrasting with a past state). State the present behavior; a fixed regression becomes a present-tense counterfactual ("without X, Y happens"), never repository history.
4. **Review choreography** — "rejected in review", "the reviewer confirmed", draft ordinals, round attributions. Keep the surviving decision and rationale as plain fact; delete who said it when.
5. **Reviewer-addressed justification** — "the cast is safe — it simply…", "this is correct because…". A comment arguing its own correctness addresses a reviewer, not a maintainer. State the invariant that makes the code safe, or delete the comment if the code shows it.
6. **Restatement and derivation transcripts** — control-flow narration, test walkthroughs, proofs of obvious branches. Delete; keep only a non-obvious contract or invariant.
7. **Hedges and planning residue** — "probably fine for now", "should be enough", deferrals with no marker. Promote to a tracking marker or restate as the actual bound and its failure behavior; delete the hedge.
8. **Authoring-language slips** — untranslated working-language fragments or session separators in prose whose language is otherwise consistent, or the reverse in a translated counterpart. Translate or delete.

### What is not leakage

An unaided pass fails in **both** directions — deleting durable references and keeping dead ones. Apply these keeps as written:

- **Issue references and tracking markers** — they resolve at the current commit; keep them on any surface, including READMEs. Do not relocate them into decision records.
- **Merged-change and issue citations inside decision records and incident reports** — sanctioned evidence in those genres.
- **Suppression justifications** — linter and coverage-ignore directives, empty-catch explanations. The reason clause is required prose; fix a false reason, never delete it.
- **Counterfactual-present regression pins** — "without X, Y happens", "a naive X would…".
- **Measured bounds** — the provenance word ("measured") is load-bearing; without it a number reads as a definition and nobody re-measures.
- **Runtime old/new states** — "the old connection drains before the new one accepts" is lifecycle vocabulary naming two live objects, not change history.
- **Historical stage names inside a decision record's change-story sections** — current-state-safe there; indexical stamps stay banned everywhere.
- **External references that resolve outside the repository by design** — published standard sections, design-tool frame names. The section-number ban covers uncommitted internal drafts, not external standards or committed documents that own their numbering.
- **Project voice and genre forms** — "we" as project voice; a record's alternatives-considered section.

### Hunting and repair

Search patterns, invocation rules, and known false-positive families: [references/recall-batteries.md](references/recall-batteries.md). Audit read-only first, then judge every hit semantically — the batteries over-match by design and under-match by nature, so also read the densest prose in scope (module documentation, READMEs, decision records) with no pattern in hand.

Repair at the owning surface: generated output → fix the source or template, then regenerate; verbatim excerpts → fix the source they were copied from; translated pairs → update the counterpart and re-record; model-facing strings → wording is behavior, so flag a validated change instead of silently rewording.

### Overcorrection traps

Before deleting anything, enumerate the passage's propositions and check these four:

- **Flipping an obligation into an endorsement** — "exceptions pending migration" must not become "sanctioned exceptions".
- **Promoting a hypothetical to a shipped feature** — deleting a future marker alone turns a design illustration into a claim; mark the hypothetical explicitly instead.
- **Deleting a true fact with the transcript around it** — delete clauses, not sentences, when propositions share a line.
- **Dropping provenance while keeping the number** — keep the word that identifies an observation as measured.

## 4. Axis — structural placement

### Structural review precedes prose

Apply this to every human-facing document in scope. **Do not** apply it to decision records. Classify an incident report as a reference scoped to one incident, preserving its chronological evidence without treating the chronology as a teaching sequence.

1. **Locate** the document in the repository and navigation trees. State its own subject and identify its direct children.
2. **Set the permitted detail.** Keep full detail about the document's subject, summarize direct children by purpose, responsibility, and high-level behavior, and move deeper explanations to their owning descendants with links. Treat test infrastructure as descendant-owned unless it is the document's subject.
3. **Classify from intended use**, not path or title. A tutorial must lead through ordered work to an observable outcome; a reference must support lookup within an explicit scope without requiring sequential reading.
4. **For a tutorial**, privately classify the starting reader and each concept as beginner, intermediate, or advanced. Trace each concept to its prerequisites, reorder premature material, and move optional advanced detail to a later tutorial or reference.
5. **Split substantial mixed forms.** Put a small secondary form in a clearly labeled section.

### Placement cost accounting

Then check the constraints that make a placement expensive or wrong:

- *When a pairing contract exists:* a paired home charges a counterpart update and a consistency re-record on **every** edit — prefer an unpaired home for content that will churn.
- Generated files are never hand-edited; if the fact belongs there, change the generator's source.
- **Before renaming or moving, find every inbound reference.** A detected reference checker covers documentation links and anchors onto them; a reference embedded in source code or a runtime string whose output never reaches scanned prose still needs a manual search.
- **A move is atomic:** remove from the old home, add to the new home, and fix every inbound reference in the same change.

### Corpus audit (cheapest probe first)

Establish the changed scope first (a base reference is required — never guess or fetch one), then:

1. **Measure.** Rank documents by size to spot outliers.
2. **Hunt leakage** with [§3](#3-axis--vantage-correction). Preserve only a non-obvious contract or durable rationale; the same rationale repeated beside sibling declarations keeps one home at the owning declaration.
3. **Hunt duplication** by searching distinctive phrases. Keep one home and replace other copies with links.
4. **Replace hand-written catalogs, inventories, and documentation restatements** with the authoritative tree, script, or generated reference.
5. **Clean shipped decision records:** remove migration plans, acceptance-task checklists, and future-tense specification language. Keep concise verification contracts identifying the behaviors and tiers that pin the decision, plus named coverage gaps.

After a base change, rerun the scope report and audit prose introduced by the new base.

Keep every load-bearing rule, preferably as one to three lines plus a link to its rationale. Cut stories, duplicates, status annotations, and the derivation path used to reach the rule. **Do not create a new explanation merely to relocate disposable reasoning.**

### Escalate a removal that changes a promise

Removing an *explanation* is this axis's job. Removing a *promised behavior* is not: escalate it to the host's decision-record process. Here that destination is \`openspec/changes/<name>/\` — record the removal and its rationale in that change's design.md.

### Document taxonomy

Use the host project's own taxonomy when it declares one. When it does not, apply this default and **say that you did**:

| Tier | Job | Does not belong there |
|---|---|---|
| Standing agent instructions | Rules needed in every session, one to three lines each, linking their home | Stories, worked examples, anything restated from a linked home |
| Architecture overview | Composition, components, control flow, extension points | Type definitions, per-component detail, decision rationale |
| Per-component reference | Type definitions, semantics, generated API | Behavior narration |
| Decision records | The why, what was given up, required verification; shipped records in present tense | Migration plans, acceptance checklists, specification language after shipping |
| Incident reports | Incident narrative — the one tier where a war story belongs | — |
| How-to guides | Step-by-step procedures with verification steps | Design rationale |
| Consumer-facing guides | Product-facing usage | Generated reference tables, contributor procedures, decision history |
| Component README | The component contract: configuration, semantics, limitations, extension points | Restatement of API documentation or generated tables, other components' concerns |
| Contributor setup | Setup, daily workflow, a summary of automated checks | Runtime rationale, check-by-check lists that drift from the scripts |
| Generated reference | Exhaustive material regenerated from source | Hand edits |

Each fact has one home: the tier whose job it is. Elsewhere, link there.

### Size policy

No numeric ceilings live here — they are properties of one corpus. When a host-defined limit is exceeded, apply this order:

1. **Relocate** content that belongs in another tier; leave a one-line link if needed.
2. **Condense** content that belongs here but can be shorter.
3. **Raise** the limit only when the content needs the space, and justify it.

Limits are guardrails, not reduction targets. When the host defines no limit, report outliers by measured size and apply the same order without asserting a threshold. A long document whose content is load-bearing and correctly placed is a deliberate exception, not a defect.

## 5. Report and validation

### Workflow

1. Confirm the scope, mode, and the host's applicable instruction files. Do not inspect unrelated branches.
2. Read the host standard when detection found one; otherwise apply §4's default taxonomy. **Read the owning code or document before judging a passage.**
3. Inspect the requested scope, not only the largest files. Use searches and size measurements to find candidates, then judge passages semantically.
4. Classify each candidate (§2). Apply clear changes only when the task authorizes edits.
5. Update the owner before derivative artifacts. Re-check analogous passages after learning a new rule.
6. Run the host's detected documentation checks plus the version-control formatting check. Verify the final change set contains no excluded path.
7. Report.

### Report contents

- the inspected scope;
- applied or proposed changes, by classification;
- **deliberate keeps** — what was inspected and correctly left alone;
- deferred and genuine borderline cases;
- size deltas and any deliberately long exception;
- **the exact commands run**;
- **every uncovered dimension**: name it, why it was uncovered, and what the host would need for coverage.

### Coverage honesty

This skill establishes **semantic** properties. By itself it does not check reference existence, formatting, derivative freshness, or structural constraints — a detected host capability does that. When asked whether the documentation is verified, distinguish the semantic properties you judged from the mechanical properties no detected capability checked. Never claim a check passed when none was detected or executed. When a detected check fails after your edits, report the failure and do not present the change as validated.
`;
}
