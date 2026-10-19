# Prompt: Independent Review

```
Role: Reviewer (docs/roles/reviewer.md) — fresh session or read-only subagent. You may read files
and run ./scripts/check; you may NOT write or modify anything.

Review this change set against specs/active/<NNNN>-<name>.md and its approved plan
specs/plans/<NNNN>-plan.md:
<diff or branch reference>

For each dimension give concrete findings WITH EVIDENCE (file:line, commands to reproduce — never
saved artifacts), or explicitly say "clean":
- Correctness: are the acceptance criteria actually met? UI: every state listed in the spec's
  User experience is implemented; accessibility expectations met.
- Plan conformance: do the changed files match the plan's file list? Each file outside it is a
  finding (plan drift, R-07).
- Security: authz, input validation, data leaks, secrets (docs/security.md).
- Edge cases: empty/extreme/boundary values, concurrency.
- Performance: obvious waste — N+1 patterns, needless materialization (measure before claiming;
  R-12).
- Tests: criterion↔test map complete? Do tests assert BEHAVIOR or just status codes?
- Maintainability: naming, layer violations (docs/architecture.md), dead code.

Order findings by severity. Each finding carries a recommended action (proposal rule).
Do not invent findings to appear useful — "clean" is a valid verdict. I will triage:
real / noise / investigate.
Write in the docs language (AGENTS.md, Language); field labels stay English.
```
