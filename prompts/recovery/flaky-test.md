# R-03 — Flaky Test

```
First: infrastructure or test? A job that failed outside the tests (package mirror timeout,
lost runner, download error — the cause is in its log) is infrastructure: rerun only the failed
jobs and write the cause in the PR thread; that is not this ramp. A test that failed and then
passed on the same commit is flaky — a rerun is never the fix and never evidence. Then:

This test is nondeterministic: <test name>. Find the source of nondeterminism (time, ordering,
shared state, async races, external I/O) and make the test deterministic.
PROTECTION: skip, retry-loops, or timing band-aids (arbitrary sleeps) are forbidden.
EVIDENCE: run the test itself 5 times consecutively, all green — show the runs. (QA verifies this
evidence.) EXIT: then ./scripts/check (full) green once, output shown.
```
