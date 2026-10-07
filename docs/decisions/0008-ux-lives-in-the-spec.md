# ADR 0008 — User experience lives in the spec

- Status: Accepted
- Date: 2026-10-07

## Context
ANEW has software design (`docs/architecture.md`, the plan, ADRs) but no place for user experience.
The only UI rule sits at the very end: in VERIFY a screenshot is evidence. With no flow, states or
design written down earlier, that screenshot is compared against nothing — an agent shows the happy
path and the empty, error and no-permission states go unspecified, unbuilt and unverified.

## Decision
User experience is part of the spec, owned by the Analyst in ANALYZE: a required "User experience"
section (flow, states, design link, accessibility — or "none — no user interface"), one acceptance
criterion per listed state, and VERIFY checks screenshots against that section. Designs are linked,
never copied into the repo (ADR 0006). Mini-specs carry a `Design:` link for UI changes.

## Consequences
- Benefits: UI states are decided before the plan, become testable criteria, and VERIFY has
  something to compare against; no new workflow, role, segment or gate.
- Costs: specs for UI work get longer; ANEW still cannot judge visual quality — it checks that the
  designed states exist and behave, not that they look right. The section is Documented only
  (ADR 0004): `scripts/doctor` does not validate it.

## Alternatives considered
- A DESIGN segment with a Designer role and its own gate: rejected — adds a stage ANEW cannot
  validate, and most teams already run design in their own tools and cadence.
- Integrating a design tool (exports, tokens, frame sync): rejected as framework creep and
  tool-specific, against the tool-agnostic core.
- Status quo (screenshots at VERIFY only): rejected — verification without a specified target.

## Revisit triggers
- UI specs repeatedly ship with states missing despite the section (consider a doctor check).
- Teams need design approval as a separate human gate before ANALYZE ends.
