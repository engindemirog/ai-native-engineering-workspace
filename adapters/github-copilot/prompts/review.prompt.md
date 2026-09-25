---
description: "Segment REVIEW — see workflows/segments.md. Always stops at the handoff."
---
Read AGENTS.md, docs/roles/reviewer.md, and workflows/segments.md. Run the **REVIEW** segment for spec <NNNN> / the current branch diff
(given as ${input:target} when this prompt is invoked with an argument).

Follow the segment contract exactly: entry check from files, the referenced prompt as written,
stop at the gate, write the handoff line, then STOP. Never start the next segment.
INDEPENDENCE: select the read-only `reviewer` custom agent (`.github/agents/reviewer.agent.md`), or run in a FRESH chat that has never seen the builder's conversation. Read only the diff, the spec, the plan, and docs/. Do not modify any file.
