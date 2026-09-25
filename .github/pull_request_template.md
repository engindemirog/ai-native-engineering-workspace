## Spec
<!-- specs/active/NNNN-<name>.md — a PR without a spec should not exist (AGENTS.md rule 1). -->
- Spec: `specs/active/NNNN-<name>.md` — Status: <!-- In progress (Shipped once merged & moved) -->
- Plan: `specs/plans/NNNN-plan.md`
- Or, for lanes without a spec file (AGENTS.md rule 1 still holds — this is the spec's equivalent):
  bug fix → report + reproduction test: <!-- report id + test name --> · trivial change → work item
  + `docs/git.md` policy: <!-- work item -->
- Produced via: <!-- lite: /new-feature chain · strict: segment sessions (/analyze … /verify) · bug-fix · trivial -->

## What & why
<!-- 2–3 sentences. -->

## Gate records (copied from files, not from memory — workflows/segments.md)
- Plan approval line, verbatim from the plan: `Approved by / on: `
- Review report: <!-- link or paste; produced by a fresh session / read-only reviewer -->
- Triage: <!-- each finding: real (fixed in <commit>) / noise (rationale) / investigate (R-05) -->
- Verify table: <!-- link or paste the criterion ↔ evidence table -->

## Gates
- [ ] Spec was `Approved` before the plan; plan approval is recorded in the plan file (above)
- [ ] `./scripts/check` green locally (CI re-runs the same contract)
- [ ] Independent review done (fresh session / reviewer subagent) — findings triaged by a human
- [ ] Real findings fixed; noise rejected **with written rationale**
- [ ] Every acceptance criterion has evidence (criterion ↔ evidence table above or in the spec)
- [ ] Docs / ADRs updated if behavior or architecture changed
- [ ] No tests weakened, deleted, or skipped
- [ ] `./scripts/doctor --strict` passes (CI enforces the spec/plan gates)

## Evidence
<!-- Paste the check output summary. -->
