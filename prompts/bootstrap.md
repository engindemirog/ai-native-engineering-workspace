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
   existing conventions from the code, and present what you found for confirmation. If empty
   (greenfield), we start from my answers.
2. INTERVIEW me one topic at a time — with your own recommendation and rationale for every
   question (proposal rule):
   product & goal · domain terms and business rules · sensitive areas (docs/domain.md) ·
   stack & versions (greenfield: language, framework, runtime and their versions; adoption:
   confirm what INSPECT found) · architecture style & module boundaries, the forbidden module
   dependencies included (docs/architecture.md; a policy for third-party libraries belongs to
   docs/security.md "Dependencies") · conventions (data rules, error handling, naming) · testing
   expectations (docs/testing.md, Test layers — UI work: which layer proves UI criteria; recommend
   component tests and no e2e unless a critical journey needs one. With e2e: which journeys, the
   budget, the tool, who owns the app-under-test lifecycle, and how the app runs deterministic
   under test — motion off, fixed clock/locale/seed, Determinism) · known traps of this stack
   (docs/conventions.md "Known traps"; empty is fine) · security posture · git rules ·
   trivial-change policy ("what do label/typo-level changes require?" —
   (1) PR + one reviewer, no spec [recommend this: cheap safety net]; (2) direct commit allowed on a trivial branch; (3) everything goes through a mini-spec
   [strictest]; write the answer to docs/git.md "Trivial changes") · operating mode (lite or
   strict — recommend one based on team size and risk).
3. GENERATE from my answers: fill every template in docs/ (architecture, domain, conventions,
   testing, security, git); write scripts/check.conf with real build/test/lint commands for this
   stack; set the Mode and Language lines in AGENTS.md; rewrite the AGENTS.md project summary.
   Greenfield: those commands need code that does not exist yet (rule 1: no spec, no code), so
   write the planned steps and their requires lines as comments; the walking skeleton (5.)
   activates them. Commit the bootstrap output on branch chore/bootstrap (docs/git.md), never on
   the default branch.
   HARD RULES: the "Invariant rules" block in AGENTS.md is kept verbatim; the "Operating mode"
   section keeps its "Start work" and "Language" lines (fill the values, keep the sentences);
   AGENTS.md stays a signpost ≤ 40 lines — it POINTS to docs, it never copies them.
   RESOURCE HYGIENE for check.conf (docs/testing.md, Resource hygiene):
   a. Inventory — for each command, name every process it can leave behind (the categories in
      that section) and the data it leaves for the next run (rule 5: databases, files, queues). Consult your toolchain's docs for its no-daemon / no-server / run-once switch.
   b. Neutralize — add those switches or env vars, each with a one-line comment naming the rule
      (# resource hygiene: no build daemon). No switch → stop the process inside the SAME step,
      keeping its exit code (check fails fast; a separate last step is skipped on red):
      test: sh -c 'tool run; rc=$?; tool stop; exit $rc'
      (Worked examples only, not a supported list: Gradle --no-daemon · Playwright --workers=1.)
   c. Prove — in VERIFY, run the residue test (./scripts/residue, then ./scripts/residue --fast)
      and report it at the gate as one line: Residue: clean (fast + full). On RESIDUE FOUND,
      name the step that leaks and propose the fix. A bootstrap whose check fails the residue
      test is not done. Never ask me to run it or to idle the machine: what other sessions or
      the OS start is listed as "not from check" and does not count.
      Greenfield (no steps yet): residue says RESIDUE NOT MEASURED; the work that adds the
      first steps runs it then, both profiles.
      Also confirm every test step still runs the same number of tests as before the switches:
      some runners forward unknown flags to the test process and silently run zero tests.
   d. Split — tag the quick steps [fast] in their name, leave slow suites full-only
      (docs/testing.md, Two speeds, one contract); split a test step by a selector, never by a
      list (rule 4). Report each profile's duration at the gate — the median of at least 3 runs,
      from check's own timings (rule 5). The residue test and the test-count check in (c) apply
      to BOTH profiles.
   Adoption (existing code): changing build flags the team relies on, and the fast/full split, are
   PROPOSED, not imposed; the residue test runs either way so the trade-off is visible.
4. VERIFY: run ./scripts/doctor and ./scripts/check and show me the output; then the residue test
   (3c), reported as its one line. Steps that need something of this machine carry
   `requires <step>: <command>` lines naming the tool this project uses (ANEW assumes none).
   Show doctor's per-profile verdict; a profile not runnable here comes with your recommendation
   (fix the environment / that profile in CI only / change the step) for me to decide (R-13).
   "check fails on the check.conf errors above" is not an environment gap: fix the conf.
   Greenfield (commented check.conf): doctor's "no steps" WARN is expected and there is no
   profile verdict yet; it is decided at the walking skeleton's PLAN gate.
5. REPORT: what you generated, what you assumed, and every open question that still needs my
   decision — with your recommendations. Ask whether there is a remote and CI; if not, where a
   full green comes from (a local full run, docs/testing.md rule 6) and how chore/bootstrap is
   merged. An open question I defer goes to specs/backlog.md with Source: bootstrap <YYYY-MM-DD>.
   Greenfield: name the first spec — a walking skeleton, the smallest end-to-end slice that
   creates the toolchain and activates the check.conf steps; its PLAN gate carries doctor's
   per-profile verdict (R-13) and its BUILD runs the residue test.
   End with the first command for the mode you set:
   lite → Next: /new-feature "<feature>" (it chains the segments and asks at each gate);
   strict → Next: /analyze "<feature>" in an Analyst session. Do not recommend the segment
   commands in lite mode — /new-feature calls them.
```
