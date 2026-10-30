# ANEW-0012 — An unprovable criterion is moved out, never waived

- Status: Accepted
- Date: 2026-10-29

## Context
In a field pilot, one acceptance criterion could not be proven on the developer's machine and the
spec shipped "with an exception" that no rule allows. AGENTS.md rule 4 says done requires every
criterion mapped to proof, and the invariant rules are never weakened. A waiver path would be a
second meaning of "done"; no path at all makes people invent one.

## Decision
At the ship gate the human may move a criterion out of the spec. It is a spec change (R-08), not
an exception: the criterion line stays, struck through, and on that line says where it went —
`→ moved to B-<n>` (backlog) or `→ moved to spec <NNNN>` (an open spec) — who decided, when and why. The spec
then ships with every remaining criterion proven, so rule 4 holds word for word. A criterion of a
sensitive area cannot be moved out. doctor checks every new ship (relative to the base ref):
unchecked criteria need a move line with an existing target. Shipped specs are not judged again.

## Consequences
- Benefits: no invented exceptions; the unproven part stays visible as open work with an owner;
  rule 4 and the immutability of shipped specs are untouched.
- Costs: a ship may deliver less than the spec promised; the move line is the record of that.
  Locally doctor sees only an uncommitted ship (base = HEAD); CI on a pull request sees every one.

## Alternatives considered
- A waiver (`Waived: AC-n`) with the criterion kept: makes "done" mean two things and weakens
  rule 4 in practice.
- No path, ship blocked until proven: correct but unrealistic; it is what led to the invented
  exception. Kept for sensitive areas only.

## Revisit triggers
- Moves become routine on a project (a spec-quality signal: criteria written that cannot be proven).
