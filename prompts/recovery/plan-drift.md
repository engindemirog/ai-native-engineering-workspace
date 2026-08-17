# R-07 — Plan Drift

```
You are outside the approved plan. Do this:
1) Compare the current change set against specs/plans/<NNNN>-plan.md; produce a DEVIATION LIST
   (file + why).
2) For each deviation: was it necessary? If yes, propose it as a plan amendment — I approve and it
   gets recorded in the plan. If no, REVERT that change.
PROTECTION: while reverting, do not touch in-plan changes or tests. After cleanup run
./scripts/check and show green. Plans are amended by approval, never silently.
```
