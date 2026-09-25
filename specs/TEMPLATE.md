# Spec NNNN — <short name>

- Status: Draft | Approved | In progress | Shipped
  <!-- State machine (who moves it): Draft → Approved (human approval, end of /analyze)
       → In progress (Developer, when /build starts) → Shipped (human, at ship, when the file
       moves to specs/done/). /plan refuses to run unless the status is Approved. -->
- Mode: lite | strict (from AGENTS.md at creation time)
- Plan: `specs/plans/NNNN-plan.md`

## Intent
<!-- 3–5 sentences, BUSINESS language: who wants this and why; what success looks like;
what is deliberately NOT being done. Decisions from clarifying questions are folded in here. -->

## Requirements
<!-- Behavior, not technical solutions. No endpoints, tables, or caches here — the plan owns "how". -->

## Constraints & out of scope
<!-- Hard limits (performance targets, compliance) and conscious V1 exclusions. -->

## Acceptance criteria
<!-- Each line independently testable. Cover the happy path, boundaries, empties, and error cases. -->
- [ ] AC-1 —
- [ ] AC-2 —
- [ ] AC-3 —

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green
- [ ] Independent review done; real findings fixed, noise rejected with written rationale
- [ ] Docs / ADRs updated if behavior or architecture changed
- [ ] Spec moved to `specs/done/` (it becomes immutable there)

## Scorecard (fill at ship — honest numbers make the process improvable)
| Metric | Value |
|---|---|
| Spec revisions | |
| Fix rounds | |
| Review findings: real / noise | |
| Regressions introduced | |
| Bugs escaped to production | |
