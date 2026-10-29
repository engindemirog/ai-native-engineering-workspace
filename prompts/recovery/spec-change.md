# R-08 — Spec Changed Mid-Work

```
The requirement changed while work is in progress: <what changed>.
A NEW capability is not a change: it becomes its own spec (prompts/spec.md), shipped after this
one or before it if this one depends on it. R-08 is for changed criteria of THIS spec — including at the ship gate, when a criterion cannot
be proven and I move it out: keep its line, struck through, with `→ moved to B-<n> | spec <NNNN>
— <name>, <date>, <why>` on that line, and the backlog entry or spec created. Never for a
sensitive-area criterion; never a silent drop (doctor checks every new ship).
Order is fixed: 1) UPDATE THE SPEC first (specs/active/…) — new/changed acceptance criteria,
scope notes. 2) Produce a DELTA PLAN: which plan steps survive, which die, what's new; impact on
already-built work. 3) Wait for my approval, then continue.
PROTECTION: no code against the new requirement before the spec and delta plan are approved —
otherwise the spec stops being the source of truth.
EXIT: once the delta plan is built, ./scripts/check (full) green, output shown.
```
