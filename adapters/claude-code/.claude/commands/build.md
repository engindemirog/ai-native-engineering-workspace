---
description: "Segment BUILD: implement the approved plan → scripts/check green. Always stops with evidence."
argument-hint: spec number (NNNN)
---
Read AGENTS.md, docs/roles/developer.md, and workflows/segments.md. Run the BUILD segment for
spec $ARGUMENTS.

Entry check first: refuse with the segment's exact message unless specs/plans/$ARGUMENTS-plan.md
has a filled "Approved by / on" line. Set the spec to "Status: In progress" (or resume if it
already is), then prompts/build.md. End with real ./scripts/check output and the changed-file
list against the plan, write the handoff, STOP. Never review your own build.
