# specs/plans/

One plan per spec (`NNNN-plan.md`, from `TEMPLATE.md`). A plan is a proposal until a human
approval is recorded in its `Approved by / on` line. Build never starts from an unapproved plan
(`workflows/segments.md`, BUILD entry check; `scripts/doctor` warns, CI fails).

Plans stay here after ship — only the spec moves to `specs/done/`. Recovery R-09 state files
(`NNNN-handoff.md`) also live here; they are not plans and `scripts/doctor` ignores them.
