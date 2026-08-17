# R-03 — Flaky Test

```
This test is nondeterministic: <test name>. Find the source of nondeterminism (time, ordering,
shared state, async races, external I/O) and make the test deterministic.
PROTECTION: skip, retry-loops, or timing band-aids (arbitrary sleeps) are forbidden.
EVIDENCE: run it 5 times consecutively, all green — show the runs. (QA verifies this evidence.)
```
