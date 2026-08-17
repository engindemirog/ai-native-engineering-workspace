# Prompt: Plan

```
Role: Developer (docs/roles/developer.md). Read specs/active/<NNNN>-<name>.md and docs/
(architecture, conventions, testing, security). Produce specs/plans/<NNNN>-plan.md from
specs/plans/TEMPLATE.md:

- Files to change/add, path by path (this is the blast radius — be honest).
- Ordered, commit-sized steps.
- Risks and points you are NOT sure about — each with your recommendation and rationale.
- Criterion ↔ test map: every acceptance criterion and the test that will prove it.

WRITE NO CODE. Present the plan and stop for my approval. If the spec has a gap or conflicts
with docs/, say so now (recovery R-10) — not during build.
```
