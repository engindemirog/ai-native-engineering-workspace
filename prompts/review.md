# Prompt: Independent Review

```
Role: Reviewer (docs/roles/reviewer.md) — fresh session or read-only subagent. You may read files
and run ./scripts/check; you may NOT write or modify anything. A CHECK GREEN (full, …) already
shown for this exact commit (the plan's ## Build evidence, or a CI run whose SHA equals HEAD) is
cited, not re-run (docs/testing.md, Two speeds, rule 6); so is a RESIDUE line there for HEAD. Review may start while CI's full run for the pushed
commit is still going — say so in the report; triage waits for that run.
Start the report with: Review round <n> · fix rounds so far: <k> — k is the highest fix-<k> in
the branch's commit messages (0 if none). Real findings after fix round 3 → say first:
"R-06: a fourth fix round needs the root-cause analysis first".

Review this change set against specs/active/<NNNN>-<name>.md and its approved plan
specs/plans/<NNNN>-plan.md:
<diff or branch reference>

For each dimension give concrete findings WITH EVIDENCE (file:line, commands to reproduce — never
saved artifacts), or explicitly say "clean":
- Correctness: are the acceptance criteria actually met? UI: every state listed in the spec's
  User experience is implemented; accessibility expectations met.
- Plan conformance: do the changed files match the plan's file list and its approved
  Amendments (A-n)? Each file outside them is a finding (plan drift, R-07).
- Security: authz, input validation, data leaks, secrets (docs/security.md).
- Edge cases: empty/extreme/boundary values, concurrency.
- Performance: obvious waste — N+1 patterns, needless materialization (measure before claiming;
  R-12).
- Tests: criterion↔test map complete? Do tests assert BEHAVIOR or just status codes?
- Maintainability: naming, layer violations (docs/architecture.md), dead code.

Order findings by severity: Critical / High / Medium / Low (a real flaw that affects no
criterion, security or data) / Info (a note or style). Each finding carries a recommended
action (proposal rule). A stack trap the builder could have known up front also recommends a
"Known traps" line for docs/conventions.md (approved at triage as Amendment A-n).
One-pass review (lite only, when the chainer asks — workflows/segments.md): first check from
files that the work is outside a sensitive area (docs/domain.md) and that no criterion needs the
code broken on purpose (prompts/verify.md); if either fails, say so and review only. Only on a
"clean" verdict, announce the switch to QA and add the prompts/verify.md criterion ↔ evidence
table to this report (UI screenshots: capture them as prompts/verify.md says, for the SHIP
gallery). Any finding: stop at the review.
Do not invent findings to appear useful — "clean" is a valid verdict. I will triage:
real / noise / defer / investigate.
Write in the docs language (AGENTS.md, Language); field labels stay English.
```
