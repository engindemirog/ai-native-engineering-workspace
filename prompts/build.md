# Prompt: Build

```
Role: Developer. Execute the APPROVED plan specs/plans/<NNNN>-plan.md, step by step.

- Work on branch <type>/<NNNN>-<name> (docs/git.md). Conventional Commits with plan references.
- Follow docs/conventions.md and docs/security.md.
- Write the tests from the criterion↔test map as you go — tests assert behavior.
- After each plan step: brief note on what you did. Needing to leave the plan? STOP → recovery
  R-07 (deviations are proposed, not smuggled).
- Problems: compile/runtime error → R-01 · red test → R-02 · you created a regression → R-04.

Done means: all steps complete, ./scripts/check GREEN, changed-file list matches the plan as amended.
Return: changed files + check output. Do not self-review; that comes next, independently.

§fixes — For triaged review findings: fix ONLY findings marked real, smallest change per finding,
one commit per finding referencing it. Full suite green after each. Never touch unrelated code.
```
