# Workflow: Refactor

**Goal:** change structure, preserve behavior — provably.

```
BASELINE → SPEC & PLAN → [APPROVAL] → REFACTOR → PROVE UNCHANGED → REVIEW → [TRIAGE] → SHIP
```

1. **BASELINE.** `scripts/check` must be green *before* starting — never refactor on red. If the
   area lacks tests, write **characterization tests first** (pin current behavior, even its warts).
2. **SPEC & PLAN** — Role: Developer. The spec is a mini-spec from `specs/TEMPLATE-mini.md`
   (`specs/active/NNNN-refactor-<name>.md`): Changed behavior = *none — no observable behavior
   change*; Preserved behavior = the characterization criteria from step 1; Source = the work
   item. Then `prompts/plan.md` with explicit boundaries: what improves, what is untouched. Mixed
   refactor+feature work is forbidden — split it.
3. **APPROVAL.** **[GATE: human]** Especially: is the blast radius worth the payoff?
4. **REFACTOR.** Small, committable steps; suite green after each step (drift → R-07).
5. **PROVE UNCHANGED.** Same tests green, zero test edits (a needed test edit means behavior
   changed — stop, that's a feature). Performance-sensitive paths: measure before/after (R-12).
6. **REVIEW** — fresh session. Extra lens: did semantics sneak in? Are names/layers now *more*
   aligned with `docs/architecture.md`? **[GATE: human]** triage (real / noise / investigate).
7. **SHIP.** PR → merge → the mini-spec moves to `specs/done/` (`Status: Shipped`).
