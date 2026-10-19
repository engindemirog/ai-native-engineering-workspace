# R-03 — Flaky Test

```
This test is nondeterministic: <test name>. Find the source of nondeterminism (time, ordering,
shared state, async races, external I/O) and make the test deterministic.
PROTECTION: skip, retry-loops, or timing band-aids (arbitrary sleeps) are forbidden.
EVIDENCE: run the test itself 5 times consecutively, all green — show the runs. (QA verifies this
evidence.) EXIT: then ./scripts/check (full) green once, output shown.
```
