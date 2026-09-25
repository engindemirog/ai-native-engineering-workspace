# Workflow: Change Request

**Goal:** change a behavior that already exists in the product — not a new feature, not a bug —
with exactly as much ceremony as the *behavior* demands, never as little as the request *looks*.

```
TRIAGE → [BUG → bug-fix.md] | [TRIVIAL lane] | [CHANGE lane: mini-spec → plan → build → review → verify → ship]
```

## Triage rubric — run it in this order, every time

The lane is decided by the **behavior test** and the **blast radius**, never by how small the
request sounds. Present the verdict with its rationale (proposal rule); the human confirms.

| # | Question | If yes | If no |
|---|---|---|---|
| (a) | **Is the current behavior a deviation from what was agreed** (spec, ADR, domain rule)? | It is a **BUG** → `bug-fix.md`. Stop here. | Continue. |
| (b) | **Behavior test:** does this change alter any acceptance criterion, or require a new one? | **CHANGE lane** (mini-spec). | **TRIVIAL lane**. |
| (c) | **Blast radius:** does it touch shared code (a component, helper, model, or contract used in more than one place)? | **CHANGE lane**, even if (b) said trivial. | Lane stands. |

Label text, a typo, a color token used in one place: trivial. "Same label, but now it depends on
the user's plan": a criterion changed → CHANGE. "The button never did what the spec says": BUG.

## TRIVIAL lane

- **No spec.** One narrow commit, touching only the thing named in the request.
- Follow the project's **trivial-change policy** in `docs/git.md` ("Trivial changes"), set at
  bootstrap. Default: *no spec, but still a PR and one reviewer* — a cheap safety net.
- `scripts/check` green. If the change turns out to need a second file or a new test, that is a
  signal you mis-triaged: stop and re-run the rubric.

## CHANGE lane — the compressed loop

Same segments as `feature-development.md` (see `segments.md`), same gates, smaller artifacts.

| Step | Role | Prompt / template | Gate / evidence |
|---|---|---|---|
| **MINI-SPEC** — `specs/active/NNNN-<name>.md` from `specs/TEMPLATE-mini.md` | Analyst | `prompts/spec.md` (mini template) | `Source:` work item is mandatory. **Changed behavior** criteria and **Preserved behavior** (regression) criteria are written together; out of scope listed. If the old behavior has a spec in `specs/done/`, add `Supersedes: <NNNN>/AC-x` — the shipped spec is never edited. **[GATE: human]** spec approval → `Status: Approved`. |
| **PLAN** — `specs/plans/NNNN-plan.md` | Developer | `prompts/plan.md` | Short: files + steps + criterion↔test map covering *both* changed and preserved criteria. **[GATE: human]** plan approval — **never skipped in this lane**; `Approved by / on` must be filled before build. |
| **BUILD** | Developer | `prompts/build.md` | Spec → `In progress`; `scripts/check` green; changed files match the plan. |
| **REVIEW** — narrow: the change diff | Reviewer (fresh session / read-only subagent) | `prompts/review.md` | Findings or "clean". |
| **TRIAGE** | Human | — | **[GATE: human]** real / noise / investigate. |
| **VERIFY** | QA | `prompts/verify.md` | Criterion ↔ evidence table for changed **and** preserved criteria. **UI change: before/after screenshots are the evidence.** |
| **SHIP** | Human | — | **[GATE: human]** DoD → PR → merge → mini-spec moves to `specs/done/`, `Status: Shipped`. |

The status machine is the one in `specs/TEMPLATE.md`: Draft → Approved → In progress → Shipped.
`scripts/doctor` applies the same spec/plan consistency checks to mini-specs.

## Brownfield note

If the page or module being changed has **no spec at all** (adopted codebase), the *Preserved
behavior* criteria act as a **mini characterization**: they pin down what the surrounding code
does today, so the change can be proven not to disturb it. Write them from observation (run it,
screenshot it), not from assumption.
