---
description: Run the feature-development workflow (intent → spec → plan → build → review → verify → ship)
argument-hint: short feature description
---
Read AGENTS.md (note the operating mode) and workflows/feature-development.md.
Run the workflow for: $ARGUMENTS

Honor every gate of the current mode — stop and wait at each [GATE: human]. Use the prompts the
workflow references (prompts/clarify.md, spec.md, plan.md, build.md) as written, filling
placeholders. For the REVIEW step, delegate to the `reviewer` subagent with the diff and spec
path; bring its findings back to me for triage before any fixes.
