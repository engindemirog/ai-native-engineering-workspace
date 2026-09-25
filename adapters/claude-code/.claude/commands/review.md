---
description: "Segment REVIEW: independent, read-only review against the spec. Always stops with the report."
argument-hint: spec number or branch/diff reference
---
Read workflows/segments.md and run the REVIEW segment for $ARGUMENTS. Soft entry check: build
evidence (branch/diff + spec "In progress") exists — if not, say so and ask.

Delegate to the `reviewer` subagent with the diff and the spec path in specs/active/, using
prompts/review.md. You (the main session) must not review it yourself — the producer never
verifies its own work. Return the subagent's findings verbatim for my triage, with no softening
or commentary, write the handoff, STOP. Do not fix, triage, or re-review.
