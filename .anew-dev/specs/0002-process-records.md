# Spec 0002 — Process records: descoping at ship, triage, ship commit, self-critique, gates

- Status: Approved
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0002-plan.md`

## Intent
The OYP pilot (field report, 2026-10-29) and spec 0001's own run hit five places where ANEW's
process had no defined record, so agents improvised: a criterion that could not be proven was
shipped "with an exception" that no rule allows (rule 4); the triage decision lived only in chat
because lite has no PR at triage time (A-3); the ship commit changes HEAD, so its evidence can
never cite "SHA = HEAD" literally (A-4); a self-critique postponed by a spec split was a free-text
note nobody could check (A-9); one "approve" answered two different questions at once (A-8).
Success: each of these has one written place and one rule, doctor checks what is checkable, and
no invariant rule is weakened. Deliberately not done: platform and template notes (spec 0004),
clean-clone and residue work (spec 0003).

## Requirements
1. **Descoping at ship, never a waiver.** AGENTS.md rule 4 stays as it is: a shipped spec has
   every criterion proven. When a criterion cannot be proven, the human may, at the ship gate,
   move it out of the spec: the criterion line is kept, struck through, and says where it went
   (`→ moved to spec <NNNN>` or `→ moved to B-<n>`), who decided, when and why. That is a spec
   change (R-08) recorded at ship, not an exception. What moved is open work: a backlog entry or
   a spec exists for it. A criterion of a sensitive area (`docs/domain.md`) cannot be moved out:
   the spec does not ship until it is proven. The `→ moved to` marker is what counts; striking the
   line through is for the human reader. Lite and strict work the same way: the human decides at
   the ship gate.
2. **doctor checks new ships.** For a spec that appears in `specs/done/` relative to the base ref
   (the same base the immutability check uses — already-shipped specs are never judged again),
   every criterion line (`AC-`, and `CB-` / `PB-` in mini-specs) is either checked or carries a
   `→ moved to` target; a `B-<n>` target exists in `specs/backlog.md`, a `spec <NNNN>` target
   exists in `specs/active/` or `specs/done/`. Violations are a gate (WARN locally, FAIL under
   `--strict`). Locally the base is HEAD, so only an uncommitted ship is seen; CI, with the PR's
   base, sees every new ship — as for the immutability check; the docs say so.
3. **Triage lives in the plan.** The plan template gets a `## Triage` section: one table per
   review or VERIFY round (finding, verdict, note), with the deciding human and date. The
   workflow step 7, the segments table and the PR template point there; the PR description links
   it instead of being the record.
4. **The ship commit inherits the full green.** docs/testing.md rule 6 gets one exception: a
   commit whose diff against the commit with the cited full green touches only `specs/` inherits
   that green; the evidence names both SHAs and the command that proves the diff is specs-only.
   Anything else in the diff needs a new full run. ANEW's own development applies the same rule
   to `.anew-dev/` (noted in `.anew-dev/README.md`).
5. **Self-critique has a status.** Both spec templates get `- Self-critique: done | pending
   (<condition>)`. doctor: a Draft spec with `pending` → WARN naming the condition; an Approved or
   In progress spec with `pending` → gate. A spec without the field (older specs) → nothing.
6. **One decision per gate message.** A gate message asks for exactly one decision. Several open
   items are either asked one per message, or offered as one decision "accept every
   recommendation listed above" with each item and its recommendation written out. An answer
   that does not say which decision it answers is asked back, never interpreted.

## User experience
none — no graphical interface. Terminal and document states:
- doctor, new ship with an unproven criterion and no move line → gate line naming spec and
  criterion; with a `B-<n>` target missing from the backlog → gate line naming both.
- doctor, self-critique `pending` → WARN (Draft) / gate (Approved, In progress) with the condition.
- No new ship, no self-critique field → output identical to v1.21.
- Design reference: none — the flow above is the design.
- Accessibility: plain text, existing `ok` / `WARN` / `FAIL` prefixes.

## Constraints & out of scope
- AGENTS.md invariant rules are not weakened; rule 4's wording is unchanged (Req. 1 is a spec
  change, not a waiver). Shipped specs stay immutable: Req. 2 judges only new ships.
- POSIX sh, as every script; backward compatible: an existing workspace with no new ship and no
  self-critique field sees no new output. CHANGELOG v1.22 with behavior list; selftest coverage.
- Out of scope: platform/template notes (A-5…A-7, E-1…E-4 → spec 0004); clean-clone and residue
  work (A-2, A-6 → spec 0003); enforcing Req. 3, 4 and 6 by script (documents only); B-1, B-2.
- Self-critique: done (8 gaps folded in, approved 2026-10-29)
- Split: proposed (descoping + doctor / the other records); kept as one — Engin Demiroğ,
  2026-10-29, one record discipline, script code in two of the five parts only.

## Acceptance criteria
- [ ] AC-1 — A spec added to `specs/done/` vs the base ref with an unchecked criterion and no
  `→ moved to` target: doctor reports a gate line naming spec and criterion; WARN locally,
  FAIL (exit 1) under `--strict`. The same for an unchecked `CB-` / `PB-` line of a mini-spec.
- [ ] AC-2 — The same spec with the criterion struck through and `→ moved to B-3`, and `B-3`
  present in `specs/backlog.md`: no gate line. With `B-3` missing from the backlog: gate line.
  `→ moved to spec 0007` with no spec 0007 in `active/` or `done/`: gate line; with one: none.
- [ ] AC-3 — A spec already in `specs/done/` at the base ref, with unchecked criteria: no new
  line (shipped specs are not re-judged).
- [ ] AC-4 — A move line on a criterion of a spec that declares `Sensitive area:` → gate line
  ("a sensitive-area criterion cannot be moved out").
- [ ] AC-5 — Self-critique: Draft + `pending (<cond>)` → WARN with the condition; Approved or
  In progress + `pending` → gate (FAIL under `--strict`); `done` or no field → no line.
- [ ] AC-6 — Documents: `specs/TEMPLATE.md` and `TEMPLATE-mini.md` carry the Self-critique field;
  `prompts/spec.md` sets it; the ship step (`workflows/feature-development.md` step 10,
  `workflows/segments.md`) describes descoping with its line format; `prompts/recovery/spec-change.md`
  names the ship-gate case.
- [ ] AC-7 — Documents: `specs/plans/TEMPLATE.md` has `## Triage`; feature-development step 7,
  the segments VERIFY entry check and `.github/pull_request_template.md` point to it.
- [ ] AC-8 — Documents: `docs/testing.md` rule 6 states the specs-only inheritance with the
  proving command (`git diff --name-only <sha> HEAD -- . ':!specs/'` empty), and the verify prompt cites it.
- [ ] AC-9 — Documents: the one-decision rule is in `workflows/segments.md` (gate conventions);
  the plan inventories adapter texts that ask at a gate, and each either states the rule or
  points to segments.md.
- [ ] AC-10 — `scripts/selftest` covers AC-1 … AC-5; each scenario turns red on a deliberate
  break (reported by VERIFY); AGENTS.md rule 4 text is byte-identical to v1.21.

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green (this template: `doctor --strict` + `selftest`, as in spec 0001 Q5)
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in the backlog
- [ ] Docs / ADRs updated (CHANGELOG v1.22; ADR for descoping-instead-of-waiver)
- [ ] Spec moved to `done/` (it becomes immutable there)

## Scorecard (fill at ship — honest numbers make the process improvable)
| Metric | Value |
|---|---|
| Spec revisions | |
| Fix rounds | |
| Review findings: real / noise / deferred | |
| Regressions introduced | |
| Bugs escaped to production | |
