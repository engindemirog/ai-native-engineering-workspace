---
description: "Segment PLAN: plan from an Approved spec → approval recorded in the plan. Always stops."
argument-hint: spec number (NNNN)
---
Read AGENTS.md, docs/roles/developer.md, and workflows/segments.md. Run the PLAN segment for
spec $ARGUMENTS.

Entry check first: refuse with the segment's exact message unless specs/active/$ARGUMENTS-*.md
says "Status: Approved". Then prompts/plan.md, the plan approval gate, record
"Approved by / on: <name>, <date>" in specs/plans/$ARGUMENTS-plan.md, write the handoff, STOP.
Write no code; never start the build.
