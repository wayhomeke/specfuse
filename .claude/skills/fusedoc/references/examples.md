# Calibration examples

Use these to identify the governing principle, not as text templates. **Balanced** preserves every load-bearing proposition with the least explanation needed at that location.

This file quotes flawed prose deliberately, so search patterns exclude this skill's own directory.

## Part 1 — Proposition judgment

### Preserve every factual clause

**Original:** "The coordinator carefully serializes writes per session, flushes buffered events before disposal resolves, and reports backend failures to the caller."

**Over-trimmed:** "The coordinator serializes persistence."

**Balanced:** "The coordinator serializes writes per session, flushes buffered events before disposal resolves, and reports backend failures to the caller."

Remove decoration and repetition, not propositions. Actor, per-session scope, disposal ordering, and failure visibility are separate facts.

### Explicit scope limitation is functional

**Over-trimmed:** "Read the sources and use judgment."

**Balanced:** "This is guidance, not a complete checklist. Use judgment beyond the named checks; documented requirements still apply."

**Over-detailed:** Several paragraphs defending why lists cannot replace independent reasoning.

Keep the explicit limitation because it changes how an agent applies the workflow. Trim repeated persuasion, not the guardrail.

### A how-to guide keeps action and verification

**Over-trimmed:** "Add tests for the new command."

**Balanced:** "Test registration and teardown at unit level, exercise the command through the real entry path, and add a recorded-output test when its rendering changes. Verify the assertion observes the external result rather than the tool's own report."

**Over-detailed:** A walkthrough of every fixture file and assertion already visible in the example code.

Keep the test tiers, required action, real entry path, and observable verification. Remove fixture narration.

### Preserve ownership and timing

**Over-trimmed:** "Provider work is cancelled during teardown."

**Balanced:** "The runtime requests provider cancellation before releasing the child scope; the provider remains responsible for joining its workers before disposal resolves."

**Over-detailed:** A chronological account of every promise and callback used to implement teardown.

The actor, ordering, point where ownership changes, and completion guarantee are separate factual clauses.

### Event documentation preserves ordering consequences

**Over-trimmed:** "Composes and caches the request prefix."

**Balanced:** "Composes the request prefix once before the first request. Listener appends join the current request, and size accounting receives the composed prefix."

**Over-detailed:** A walkthrough of the helpers, cache fields, and callbacks that implement the ordering.

Event order and its current-request consequence are caller-visible behavior, not implementation narration.

### Orient complicated code without narrating it

**Over-trimmed:** "Worker sandbox support."

**Balanced:** "Owns the worker sandbox and its host bridge. Initialization is single-shot; disposal terminates the worker and rejects later calls. See the isolation design doc for the protocol rationale."

**Over-detailed:** A paragraph-by-paragraph preview of the classes and helper functions below.

Keep the module's role, dependencies, responsibilities, and non-obvious lifecycle behavior. Link architecture rationale and let the code show local control flow.

### Public API documentation includes failures

**Over-trimmed:** "Returns the sandbox handle."

**Balanced:** "Returns the initialized sandbox handle. Throws if initialization has not completed or the sandbox has already been disposed."

**Over-detailed:** The internal state-machine branches and exact helper calls that lead to each throw.

Throws and state preconditions are caller-visible contract facts.

### Keep a concise implementation mapping

**Over-trimmed:** "Search provider backed by an external API."

**Balanced:** "Maps each provider result to the shared search-result fields, preserving the title, URL, and text while omitting provider-only ranking metadata."

**Over-detailed:** A field-by-field restatement of the mapping code, including fields with identical names and obvious assignments.

Keep mapping details that explain where an adapter drops or changes information.

### Link rationale while keeping the local contract

**Over-trimmed:** "Disposal is documented in the lifecycle design doc."

**Balanced:** "Disposal aborts the run and waits for provider quiescence. See the lifecycle design doc for ownership and race handling."

**Over-detailed:** Repeating the design doc's promise choreography and rejected ownership models beside every disposer.

Keep the behavior and completion guarantee where callers need them. Link aggressively for the algorithm and rationale; a link cannot replace the local contract.

### Shipped decision records retain verification contracts

**Over-trimmed:** Deleting the entire verification section because the decision has already shipped.

