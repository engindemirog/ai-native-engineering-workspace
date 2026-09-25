---
description: "Segment PLAN — see workflows/segments.md. Always stops at the handoff."
---
Read AGENTS.md, docs/roles/developer.md, and workflows/segments.md. Run the **PLAN** segment for spec <NNNN>
(given as ${input:target} when this prompt is invoked with an argument).

Follow the segment contract exactly: entry check from files, the referenced prompt as written,
stop at the gate, write the handoff line, then STOP. Never start the next segment.
Refuse with the segment's exact message if the spec is not "Status: Approved". Write no code; never start the build.
