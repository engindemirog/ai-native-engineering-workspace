# Workflow: Feature Development

**Goal:** new behavior, from intent to shipped, with evidence at every gate.
*Changing a behavior that already exists? That is `change-request.md` (triage → trivial or mini-spec lane).*

```
INTENT → CLARIFY → SPEC → PLAN → [APPROVAL] → BUILD → REVIEW → [TRIAGE] → VERIFY → SHIP
```

The steps below group into five **segments** (`segments.md`), each with an entry check and a
handoff that always stops: ANALYZE (1–2) · PLAN (3–4) · BUILD (5) · REVIEW (6) · VERIFY (9).
Steps 7 and 10 are human decisions; step 8 is the Developer applying triage. Adapters expose the
segments as commands (`/analyze` …); `/new-feature` chains them in lite mode only. Handoffs travel
through files (spec `Status`, plan `Approved by / on`), never chat.

| # | Step | Role | Prompt | Gate / evidence | Segment · handoff |
|---|---|---|---|---|---|
| 1 | **INTENT & CLARIFY** *(strict, and a sensitive area — `docs/domain.md` — in every mode; lite otherwise: fold into spec)* | Analyst | `prompts/clarify.md` | Intent in business language + every clarifying question answered by a human. **[GATE: human — strict]** | ANALYZE · continues to step 2 in the same session |
| 2 | **SPEC** — create `specs/active/NNNN-<name>.md` | Analyst | `prompts/spec.md` | Atomic, testable criteria; no tech in Requirements. **[GATE: light]** (lite: a yes/no; strict: full approval) → `Status: Approved`, PLAN's entry condition. Self-critique pass included. | ANALYZE · STOP: spec `Status: Approved` → "Next: PLAN" |
| 3 | **PLAN** — create `specs/plans/NNNN-plan.md` | Developer | `prompts/plan.md` | Files + steps + risks (with recommendations) + criterion↔test map. **No code.** | PLAN · refuses unless spec is Approved |
| 4 | **APPROVAL** | Human | — | **[GATE: human]** Plan touches every criterion? Blast radius sane? Risks honest? Approval recorded in the plan file. | PLAN · STOP: `Approved by / on` filled → "Next: BUILD" |
| 5 | **BUILD** | Developer | `prompts/build.md` | Branch per `docs/git.md`; steps match plan; `scripts/check` green. Deviation → R-07. | BUILD · refuses unless plan approval recorded; sets `In progress`; STOP with check output → "Next: REVIEW" |
| 6 | **INDEPENDENT REVIEW** — fresh session / read-only subagent | Reviewer | `prompts/review.md` | Findings with evidence (file:line) across all six dimensions, or "clean". | REVIEW · STOP with report → "Next: TRIAGE". Lite, clean verdict: may carry VERIFY in the same session (one-pass review, `segments.md`) |
| 7 | **TRIAGE** | Human | — | **[GATE: human]** Each finding: real (fix) / noise (reject, write why) / defer (real, fixed later: an entry in `specs/backlog.md`) / investigate (→ QA, R-05). A decision that changes the plan is written into it as Amendment A-n. A real finding a build-time rule would have caught adds a line to `docs/conventions.md` "Known traps": recorded at triage as Amendment A-n, written by the Developer in the fix round. | human · triage recorded in the plan's `## Triage` section (one table per round; the PR links it) |
| 8 | **FIX ROUNDS** | Developer | `prompts/build.md` §fixes | Only real findings. A round with a Medium or higher finding → re-review the fix diff (step 6, narrow scope); a Low/Info-only round goes on to VERIFY, which reads its diff — except in a sensitive area (`docs/domain.md`), where every round is re-reviewed. Rounds > 3 → R-06 (commits carry `[plan NNNN/fix-k]`; the review report shows the count). | Developer applies triage; REVIEW again on the fix diff (Medium or higher), else on to VERIFY |
| 9 | **VERIFY** | QA | `prompts/verify.md` | Criterion ↔ evidence table complete. UI criteria: screenshot = evidence. | VERIFY · STOP with evidence table → "Next: SHIP" |
| 10 | **SHIP** | Human | — | **[GATE: human]** DoD checklist in spec all green → PR (template) → merge → move spec to `specs/done/` → fill scorecard. A criterion that cannot be proven is never waived: the human moves it out (R-08) — its line stays, struck through, `→ moved to B-<n> \| spec <NNNN> — <name>, <date>, <why>`; a sensitive-area criterion cannot move. doctor checks every new ship. | human · spec moved to `specs/done/`, `Status: Shipped` |
