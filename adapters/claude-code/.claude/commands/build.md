---
description: "Segment: BUILD from the approved plan → scripts/check green. Stops with evidence."
argument-hint: spec number (NNNN)
---
Read AGENTS.md and docs/roles/developer.md. Assume the Developer role for spec $ARGUMENTS.

Entry check — REFUSE unless the plan approval is recorded: open specs/plans/$ARGUMENTS-plan.md
and require an "Approved by / on:" line filled with a name and date (empty, "—", or only a
comment means not approved). If it is missing, stop immediately with: "Plan not approved — run
/plan <NNNN> and get the approval recorded first" and do nothing else.

Before the first change, set the spec's status in specs/active/$ARGUMENTS-*.md to
"Status: In progress". If it already says "In progress", this is a resumed build: read the plan's
steps and the git log, report which steps are done, and continue from the next one.

Run step 5 of workflows/feature-development.md using prompts/build.md: branch per docs/git.md,
steps in plan order, tests from the criterion↔test map. Leaving the plan → stop, recovery R-07.

STOP RULE: this segment ends with evidence, not claims. Run ./scripts/check and show its real
output; list the changed files against the plan's file list. Finish with a HANDOFF summary and
"Next: INDEPENDENT REVIEW — fresh session/reviewer subagent, /review <NNNN>". Never review your
own build.
