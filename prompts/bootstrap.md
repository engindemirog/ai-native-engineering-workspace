# Prompt: Bootstrap

```
Read AGENTS.md and workflows/bootstrap.md. We are adapting this workspace to a real project.

0. LANGUAGE — before anything else, in the language I used to start this session (English if
   unclear, with a note that any language is fine): ask (a) which language to conduct the
   interview in, (b) which language to write the project documents in (docs/, specs, plans,
   ADRs, review reports). Recommend (a) = my language, (b) = the same unless the team is
   international or a vendor/compliance rule requires English. Continue the interview in (a).
   These become permanent: AGENTS.md "Language" line + docs/conventions.md "Language".
   Field labels and Status values in templates stay English — they are protocol, not prose.
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
   stack; set the Mode and Language lines in AGENTS.md; rewrite the AGENTS.md project summary.
   HARD RULES: the "Invariant rules" block in AGENTS.md is kept verbatim; the "Operating mode"
   section keeps its "Start work" and "Language" lines (fill the values, keep the sentences);
   AGENTS.md stays a signpost ≤ 40 lines — it POINTS to docs, it never copies them.
   RESOURCE HYGIENE for check.conf (docs/testing.md, Resource hygiene):
   a. Inventory — for each command, name every process it can leave behind (the categories in
      that section). Consult your toolchain's docs for its no-daemon / no-server / run-once switch.
   b. Neutralize — add those switches or env vars, each with a one-line comment naming the rule
      (# resource hygiene: no build daemon). No switch → stop the process inside the SAME step,
      keeping its exit code (check fails fast; a separate last step is skipped on red):
      test: sh -c 'tool run; rc=$?; tool stop; exit $rc'
      (Worked examples only, not a supported list: .NET -nodeReuse:false
      -p:UseSharedCompilation=false · Gradle --no-daemon.)
   c. Prove — in VERIFY, run the residue test and report it at the gate. A bootstrap whose check
      fails the residue test is not done.
   Adoption (existing code): changing build flags the team relies on is PROPOSED, not imposed;
   the residue test runs either way so the trade-off is visible.
4. VERIFY: run ./scripts/doctor and ./scripts/check and show me the output; then the residue test
   (3c) with its baseline and both post-run measurements.
5. REPORT: what you generated, what you assumed, and every open question that still needs my
   decision — with your recommendations. End with the first command for the mode you set:
   lite → Next: /new-feature "<feature>" (it chains the segments and asks at each gate);
   strict → Next: /analyze "<feature>" in an Analyst session. Do not recommend the segment
   commands in lite mode — /new-feature calls them.
```
