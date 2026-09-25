# Workflows

A workflow is the *process*: steps, roles, gates, and evidence. Each step points to the prompt it
uses (`prompts/…`) — workflows never copy prompt text, so there is exactly one source of truth.

| Workflow | Use when |
|---|---|
| `bootstrap.md` | First run: adapt this workspace to your project (new or existing). |
| `feature-development.md` | Any new behavior. |
| `segments.md` | The feature workflow one stage at a time: entry checks, gates, handoffs, the chainer rule. Adapters map their commands onto it. |
| `bug-fix.md` | Something works incorrectly. Reproduction comes before the fix. |
| `change-request.md` | A behavior that exists must change. The most common enterprise work item. Triage rubric: deviation from the agreed behavior → bug; a criterion changes or appears (or shared code is touched) → mini-spec lane; otherwise trivial. |
| `refactor.md` | Structure changes, behavior doesn't. |
| `incident.md` | Production is on fire. Stabilize first, learn after. |

## Legend

- **[GATE: human]** — a human decision. Never automated, in any mode.
- **[GATE: human — strict]** — required in strict mode; in lite mode the agent states its
  assumption and proceeds unless you object.
- **Role:** who executes the step (see `docs/roles/`). In strict mode, role = separate session.
- **Evidence:** what must exist before the step counts as done.

## Modes

Set at bootstrap, recorded in `AGENTS.md`:

- **lite** — Spec → Plan → **[GATE: human]** → Build → Independent Review → Verify.
  For solo developers and low-risk work. Independent review is still non-negotiable — it's cheap
  (a subagent or second window) and catches what the producer can't.
- **strict** — Intent → Clarify → Spec → **[GATE]** → Plan → **[GATE]** → Build → Independent
  Review → **[GATE: triage]** → Verify → **[GATE: ship]**. For teams and critical systems.

**Segments and the chainer** (`segments.md`). Each stage is a *segment* — ANALYZE, PLAN, BUILD,
REVIEW, VERIFY — canonical, entry-checked, and always ending at a handoff. Adapters expose them
as `/analyze`, `/plan`, … `/new-feature` is a *chainer*. The rule everywhere:
**Segments always stop; /new-feature flows only as far as the mode allows.**
Lite lives with `/new-feature` (it chains the segments and asks at each gate); strict lives with
the segment commands (`/new-feature` refuses and redirects to them, one role per session).

If things go wrong at any step, don't improvise: `prompts/recovery/README.md` has the ramp.
