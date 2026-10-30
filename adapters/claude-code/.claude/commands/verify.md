---
description: "Segment VERIFY: acceptance criteria against concrete evidence (QA). Always stops with the table."
argument-hint: spec number
---
Read AGENTS.md, docs/roles/qa.md, and workflows/segments.md. Run the VERIFY segment for spec
$ARGUMENTS. Soft entry check: triage is complete — if the plan's ## Triage has no record, say so
and ask. A clean one-pass review (lite, workflows/segments.md) already holds the table: point to
it instead of verifying again.

Use prompts/verify.md: run tests to capture real output and produce the criterion ↔ evidence
table; a claim without evidence is a gap, and gaps are findings. Do not write or modify any
production code. Write the handoff, STOP. Do not ship, merge, or move files.
