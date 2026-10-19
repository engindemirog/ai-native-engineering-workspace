---
name: verify
description: "ANEW Segment VERIFY: acceptance criteria against concrete evidence (QA). Always stops with the table. Run explicitly: $verify."
---
Read AGENTS.md, docs/roles/qa.md, and workflows/segments.md. Run the **VERIFY** segment for spec <NNNN> (the text after $verify).

Follow the segment contract exactly: entry check from files, the referenced prompt as written,
stop at the gate, write the handoff line, then STOP. Never start the next segment.
Run in a fresh Codex session. Do not write or modify production code. Do not ship, merge, or move files.
