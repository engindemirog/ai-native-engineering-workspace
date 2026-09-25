---
description: "Chainer: runs the feature segments in lite mode with gate approvals; in strict mode redirects to the segment commands"
argument-hint: short feature description
---
Read AGENTS.md and workflows/feature-development.md. Determine the Mode line first.

Rule: Segments always stop; /new-feature flows only as far as the mode allows.

**Mode: strict** — refuse before starting any stage. Reply exactly with:
"Mode is strict: stages are role-owned. Analyst starts with /analyze; subsequent roles run
/plan, /build, /review, /verify in their own sessions." Then stop.

**Mode: unset** — stop; bootstrap has not run (/bootstrap).

**Mode: lite** — chain the segments in order for: $ARGUMENTS
Run /analyze → /plan → /build → /review → /verify exactly as each command defines them,
including their entry checks — never skip one. Stop at every gate and ask; continue only on
explicit approval:

1. Spec approval (end of /analyze) → sets "Status: Approved".
2. Plan approval (end of /plan) → recorded as "Approved by / on" in the plan file.
3. Triage (after /review) → real / noise / investigate for every finding; fix rounds via
   prompts/build.md §fixes, re-review the fix diff.
4. Ship (after /verify) → Definition of Done, PR, merge, move the spec to specs/done/.

Resuming: before opening a spec, look for an existing one in specs/active/ that matches the
request. If found, report its status and the plan's approval line, and ask to resume from the
next gate — never open a twin spec. For REVIEW, delegate to the `reviewer` subagent with the
diff and spec path; bring its findings back for triage before any fixes.
