# /change — change request (triage, then the lane the behavior demands)

Read AGENTS.md, workflows/change-request.md, and workflows/segments.md. Handle the change request
described after the command (include the work item key).

Run the triage rubric in order and present the verdict with your rationale; wait for
confirmation. BUG → point to workflows/bug-fix.md and stop. TRIVIAL → follow the policy in
docs/git.md ("Trivial changes"): one narrow commit, check green. CHANGE → check for an open spec
with the same "Source:" key (never a twin), then by Mode: strict → ANALYZE segment only with
specs/TEMPLATE-mini.md, spec approval, handoff, STOP; lite → chain /analyze (mini) → /plan →
/build → /review (fresh chat) → /verify (before/after screenshots for UI) → ship, asking at every
gate. Entry checks stay: the plan gate is never skipped.
