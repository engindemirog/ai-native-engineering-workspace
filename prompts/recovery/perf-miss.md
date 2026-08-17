# R-12 — Performance Target Missed

```
Target: <target, e.g. p95 < 200ms>. Current: <measured value>.
Discipline is fixed: 1) MEASURE first — reproducible method, show the numbers and how you got
them. 2) Identify the dominant cost with evidence (profile/explain/timings), not intuition.
3) Propose ONE optimization — the smallest change addressing the dominant cost; my approval.
4) RE-MEASURE with the exact same method; show before/after.
PROTECTION: no speculative optimization sprees; one change per round, each proven. Correctness
tests stay green throughout.
```