**Balanced:** "Unit tests cover cancellation before and after publication, disposal quiescence, and provider reload. A built-artifact smoke covers the real entry path; recorded-output coverage is deferred because the transport is process-specific."

**Over-detailed:** A file-by-file walkthrough of fixtures and assertions with no additional behavioral distinction.

Remove migration tasks and test narration. Keep the tiers, the behaviors they pin, the real entry path, and named coverage gaps.

### A security boundary may need one concrete example

**Over-trimmed:** "Mounted plugins share the host's authority."

**Balanced:** "Mounted plugins share the host's authority; for example, access to a shell service permits commands with the host executor's privileges."

**Over-detailed:** A list of every service a plugin could misuse and every hypothetical exploit.

Keep one example when it makes an otherwise abstract security limit operationally clear.

### Delete reasoning transcripts entirely

**Over-detailed:** "First the loop checks whether the value is absent. If it is absent, the next branch returns early. Otherwise it continues, which is why the final assertion is safe."

**Balanced:** No comment when the code already expresses those branches. If the early return protects a non-obvious invariant, state only that invariant.

Do not compress a reasoning transcript into shorter narration; remove it.

### Configuration comments explain what the tree cannot

**Over-detailed:** "This entry loads the storage provider, followed by the policy component, followed by the read, write, and edit commands," when the adjacent entries already show that order.

**Balanced:** "Load policy before the user-facing commands so their write and edit calls pass through the read-before-mutation check."

Keep the consequence of order, a surprising scope rule, or a security boundary. Let the configuration show its own inventory.

### Do not trim for word count alone

**Current:** "The adapter converts provider errors into the shared error type so callers can handle authentication, rate-limit, and transient failures uniformly."

**Shorter but worse:** "The adapter normalizes provider errors."

**Balanced decision:** Keep the current sentence unless a link or surrounding contract already lists the failure categories. The shorter version loses the consequence and distinctions without improving structure.

### Model-visible text follows ownership

**Over-trimmed:** "The tool returns errors when a call fails."

**Over-detailed:** Copying another component's schema and renderer strings into this backend's README.

**Balanced:** Quote stable prompt, result, and error text this component owns. Link the generated tool reference for schemas and the consumer README for text another component owns; state only this component's conditions or deltas locally.

Wording that reaches a model is behavior, but duplication still drifts. Exactness belongs at the owner.

### Generated summaries must stand alone

**Over-trimmed:** "Approval request and policy service." The owner explains policy order and audit logging later, but the generated reference exports only its first sentence.

**Over-detailed:** Moving the service's full lifecycle and notification behavior into the extracted sentence.

**Balanced:** "Approval service that applies policy before answerers and logs every ask/outcome pair to the requesting session." Keep non-extracted detail in later sentences.

Know what the generator extracts. That fragment must preserve the contract needed on its generated surface.

### Limitations are contracts, not debt inventories

**Over-trimmed:** Omitting a process-lifetime cache that makes configuration changes require a restart.

**Over-detailed:** Listing private helper cleanup and unused test-only accessors with no caller or maintainer consequence.

**Balanced:** "Provider selection is cached for the process lifetime; installing or repairing a provider requires a restart." Keep ordinary cleanup in its tracking marker or decision record.

Retain gaps and non-obvious constraints that affect use or safe maintenance. A README is not a backlog dump.

## Part 2 — Vantage correction

### Dead citations

#### Decision ordinal with a committed owner

**Leaked:** "Command input resolves against the visible list (decision 21)."

**Fixed:** "Command input resolves against the visible list — the plain-text-reference decision, owned by `docs/decisions/palette-resolution.md`."

The ordinal resolves nowhere at the current commit; the decision's name and owning path do. Name the owning path at least once per file — as a link where the surface supports one — and later mentions may use the searchable name alone.

#### Decision ordinal without an owner

**Leaked:** "The registry rejects duplicate names (decision 7: names are flat, no namespacing)."

**Fixed:** "The registry rejects duplicate names; names are flat, with no namespacing."

No committed artifact owns "decision 7", so the citation is deleted — but its factual clause (flat names) is restated to stand alone, not deleted with it.

#### Audit item codes

**Leaked:** "Rendering is pure: same input, same string (audit R3)."

**Fixed:** "Rendering is pure: same input, same string."

