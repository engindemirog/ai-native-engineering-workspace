# R-04 — Fix Caused a Regression

```
The last change broke something that worked: <what broke>.
1) REVERT the change first — return to green. Confirm with ./scripts/check.
2) Then diagnose why the fix regressed (R-01 discipline) and propose a NARROWER fix.
3) Add a permanent regression test that would have caught this — it stays forever.
PROTECTION: no "fixing forward" while the suite is red; green first, then careful.
```
