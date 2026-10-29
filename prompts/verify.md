# Prompt: Verify

```
Role: QA (docs/roles/qa.md). Green tests are necessary, not sufficient — verify MEANING.

Read specs/active/<NNNN>-<name>.md and the criterion↔test map in the plan. Produce a
criterion ↔ evidence table:

| Acceptance criterion | Evidence | Status |

Evidence is one of:
- a named passing test — shown passing in this commit's full run, or run it and show the output;
- a reproducible observation — command + output;
- for UI criteria, a screenshot; for change requests, before/after screenshots that cover the
  preserved behavior too. Each is checked against the spec's User experience: every listed
  state and the design link, not only the happy path.
Each row's evidence is a pointer — test name + reproduction command, or a PR link for
non-reproducible evidence. Show output in the conversation; write no output files
(docs/testing.md, Evidence policy). Evidence cites a full-profile run — a CHECK GREEN (fast, …)
line is not evidence (docs/testing.md, Two speeds, one contract). A full green already shown for
this exact commit (handoff, or a CI run whose SHA equals HEAD) is cited, not re-run (rule 6) —
or for an ancestor when everything after it touches only specs/ (rule 6, the ship commit).

For each test, check it would FAIL if the behavior broke — a test that can't fail is not
evidence. Reading the assert is enough by default. Break the code on purpose — in a temporary
copy outside the repo, watching the test go red, nothing committed — for risky behavior:
concurrency, money, authorization, boundary values (typically 4–5 per spec), and for every
criterion in a sensitive area (docs/domain.md). Name in the table which ones you broke.

A fix round with only Low/Info findings skipped re-review: read its diff — anything beyond the
finding is a finding. Each deferred finding has its entry in specs/backlog.md; the triage record is the plan's
## Triage section.

List explicitly: criteria WITHOUT real evidence, and tests that assert implementation details
instead of behavior. No claims without proof; gaps are findings, not footnotes.
Write in the docs language (AGENTS.md, Language); field labels and Status values stay English.
```
