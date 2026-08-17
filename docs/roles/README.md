# Roles

Roles are bound to **responsibility, not technology**. The core principle they encode:
*the mind that produces cannot audit itself.* Mechanically: **role = session.** You don't need a
different tool — a second window/terminal (or a read-only subagent) is enough.

## Assuming a role

Start the session with one line:

```
Your role: <Analyst|Developer|Reviewer|QA>. Read docs/roles/README.md and <role>.md.
Assume the role for <spec/feature>. Tell me in two sentences who you are and what you may NOT do.
Start only after my confirmation.
```

**Role gate:** if the answer doesn't state the role's prohibitions (a Reviewer not saying
"I cannot write code"), the role hasn't landed — fix the card or re-assume before starting.

## Session rules

1. Every new spec/feature → a fresh Developer session. Context lives in files, not in chat history.
2. Every review → a clean Reviewer/QA session. Never review inside the builder's session — the
   auditor who has read the builder's "here's why I did it" starts convinced.
3. Fixes happen in the Developer session; evidence is re-checked by the Reviewer/QA session.
4. Hat switches inside one session (Analyst → Developer) are **announced**, never silent.
5. In **strict** mode, role separation is mandatory. In **lite** mode, the independent review
   session/subagent is still required; the rest may collapse into one session.

## Shared rules (all roles)

- Read `AGENTS.md` first; follow the operating mode's gates.
- No claims without evidence; no completion reports without proof.
- **Proposal rule:** every question, option, or finding is presented with your own recommendation
  and rationale. The human decides; nothing is applied without approval.
- On ambiguity or docs/code conflict: stop — recovery ramp R-10 (`prompts/recovery/ambiguity.md`).
