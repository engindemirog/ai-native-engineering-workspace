---
description: "Segment: PLAN → human approval recorded in the plan file. Stops after approval."
argument-hint: spec number (NNNN)
---
Read AGENTS.md and docs/roles/developer.md. Assume the Developer role for spec $ARGUMENTS.

Entry check — REFUSE unless the spec is approved: open specs/active/$ARGUMENTS-*.md and require
the exact line "Status: Approved" (or "In progress" if a plan is being revised mid-work). If it is
missing, stop immediately with: "Spec not approved — run /analyze or get approval first" and do
nothing else. If specs/plans/$ARGUMENTS-plan.md already exists, show it and ask whether to revise
it instead of writing a new one.

Run steps 3–4 of workflows/feature-development.md using prompts/plan.md, writing
specs/plans/$ARGUMENTS-plan.md from specs/plans/TEMPLATE.md. Write no code.

[GATE: human] Present the plan and wait for explicit approval; never start building. On
approval, record it in the plan file: set "Status: Approved" and fill
"Approved by / on: <name>, <YYYY-MM-DD>" (ask for the name; propose `git config user.name` as
the default). Then stop.

STOP RULE: this segment ends when the approval is recorded. Finish with a HANDOFF summary: plan
path, the recorded approval line, and "Next: BUILD — /build <NNNN>". Do not start the build.
