---
description: "Segment: independent review of the change set against its spec. Stops with the report."
argument-hint: spec number or branch/diff reference
---
Entry check (soft): confirm build evidence exists for $ARGUMENTS — a branch/diff with commits and
a spec in specs/active/ whose status is "In progress". If either is missing, say what is missing
and ask whether to proceed anyway; do not silently review nothing.

Delegate to the `reviewer` subagent: review the change set for $ARGUMENTS against its spec in
specs/active/, using prompts/review.md. You (the main session) must not review it yourself — the
producer never verifies its own work. Return the subagent's findings verbatim for my triage
(real / noise / investigate), with no softening or commentary.

STOP RULE: this segment ends with the report. Finish with "Next: TRIAGE — human decides
real / noise / investigate; then the Developer runs fix rounds and /verify <NNNN> follows".
Do not fix, triage, or re-review anything.