No audit document exists in the repository; the code is session shorthand carrying zero propositions.

#### Section numbers of uncommitted drafts

**Leaked:** "Layering follows the design (v2 §3.2): `src/core/` is the pure core."

**Fixed:** "Layering: `src/core/` is the pure core."

A section number of a draft nobody committed is unresolvable. Contrast: "escapes per RFC 9110 §10.1.5" stays — an external standard resolves outside the repository by design, and a committed document that owns its numbering may be cited by section.

#### Plan-phase labels

**Leaked:** "`src/ui/` is the shell (T4); the P-I migration owns the adapters."

**Fixed:** "`src/ui/` is the shell; the adapters live in `src/ui/adapters/`."

Phase labels index a plan that never landed. Replace the label with what the phase produced.

### Series and review-thread vantage

#### Series position in durable prose

**Leaked:** "A future remote backend implements this interface (the sandbox backend is a later change in this series)."

**Fixed:** "A remote backend can implement this interface without changing the render layer."

Durable prose cannot see the series. Keep the extension-point contract; the pending work's home is the change itself, a tracking marker, or an issue.

#### "This change" in a README

**Leaked:** "This change adds cursor-based pagination to the item list."

**Fixed:** "The item list paginates by cursor."

A README outlives every change; state the mechanism as current fact.

### Change narration and version stamps

#### War story with a change reference

**Leaked:** "Colors used to come from `--surface-*` tokens, which nothing defined, so it always rendered the fallbacks; the alias tokens fixed that (change #88)."

**Fixed:** "Colors come from the alias tokens; an undefined token renders the fallbacks."

Both live facts survive — the current mechanism and the standing failure behavior — restated in the present. The defect's biography belongs to the change and its decision record.

#### Removal narration

**Leaked:** "The `legacy` flag is gone with the cleanup; requests ride the single code path now."

**Fixed:** "Requests use a single code path."

Readers who never saw the flag learn nothing from its absence. "Now" contrasting with a deleted past is a version stamp.

#### Fixed regression → counterfactual present

**Leaked:** "This used to double-encode multibyte labels."

**Fixed:** "Without the byte-length guard, multibyte labels double-encode."

The regression pin survives as a present-tense counterfactual that names the guard; "used to" pins it to repository archaeology instead.

#### Indexical version stamps

**Leaked:** "Batch rendering is synchronous this release; the async path is roadmap work."

**Fixed:** "Batch rendering is synchronous." (The deferral lives in `TODO(batch-render):` at the call site.)

"This release" / "v1" / "today" go stale the moment they merge. A historical stage name inside a decision record's change-story section is current-state-safe; the indexical form never is.

### Review choreography

#### Review verdicts as prose

**Leaked:** "Rejected in review: caching the resolved path. We keep resolution per-call."

