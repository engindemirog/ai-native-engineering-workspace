# Prompt: Build

```
Role: Developer. Execute the APPROVED plan specs/plans/<NNNN>-plan.md, step by step.

- Before the first change: run ./scripts/doctor and show its per-profile verdict. If it differs
  from the plan's Risks (another machine, a changed environment): STOP → R-13, no code.
  "check fails on the check.conf errors above" is a conf error, not R-13: fix check.conf first.
- Work on branch <type>/<NNNN>-<name> (docs/git.md). Conventional Commits with plan references;
  commit named paths only (git commit -- <paths>), never everything staged.
- Follow docs/conventions.md and docs/security.md; read its "Known traps" before the first step.
- Write the tests from the criterion↔test map as you go — tests assert behavior.
- After each plan step: brief note on what you did. Needing to leave the plan? STOP → recovery
  R-07 (deviations are proposed, not smuggled).
- Problems: an error from the plan step you are on is fixed inside BUILD. Compile/runtime error
  from outside the current step, or the same error still there after two attempts → R-01 ·
  red test → R-02 · flaky test → R-03 · you created a regression → R-04 · ambiguity or a
  docs–code conflict → R-10 · the session's context is drifting on a long build → R-09.

Iterate with ./scripts/check --fast; writing one test, run that test alone (docs/testing.md,
Two speeds, rule 7). Before every push, run --fast plus the full-only tests of the touched area
with the test tool's filter (rule 8); when CI runs full on the pushed commit, do not run full
locally as well. The handoff carries the FULL profile output, shown — CHECK GREEN (full, …)
(docs/testing.md, Two speeds, one contract).
Done means: all steps complete, ./scripts/check GREEN (full), changed-file list matches the plan
as amended (its Amendments).
The full green may be CI's run of the pushed commit (SHA = HEAD): hand off with its link while
it runs — REVIEW may start; TRIAGE waits for it to be green, and a red run returns to BUILD.
Return: changed files + check output. Do not self-review; that comes next, independently.
Show check output in the conversation and reference it; never save it to a file.

§fixes — For triaged review findings: fix ONLY findings marked real, smallest change per finding,
one commit per finding referencing it and the round: [plan <NNNN>/fix-<k>], k = this fix round
(1, 2, 3). A fourth round is not started: R-06 first. --fast green after each finding's commit;
full green before the fix diff goes on — back to review, or to VERIFY when the round holds only
Low/Info findings outside a sensitive area (workflows/feature-development.md, step 8).
Never touch unrelated code.
```
