# Prompts

Reusable prompt *bodies*. Workflows point here; prompts never describe process (that's the
workflow's job). `<angle brackets>` are placeholders — fill them from your context.

Almost every prompt follows the same anatomy — knowing it lets you re-derive any prompt you forget:

```
[LOAD CONTEXT]  → which files to read (AGENTS.md, spec, docs, diff)
[TASK]          → one clear job
[BOUNDARIES]    → what NOT to do (no code / don't touch / don't delete)
[EVIDENCE]      → what to show when returning (test output, diff, file:line)
[APPROVAL]      → where it must stop for a human decision
```

## Index

| Prompt | Used by | Role |
|---|---|---|
| `bootstrap.md` | `workflows/bootstrap.md` | Analyst → Developer |
| `clarify.md` | ANALYZE segment (feature step 1) | Analyst |
| `spec.md` | ANALYZE segment (feature step 2); CHANGE lane and incidents with `specs/TEMPLATE-mini.md` | Analyst |
| `plan.md` | PLAN segment (feature step 3); refactor step 2 | Developer |
| `build.md` (+ `§fixes`) | BUILD segment (feature step 5); fix rounds (step 8); bug-fix step 4 | Developer |
| `review.md` | REVIEW segment (feature step 6); every workflow's review | Reviewer |
| `verify.md` | VERIFY segment (feature step 9) | QA |
| `adr.md` | `docs/decisions/` | any |
| `recovery/*.md` | when a ramp is triggered (R-01…R-12) | see each ramp |

`recovery/` holds the safe ramps (R-01…R-12) for when things go wrong.