**Fixed (in a decision record's alternatives-considered section):** "**Caching the resolved path.** Rejected: the path depends on the caller's working directory, so a cache keyed by request would serve stale roots."

The alternatives-considered genre is the sanctioned home; the reviewer and the round are not part of the rationale.

#### Draft ordinals

**Leaked:** "As of the fifth revision of this record, the parser also validates manifests."

**Fixed:** "The parser validates the manifest."

A shipped record states shipped reality; its own revision history lives in version control.

### Reviewer-addressed justification

#### Arguing a cast

**Leaked:** "The cast is safe — the client constructed the object, it simply doesn't declare the optionals strictly enough."

**Fixed:** "The client constructs this object with every optional populated; the declared type is looser than the runtime guarantee."

State the invariant a maintainer must not break. "It simply…" answers an objection nobody at the current commit raised. If the invariant is visible in the code, delete the comment instead.

#### Appeal to review authority

**Leaked:** "This is correct because the reviewer confirmed the wrapping order."

**Fixed:** (deleted; the wrapping order is stated in the function's return documentation.)

Correctness claims cite invariants or tests, never people.

### Restatement and derivation

#### Control-flow narration

**Leaked:** "First we normalize the label, then we truncate it, then we wrap it."

**Fixed:** (deleted.)

The three lines below the comment say the same thing in code.

#### Test walkthrough

**Leaked:** "This test creates a client, sends two requests, waits for the second reply, and then asserts the log has four entries."

**Fixed:** "Two round-trips must produce exactly four log entries — the projection dedupes the shared prefix."

Keep only the non-obvious assertion rationale; the walkthrough restates the test body.

### Hedges and planning residue

#### Unmarked deferral

**Leaked:** "Probably fine to render eagerly for now."

**Fixed:** (deleted; the deferral already has its `TODO(batch-render):` marker.)

A hedge without an owner is planning residue. If no marker exists, write one (`TODO(batch-render): coalesce per animation frame`) instead of keeping the hedge.

#### Vague sizing

**Leaked:** "A 64 KiB buffer should be enough for most cases."

**Fixed:** "64 KiB holds the largest observed frame (48 KiB) with headroom; a larger frame fails loudly in the decoder."

Replace the hedge with the actual bound and the failure behavior when it is exceeded.

### Authoring-language slips

**Leaked:** "The renderer runs on the client 端; see the 设计稿 for spacing. ---- 私有 ----"

**Fixed:** "The renderer runs on the client side; spacing follows the design-tool frame `item-badges`."

Working-language fragments and session separators are transcription residue. The design-tool frame name stays: external provenance that resolves outside the repository by design.

### Keeps

#### Issue references are durable on every surface

**Keep:** "The cap applies to the complete rendered value, wrappers included (issue #1470 owns the follow-up)."

An unaided pass deleted this, reasoning that issue citations belong in decision records. Wrong direction: issues resolve at the current commit from any surface, and "#N owns the follow-up" is the sanctioned home for deferred work in a README. What decision records and incident reports additionally sanction is citing *merged changes* as evidence.

#### Dead name-drops are not "naming the owner"

**Delete:** "Badge renderer over the widget interface (see the rendering design doc)."

An unaided pass kept this as "naming the owning document by topic". The test is resolvability, not form: if no committed file answers to "the rendering design doc", the pointer is dead. Retarget it to the committed owner if one exists; otherwise delete it.

#### Suppression justifications

**Keep (after fixing):** a linter suppression comment whose trailing reason reads "the one-element literal guarantees index 0."

The justification clause is required prose. When the stated reason is false — the original claimed "the loop guard above proves a frame exists" with no loop in sight — fix the reason; never delete it.

#### Measured bounds

**Keep:** "Depth cap (measured: 512 nests ≈ 0.15s synchronous; 4096 blocks the loop)."

The measurement pins the constant against uninformed retuning, and "measured" is the provenance that distinguishes data from a guess.

#### Runtime old/new is not change history

**Keep:** "The old connection drains before the new one accepts."

"Old" and "new" here name two live runtime objects during handover, not repository states. The change-narration ban is about repository history, not lifecycle vocabulary.

## Part 3 — Overcorrection traps

Enumerate a passage's propositions before trimming it.

### Flipping an obligation into an endorsement

**Original:** "These direct registrations are exceptions pending migration to the registry API."

**Overcorrected:** "These direct registrations are sanctioned exceptions."

**Right:** "These direct registrations are exceptions pending migration to the registry API."

"Pending migration" is an obligation; "sanctioned" blesses the status quo. The trim inverted the sentence's modality while shortening it.

### Promoting a hypothetical to a shipped feature

**Original:** "A future IPC transport subclasses the executor and overrides `send`."

**Overcorrected:** "An IPC transport subclasses the executor and overrides `send`."

**Right:** "A hypothetical IPC transport — no such transport exists — would subclass the executor and override `send`."

Deleting the future-marker alone turns a design illustration into a claim that the class ships. Mark the hypothetical explicitly instead of just unmarking the future.

### Deleting a true fact with the transcript around it

**Original:** "The check notice narrates the validation order; the notice text is also what the documentation type check compiles against."

**Overcorrected:** (whole sentence deleted as narration.)

**Right:** "The notice text is what the documentation type check compiles against."

Half the sentence was narration; the other half was a load-bearing coupling. Delete clauses, not sentences, when propositions share a line.

### Dropping provenance while keeping the number

**Original:** "The 4 MiB ceiling is measured: the largest generated type module is 3.1 MiB."

**Overcorrected:** "The ceiling is 4 MiB; the largest generated type module is 3.1 MiB."

**Right:** keep "measured".

Without "measured" the 3.1 MiB reads as a definition rather than an observation, and nobody re-measures before raising the ceiling.
