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

`recovery/` holds the safe ramps (R-01…R-12) for when things go wrong.
