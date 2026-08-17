# Workflow: Refactor

**Goal:** change structure, preserve behavior — provably.

```
BASELINE → SCOPE & PLAN → [APPROVAL] → REFACTOR → PROVE UNCHANGED → REVIEW
```

1. **BASELINE.** `scripts/check` must be green *before* starting — never refactor on red. If the
   area lacks tests, write **characterization tests first** (pin current behavior, even its warts).
2. **SCOPE & PLAN** — Role: Developer, `prompts/plan.md`. Explicit boundaries: what improves, what
   is untouched, and the sentence "no observable behavior change". Mixed refactor+feature work is
   forbidden — split it.
3. **APPROVAL.** **[GATE: human]** Especially: is the blast radius worth the payoff?
4. **REFACTOR.** Small, committable steps; suite green after each step (drift → R-07).
5. **PROVE UNCHANGED.** Same tests green, zero test edits (a needed test edit means behavior
   changed — stop, that's a feature). Performance-sensitive paths: measure before/after (R-12).
6. **REVIEW** — fresh session. Extra lens: did semantics sneak in? Are names/layers now *more*
   aligned with `docs/architecture.md`?
