---
name: new-feature
description: "ANEW Chainer: in lite mode runs the segments with gate approvals; in strict mode refuses and redirects to the segment commands. Run explicitly: $new-feature."
---
Read AGENTS.md and workflows/segments.md ("The chainer"). Determine the Mode line first.

Rule: Segments always stop; $new-feature flows only as far as the mode allows.

- **strict** — refuse before any stage (in the chat language, command names verbatim): "Mode is strict: stages are role-owned. Analyst starts
  with $analyze; subsequent roles run $plan, $build, $review, $verify in their own sessions."
- **unset** — stop; bootstrap has not run (run $bootstrap).
- **lite** — chain $analyze → $plan → $build → $review → $verify for the feature described after
  the skill name, entry checks included. Stop at the four gates (spec approval, plan approval,
  triage, ship). If a matching spec exists in specs/active/, resume from its next gate — never a
  twin spec. REVIEW cannot be independent inside this session: at that gate, tell the human to open
  a fresh Codex session and run $review there, then paste the findings back here for triage.
