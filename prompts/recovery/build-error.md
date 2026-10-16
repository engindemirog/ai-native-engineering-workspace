# R-01 — Compile / Runtime Error

```
This error occurred: <paste error>.
Before attempting any fix, DIAGNOSE: what is the root cause — which file, which assumption,
why did it surface now? Explain the diagnosis, then propose ONE fix; apply it only with my approval.
PROTECTION: silencing the symptom is forbidden (burying in try/catch, editing tests, disabling
warnings). Touch only files related to the root cause. Iterate with ./scripts/check --fast; after
the fix run ./scripts/check (full — a ramp exit is a gate) and show the output.
```
