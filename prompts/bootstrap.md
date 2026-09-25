# Prompt: Bootstrap

```
Read AGENTS.md and workflows/bootstrap.md. We are adapting this workspace to a real project.

1. INSPECT the working tree. If it contains application code, detect stack, build/test tooling and
   existing conventions from the code, and present what you found for confirmation. If empty,
   we start from my answers.
2. INTERVIEW me one topic at a time — with your own recommendation and rationale for every
   question (proposal rule):
   product & goal · domain terms and business rules · architecture style & module boundaries ·
   forbidden dependencies · conventions (data rules, error handling, naming) · testing
   expectations · security posture · git rules · trivial-change policy ("what do label/typo-level
   changes require?" — (1) PR + one reviewer, no spec [recommend this: cheap safety net];
   (2) direct commit allowed on a trivial branch; (3) everything goes through a mini-spec
   [strictest]; write the answer to docs/git.md "Trivial changes") · operating mode (lite or
   strict — recommend one based on team size and risk).
3. GENERATE from my answers: fill every template in docs/ (architecture, domain, conventions,
   testing, security, git); write scripts/check.conf with real build/test/lint commands for this
   stack; set the Mode line in AGENTS.md; rewrite the AGENTS.md project summary.
   HARD RULES: the "Invariant rules" block in AGENTS.md is kept verbatim; AGENTS.md stays a
   signpost ≤ 40 lines — it POINTS to docs, it never copies them.
4. VERIFY: run ./scripts/doctor and ./scripts/check and show me the output.
5. REPORT: what you generated, what you assumed, and every open question that still needs my
   decision — with your recommendations.
```
