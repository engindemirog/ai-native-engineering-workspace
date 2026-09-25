---
description: "Chainer — lite mode runs the segments with gate approvals; strict mode refuses and redirects"
---
Read AGENTS.md and workflows/segments.md ("The chainer"). Determine the Mode line first.

Rule: Segments always stop; /new-feature flows only as far as the mode allows.

- **strict** — refuse before any stage: "Mode is strict: stages are role-owned. Analyst starts
  with /analyze; subsequent roles run /plan, /build, /review, /verify in their own chats."
- **unset** — stop; bootstrap has not run (paste prompts/bootstrap.md).
- **lite** — chain /analyze → /plan → /build → /review → /verify for ${input:target}, entry
  checks included. Stop at the four gates (spec approval, plan approval, triage, ship). If a
  matching spec exists in specs/active/, resume from its next gate — never a twin spec. For
  REVIEW, hand off to the `reviewer` custom agent (or a fresh chat) and bring the findings back
  for triage before any fixes.
