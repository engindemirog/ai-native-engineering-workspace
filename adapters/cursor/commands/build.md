# /build — segment BUILD

Read AGENTS.md, docs/roles/developer.md, and workflows/segments.md. Run the **BUILD** segment for spec <NNNN>.

Follow the segment contract exactly: entry check from files, the referenced prompt as written,
stop at the gate, write the handoff line, then STOP. Never start the next segment.
Refuse with the segment's exact message if the plan's "Approved by / on" line is empty. End with real ./scripts/check output. Never review your own build.
