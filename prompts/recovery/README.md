# Recovery Ramps (R-01 … R-12)

Things go wrong: builds break, tests go red, plans drift, requirements change mid-flight, context
gets foggy. Ramps are not an alternative to the loop — they are **safe returns to it**. Every ramp
carries its own protection rules (no test silencing, minimal file scope, evidence on return).

| Code | Situation | File | Core rule |
|---|---|---|---|
| R-01 | Compile/runtime error | `build-error.md` | Diagnose first, then ONE fix; no symptom-silencing |
| R-02 | Red test | `red-test.md` | First decide: code, test, or spec? Weakening/deleting/skipping forbidden |
| R-03 | Flaky test | `flaky-test.md` | Make deterministic; no skip/retry; evidence: 5 consecutive greens |
| R-04 | Fix caused a regression | `regression.md` | Revert to green first; then narrow fix + permanent regression test |
| R-05 | "Investigate" finding | `unverified-finding.md` | No fixing — MINIMAL REPRO first; no repro → reasoned close |
| R-06 | Fix-round limit exceeded | `fix-loop-limit.md` | STOP; root cause in spec or plan? Analysis only, no code |
| R-07 | Plan drift | `plan-drift.md` | Deviation list; unapproved changes reverted |
| R-08 | Spec changed mid-work | `spec-change.md` | Spec updated FIRST → delta plan → approval |
| R-09 | Context fog / handoff | `context-fog.md` | State file + session handoff; no unproven "done" claims |
| R-10 | Ambiguity / docs–code conflict | `ambiguity.md` | NEVER assume; options with costs → human decides → decision written to source of truth |
| R-11 | Safe rollback | `rollback.md` | `git revert`; no history rewriting/force push; migration risk report |
| R-12 | Performance target missed | `perf-miss.md` | Measure first, ONE optimization, re-measure same way |

Agents: if you believe a ramp is triggered, say its code and ask the human to run the prompt.
