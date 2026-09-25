---
description: "Chainer: in lite mode runs the segments with gate approvals; in strict mode refuses and redirects to the segment commands"
argument-hint: short feature description
---
Read AGENTS.md and workflows/segments.md ("The chainer"). Determine the Mode line first.

Rule: Segments always stop; /new-feature flows only as far as the mode allows.

**Mode: strict** — refuse before starting any stage. Reply exactly with:
"Mode is strict: stages are role-owned. Analyst starts with /analyze; subsequent roles run
/plan, /build, /review, /verify in their own sessions." Then stop.

**Mode: unset** — stop; bootstrap has not run (/bootstrap).

**Mode: lite** — chain /analyze → /plan → /build → /review → /verify for: $ARGUMENTS
Run each exactly as its command defines it, entry checks included — never skip one. Stop at the
four gates (spec approval, plan approval, triage, ship) and continue only on explicit approval.
If a matching spec already exists in specs/active/, report its status and the plan's approval
line and resume from the next gate — never open a twin spec. For REVIEW, delegate to the
`reviewer` subagent; bring its findings back for triage before any fixes.
