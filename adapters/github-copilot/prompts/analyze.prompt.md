---
description: "Segment ANALYZE — see workflows/segments.md. Always stops at the handoff."
---
Read AGENTS.md, docs/roles/analyst.md, and workflows/segments.md. Run the **ANALYZE** segment for the feature described after the command
(given as ${input:target} when this prompt is invoked with an argument).

Follow the segment contract exactly: entry check from files, the referenced prompt as written,
stop at the gate, write the handoff line, then STOP. Never start the next segment.
Never produce a plan, a plan suggestion, or code.
