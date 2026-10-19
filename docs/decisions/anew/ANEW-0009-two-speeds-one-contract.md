# ANEW-0009 — Two speeds, one contract

- Status: Accepted
- Date: 2026-10-16
- Revised: 2026-10-19 — moved to docs/decisions/anew/ as ANEW-0009 (template namespace, ANEW-0010); decision unchanged

## Context
Agents run `./scripts/check` after every fix and before every handoff. When the contract holds
slow steps (e2e, long integration suites), every inner-loop iteration pays the full price — a
10-minute check run six times is an hour of waiting — and slow checks become the dominant cost
of a feature. ANEW multiplied that cost itself: §fixes, refactor steps and the recovery ramps
asked for the full suite after every single step or finding. Without a sanctioned fast path,
agents improvise one (running single tests ad hoc), which is an unwritten second contract.

## Decision
Two profiles inside the one contract. `./scripts/check` runs every step (full) and stays the
default and the only evidence; `./scripts/check --fast` runs only steps tagged `[fast]` in their
name. Per step, per finding and per iteration use fast; segment exits, PROVE steps, ramp exits,
the verify table and CI use full. Output names the profile (`CHECK GREEN (fast, n)` vs
`(full, n)`); a conf without tags runs everything in both profiles, and a tagged conf still runs
every step under an older `scripts/check`.

## Consequences
- Benefits: inner-loop iterations cost the fast profile, not the full one; the contract stays one
  command and one conf; evidence is never ambiguous because the profile is printed.
- Costs: intermediate fix/refactor commits are fast-proven, not full-proven — CI runs full per
  push, not per commit, so a full-red commit can sit between two green ones. "Evidence cites the
  full profile" is Documented only: the label makes a violation visible, nothing detects it.

## Alternatives considered
- A second script (`check-fast`): two contracts — an agent can pass one and fail the other.
- Skipping tests ad hoc in the inner loop: no contract at all; what ran is unknowable.
- Making fast the default: evidence silently weakens for everyone who doesn't know the flag
  (CI, hooks, older docs).

## Revisit triggers
- Fast-labelled output shows up as evidence in verify tables or PRs (consider a doctor check).
- Bisecting regularly lands on full-red intermediate commits.
