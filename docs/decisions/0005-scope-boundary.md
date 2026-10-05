# ADR 0005 — ANEW governs intent → merge; release and operations are out of scope

- Status: Accepted
- Date: 2026-10-05

## Context
Requests to add deployment pipelines, environment promotion, feature flags, observability and
on-call procedures to ANEW recur, because production is where the cost of a wrong decision is
paid. But these are the areas where organizations differ most — cloud, platform, compliance regime,
release cadence — and where mature tooling already exists. A template that tried to cover them
would either be wrong for most users or become a second product.

## Decision
ANEW governs the path from intent to merge: context, specification, plan, authorization,
implementation, independent review, evidence. Release, deployment and production operations are
out of scope. ANEW connects to them through `scripts/check` (the one contract CI runs) and the
CI workflow, which organizations extend with their own steps. The incident workflow
(`workflows/incident.md`) is the single bridge back from production into the loop: stabilize,
collect evidence, root-cause, then fix through the bug-fix workflow.

## Consequences
- Benefits: the core stays tool- and stack-agnostic and small; every rule in it can be held at a
  known level (ADR 0004); users keep their existing release tooling.
- Costs: ANEW does not prove that what was merged is what runs — that proof belongs to the
  organization's pipeline; teams without one get no help from ANEW for it.

## Alternatives considered
- A "packs" layer with release presets per platform: still possible later (README roadmap), but
  as optional add-ons, never as core.
- Extending the spine with RELEASE and OPERATE stages: rejected — gates that ANEW cannot validate
  or enforce would be Documented only, which is exactly the overclaim ADR 0004 removes.

## Revisit triggers
- A stack-agnostic, file-based release gate emerges that `scripts/doctor` could validate.
- Incident postmortems repeatedly point at a gap between merge and deploy that no user tooling covers.
