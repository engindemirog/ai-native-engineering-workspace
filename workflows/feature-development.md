# Workflow: Feature Development

**Goal:** new behavior, from intent to shipped, with evidence at every gate.

```
INTENT → CLARIFY → SPEC → PLAN → [APPROVAL] → BUILD → REVIEW → [TRIAGE] → VERIFY → SHIP
```

Segment commands (Claude Code adapter) own the steps below and always stop at a handoff:
`/analyze` (1–2) · `/plan` (3–4) · `/build` (5) · `/review` (6) · `/verify` (9). Steps 7 and 10
are human decisions; step 8 is the Developer applying triage. `/new-feature` chains these in lite
mode only. Handoffs travel through files (spec `Status`, plan `Approved by / on`), never chat.

| # | Step | Role | Prompt | Gate / evidence | Command · handoff |
|---|---|---|---|---|---|
| 1 | **INTENT & CLARIFY** *(strict; lite: fold into spec)* | Analyst | `prompts/clarify.md` | Intent in business language + every clarifying question answered by a human. **[GATE: human — strict]** | `/analyze` · continues to step 2 in the same session |
| 2 | **SPEC** — create `specs/active/NNNN-<name>.md` | Analyst | `prompts/spec.md` | Atomic, testable criteria; no tech in Requirements. **[GATE: human — strict]** Self-critique pass included. | `/analyze` · STOP: spec `Status: Approved` → "Next: /plan NNNN" |
| 3 | **PLAN** — create `specs/plans/NNNN-plan.md` | Developer | `prompts/plan.md` | Files + steps + risks (with recommendations) + criterion↔test map. **No code.** | `/plan` · refuses unless spec is Approved |
| 4 | **APPROVAL** | Human | — | **[GATE: human]** Plan touches every criterion? Blast radius sane? Risks honest? Approval recorded in the plan file. | `/plan` · STOP: `Approved by / on` filled → "Next: /build NNNN" |
| 5 | **BUILD** | Developer | `prompts/build.md` | Branch per `docs/git.md`; steps match plan; `scripts/check` green. Deviation → R-07. | `/build` · refuses unless plan approval recorded; sets `In progress`; STOP with check output → "Next: /review NNNN" |
| 6 | **INDEPENDENT REVIEW** — fresh session / read-only subagent | Reviewer | `prompts/review.md` | Findings with evidence (file:line) across all six dimensions, or "clean". | `/review` · STOP with report → "Next: triage" |
| 7 | **TRIAGE** | Human | — | **[GATE: human]** Each finding: real (fix) / noise (reject, write why) / investigate (→ QA, R-05). | human · triage recorded in the review/PR thread |
| 8 | **FIX ROUNDS** | Developer | `prompts/build.md` §fixes | Only real findings. Re-review the fix diff (step 6, narrow scope). Rounds > 3 → R-06. | Developer applies triage; re-run `/review` on the fix diff |
| 9 | **VERIFY** | QA | `prompts/verify.md` | Criterion ↔ evidence table complete. UI criteria: screenshot = evidence. | `/verify` · STOP with evidence table → "Next: ship" |
| 10 | **SHIP** | Human | — | **[GATE: human]** DoD checklist in spec all green → PR (template) → merge → move spec to `specs/done/` → fill scorecard. | human · spec moved to `specs/done/`, `Status: Shipped` |
