---
description: "Change request: triage (bug / trivial / change), then the lane the behavior demands. Segments still stop."
argument-hint: what should change, and the work item key
---
Read AGENTS.md, workflows/change-request.md, and workflows/segments.md. Handle this change
request: $ARGUMENTS

1. **TRIAGE.** Apply the three-question rubric in change-request.md, in its order, as written.
   Present the verdict (BUG / TRIVIAL / CHANGE) WITH your rationale (proposal rule) and wait for
   my confirmation. Read the trivial-change policy from docs/git.md ("Trivial changes") first.
2. **BUG** → say so, point me to /fix-bug with the report, and STOP.
3. **TRIVIAL** → restate the policy from docs/git.md, then run the trivial lane: one narrow
   commit, ./scripts/check green, PR/reviewer as the policy says. If it needs a second file or a
   new test, stop and re-triage.
4. **CHANGE** → twin check first: if a spec in specs/active/ carries the same "Source:" key,
   show it and ask whether to resume it — never open a second one. Then read the Mode:
   - **strict** → run only the ANALYZE segment with specs/TEMPLATE-mini.md (Source mandatory,
     changed + preserved criteria, Supersedes if a shipped spec exists), wait for spec approval,
     set "Status: Approved", write the handoff "Next: PLAN — Developer runs /plan <NNNN>", STOP.
   - **lite** → chain ANALYZE (mini) → /plan → /build → /review (narrow) → /verify (before/after
     screenshots for UI) → ship, asking at every gate. Entry checks stay: /plan needs the
     Approved spec, /build needs the filled "Approved by / on" line — the plan gate is never
     skipped in this lane.
