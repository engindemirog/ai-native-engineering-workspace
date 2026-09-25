---
description: "Segment: INTENT → CLARIFY → SPEC → spec approval. Stops when the spec is Approved."
argument-hint: short feature description
---
Read AGENTS.md (note the operating mode) and docs/roles/analyst.md. Assume the Analyst role for:
$ARGUMENTS

Entry check — no twin specs: scan specs/active/ for a spec whose name or intent matches this
request. If one exists, show it and ask whether to resume it; never open a second spec for the
same work. Otherwise the number is the next NNNN after the highest in specs/active/, specs/done/,
and specs/plans/.

Run steps 1–2 of workflows/feature-development.md using prompts/clarify.md, then prompts/spec.md
(including its self-critique pass). In lite mode, fold intent and clarify into the spec draft
with fewer questions; the spec approval gate below still applies, because "Status: Approved" is
the entry condition of /plan.

[GATE: human] Present the spec and wait for explicit approval. On approval, set the spec's
"Status: Approved" and stop.

STOP RULE: this segment ends when the spec is Approved. Finish with a HANDOFF summary: spec
number and path, "no open questions remain", and the line
"Next: PLAN — Developer role runs /plan <NNNN>". Do not produce a plan, a plan suggestion, or
code. The next role starts a new session and reads the files.
