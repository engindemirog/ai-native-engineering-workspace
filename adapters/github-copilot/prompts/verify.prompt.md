---
description: "Segment VERIFY — see workflows/segments.md. Always stops at the handoff."
---
Read AGENTS.md, docs/roles/qa.md, and workflows/segments.md. Run the **VERIFY** segment for spec <NNNN>
(given as ${input:target} when this prompt is invoked with an argument).

Follow the segment contract exactly: entry check from files, the referenced prompt as written,
stop at the gate, write the handoff line, then STOP. Never start the next segment.
Run in a fresh chat. Do not write or modify production code. Do not ship, merge, or move files.
