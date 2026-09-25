---
description: "Segment: verify acceptance criteria against concrete evidence (QA role). Stops with the table."
argument-hint: spec number
---
Entry check (soft): confirm triage is complete for spec $ARGUMENTS — every review finding was
marked real (and fixed), noise (with a written rationale), or investigate. If no review or triage
record exists, say so and ask whether to proceed anyway.

Read AGENTS.md, docs/roles/qa.md, and prompts/verify.md. Assume the QA role for spec $ARGUMENTS
and produce the criterion ↔ evidence table. Run tests to capture real output; a claim without
evidence is a gap, and gaps are findings. Do not write or modify any production code.

STOP RULE: this segment ends with the criterion ↔ evidence table. Finish with
"Next: SHIP — human: Definition of Done, PR, merge, move the spec to specs/done/ (Status: Shipped)".
Do not ship, merge, or move files.
