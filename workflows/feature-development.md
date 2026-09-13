# Workflow: Feature Development

**Goal:** new behavior, from intent to shipped, with evidence at every gate.

```
INTENT → CLARIFY → SPEC → PLAN → [APPROVAL] → BUILD → REVIEW → [TRIAGE] → VERIFY → SHIP
```

| # | Step | Role | Prompt | Gate / evidence |
|---|---|---|---|---|
| 1 | **INTENT & CLARIFY** *(strict; lite: fold into spec)* | Analyst | `prompts/clarify.md` | Intent in business language + every clarifying question answered by a human. **[GATE: human — strict]** |
| 2 | **SPEC** — create `specs/active/NNNN-<name>.md` | Analyst | `prompts/spec.md` | Atomic, testable criteria; no tech in Requirements. **[GATE: human — strict]** Self-critique pass included. |
| 3 | **PLAN** — create `specs/plans/NNNN-plan.md` | Developer | `prompts/plan.md` | Files + steps + risks (with recommendations) + criterion↔test map. **No code.** |
| 4 | **APPROVAL** | Human | — | **[GATE: human]** Plan touches every criterion? Blast radius sane? Risks honest? Approval recorded in the plan file. |
| 5 | **BUILD** | Developer | `prompts/build.md` | Branch per `docs/git.md`; steps match plan; `scripts/check` green. Deviation → R-07, recorded in the plan. |
| 6 | **INDEPENDENT REVIEW** — fresh session / read-only subagent | Reviewer | `prompts/review.md` | Findings with evidence (file:line) across all six dimensions, or "clean". |
| 7 | **TRIAGE** | Human | — | **[GATE: human]** Each finding: real (fix) / noise (reject, write why) / investigate (→ QA, R-05). |
| 8 | **FIX ROUNDS** | Developer | `prompts/build.md` §fixes | Only real findings. Re-review the fix diff (step 6, narrow scope). Rounds > 3 → R-06. |
| 9 | **VERIFY** | QA | `prompts/verify.md` | Criterion ↔ evidence table complete. UI criteria: screenshot = evidence. |
| 10 | **SHIP** | Human | — | **[GATE: human]** DoD checklist in spec all green → PR (template) → merge → move spec to `specs/done/` → fill scorecard. |
