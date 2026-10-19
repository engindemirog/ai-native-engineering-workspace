---
name: review
description: "ANEW Segment REVIEW: independent, read-only review against the spec. Always stops with the report. Run explicitly: $review."
---
Read AGENTS.md, docs/roles/reviewer.md, and workflows/segments.md. Run the **REVIEW** segment for spec <NNNN> (the text after $review) / the current branch diff.

Follow the segment contract exactly: entry check from files, the referenced prompt as written,
stop at the gate, write the handoff line, then STOP. Never start the next segment.
INDEPENDENCE: this skill must run in a FRESH Codex session that has never seen the builder's conversation. Read only the diff, the spec, the plan, and docs/. Do not modify any file.
