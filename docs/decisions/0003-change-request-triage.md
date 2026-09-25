# ADR 0003 — Change requests are triaged by the behavior test, not by apparent size

- Status: Accepted
- Date: 2026-09-25

## Context
Most enterprise work is neither a new feature nor a bug: an existing behavior must change. Routing
every such request through the full feature workflow is too heavy; routing it by how small it
*sounds* ("just a label") is how shared components get changed with no spec and no regression
criteria. Two failure modes were observed: mislabeling a deviation from the agreed behavior as a
"change" (it is a bug and needs a reproduction first), and treating a change that alters an
acceptance criterion as trivial.

## Decision
`workflows/change-request.md` triages every request with three questions in a fixed order:
(a) is the current behavior a deviation from what was agreed → bug-fix workflow; (b) behavior
test: does any acceptance criterion change or appear → CHANGE lane (mini-spec), else TRIVIAL;
(c) blast radius: shared code touched → CHANGE lane regardless of (b). The CHANGE lane uses
`specs/TEMPLATE-mini.md` with **changed** and **preserved** behavior criteria and keeps the plan
approval gate. The TRIVIAL lane's ceremony is a bootstrap-time policy in `docs/git.md`. Shipped
specs are never edited; a mini-spec references them with `Supersedes`.

## Consequences
- Benefits: small changes stay cheap without becoming untracked; regression criteria are written
  at the moment the risk is created; brownfield code gets a mini characterization for free; the
  same segments, gates, and doctor checks apply, so nothing new has to be enforced.
- Costs: one more workflow and template to know; the rubric needs judgment for (c) — "shared" is
  not always obvious; the trivial policy is a per-project choice that teams must actually make.

## Alternatives considered
- Size-based routing (lines changed, files touched): objective but wrong — the risky changes are
  small; rejected.
- Everything through the full feature workflow: safe, ignored in practice; rejected.
- Everything through mini-spec, no trivial lane: available as trivial policy option (3) for teams
  that want it; not the default.

## Revisit triggers
- Trivial-lane changes cause regressions (tighten the rubric or default to policy (3)).
- Mini-specs grow to the size of full specs (the lane is being used for features).
