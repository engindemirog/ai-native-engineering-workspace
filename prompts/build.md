# Prompt: Build

```
Role: Developer. Execute the APPROVED plan specs/plans/<NNNN>-plan.md, step by step.

- Work on branch <type>/<NNNN>-<name> (docs/git.md). Conventional Commits with plan references.
- Follow docs/conventions.md and docs/security.md.
- Write the tests from the criterion↔test map as you go — tests assert behavior.
- After each plan step: brief note on what you did. Needing to leave the plan? STOP → recovery
  R-07 (deviations are proposed, not smuggled).
- Problems: an error from the plan step you are on is fixed inside BUILD. Compile/runtime error
  from outside the current step, or the same error still there after two attempts → R-01 ·
  red test → R-02 · flaky test → R-03 · you created a regression → R-04 · ambiguity or a
  docs–code conflict → R-10 · the session's context is drifting on a long build → R-09.

Iterate with ./scripts/check --fast; the handoff carries the FULL profile output, shown —
CHECK GREEN (full, …) (docs/testing.md, Two speeds, one contract).
Done means: all steps complete, ./scripts/check GREEN (full), changed-file list matches the plan.
Return: changed files + check output. Do not self-review; that comes next, independently.
Show check output in the conversation and reference it; never save it to a file.

§fixes — For triaged review findings: fix ONLY findings marked real, smallest change per finding,
one commit per finding referencing it. --fast green after each finding's commit; full green
before the fix diff goes back to review. Never touch unrelated code.
```
