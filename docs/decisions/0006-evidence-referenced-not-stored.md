# ADR 0006 — Evidence is referenced, not stored

- Status: Accepted
- Date: 2026-10-07

## Context
"Evidence over claims" is an invariant rule, but it never said where evidence lives. In projects
bootstrapped from this template, agents began filling an `evidence/` folder with saved check
output and log copies — and with full clones of the repository inside the repository
(`evidence/<project>-clone/`), created for clean-clone verification and never deleted. The
discipline was right; the storage behavior bloated repos and duplicated what git history and CI
already archive.

## Decision
Evidence is referenced, not stored (`docs/testing.md`, Evidence policy):
1. Each criterion's evidence is a pointer — test name + reproduction command (`./scripts/check`);
   the criterion ↔ evidence table is the only evidence artifact in the repo.
2. Reproducible evidence (check output, console dumps, coverage reports, logs) is never filed.
3. Non-reproducible evidence (manual UI screenshot, one-off measurement, external confirmation)
   goes into the PR; the evidence table links to it.
4. The repository is never cloned or copied inside its own working tree; clean-clone verification
   runs in a temp dir outside the repo, records a one-line result, and is deleted.
5. There is no `evidence/` directory.

## Consequences
- Benefits: evidence tables stay and remain checkable by rerunning commands; the repo stays small;
  the policy sits in the verify/build/review prompts at the moment of temptation; `scripts/doctor`
  warns on nested clones and `evidence/` directories.
- Costs: non-reproducible evidence depends on the PR host keeping attachments; the doctor checks
  are WARN only (cleanup signals, not gates), so a violation can still be merged if ignored.

## Alternatives considered
- Size limits, retention scripts or archive tooling for `evidence/`: rejected as framework creep —
  infrastructure for managing what should not be kept.

## Revisit triggers
- A compliance regime requires evidence retained inside the repository.
- Doctor warnings are repeatedly ignored and violations reach `main` (consider FAIL under `--strict`).
