# Spec NNNN — <short name> (mini)

- Status: Draft | Approved | In progress | Shipped
  <!-- Same state machine as TEMPLATE.md: Draft → Approved (human) → In progress (/build) → Shipped (ship). -->
- Mode: lite | strict (from AGENTS.md at creation time)
- Plan: `specs/plans/NNNN-plan.md`
- Source: <!-- MANDATORY — the work item key (ticket / issue / request id). No key, no mini-spec. -->
- Supersedes: <!-- optional — <NNNN>/AC-x of the shipped spec whose behavior this replaces. specs/done/ is never edited. -->

## Intent
<!-- 2–3 sentences, business language: what changes, for whom, why now. -->

## Changed behavior
<!-- 3–5 atomic, testable criteria describing the NEW behavior. -->
- [ ] CB-1 —
- [ ] CB-2 —
- [ ] CB-3 —

## Preserved behavior
<!-- MANDATORY, at least 2 — regression criteria: what around the change must keep working exactly
as today. In a brownfield module with no spec, these are the mini characterization: write them
from observation (run it, screenshot it), not from assumption. -->
- [ ] PB-1 —
- [ ] PB-2 —

## Out of scope
<!-- What this change deliberately does NOT touch. -->

## Definition of Done
- [ ] `scripts/check` green
- [ ] Independent review done; real findings fixed, noise rejected with written rationale
- [ ] Criterion ↔ evidence table complete for CB-* **and** PB-* (UI: before/after screenshots)
- [ ] Spec moved to `specs/done/` (immutable there)
