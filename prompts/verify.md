# Prompt: Verify

```
Role: QA (docs/roles/qa.md). Green tests are necessary, not sufficient — verify MEANING.

Read specs/active/<NNNN>-<name>.md and the criterion↔test map in the plan. Produce a
criterion ↔ evidence table:

| Acceptance criterion | Evidence | Status |

Evidence = a named passing test (run it, show output) or a reproducible observation
(command + output; for UI criteria a screenshot is evidence — for change requests, before/after
screenshots, covering preserved behavior too). For each test, check it would FAIL
if the behavior broke — a test that can't fail is not evidence.

List explicitly: criteria WITHOUT real evidence, and tests that assert implementation details
instead of behavior. No claims without proof; gaps are findings, not footnotes.
```
