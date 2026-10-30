# Spec 0003 — Field pilot "randevu": residue that tells check apart, agent screenshots, greenfield bootstrap

- Status: Approved
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0003-plan.md`
- Self-critique: done (6 gaps G-1…G-6 folded in, approved by Engin Demiroğ 2026-10-30)

## Intent
The randevu pilot (a TypeScript appointment system built with ANEW v1.22.1, field log
`C:\anew-pilot-randevu\FIELD-LOG.md`, rows 1–11, all triaged by Engin Demiroğ on 2026-10-30)
shipped its first spec, a walking skeleton, in about 71 minutes. On top of the 4 lite gates it
needed 5 extra human decisions. Three of them came from two rules that work against an
agent-driven workflow:
- **Residue.** The residue test compares every process on the machine, so Windows services and a
  parallel agent session showed up as check's residue. The human was asked for an idle machine,
  ran the test three times by hand, lost about 25 minutes, and a criterion went to the backlog
  through R-08.
- **Screenshots.** The human had to take every UI screenshot themselves ("bu otomasyonumuza çok
  ters"; "bu hep böyle olmalı" for agent-captured ones).

Success means:
- the residue test fails only on what check itself left running, and a person never has to think
  about it unless it does;
- the agent captures screenshots and the human only looks at them;
- a greenfield bootstrap has a defined path to its first green check;
- the smaller frictions from the field log are gone.

Deliberately not done: anything without a field incident behind it.

## Requirements
1. **Residue counts only what check started** (field #8). For every new process that survives,
   the residue test follows its parent chain:
   - The chain reaches a live process that existed before the first run and is not the residue
     test itself → **not from check**. Listed separately with its parent; never affects the
     verdict.
   - The parent is gone, or it was handed to the init process or a subreaper → **orphan**. This
     counts as check's residue, because a daemon detaches exactly this way.
   - The chain leads into the check run → counts as check's residue.

   Every survivor line names its parent (pid and name, or "gone"). Memory is reported but never
   changes the verdict: once none of check's processes survive, a memory drop belongs to
   something else.

   A foreign process that init starts during the runs (on POSIX, parent PID 1) looks like an
   orphan and counts. This is accepted: it fails closed, and its line names the parent so a
   reader can tell what it is. (Self-critique G-1.)
2. **Residue is the agent's job** (field #8). No rule, prompt or gate asks the human to run the
   residue test or to idle the machine. At a gate the result is one line, `Residue: clean (fast +
   full)`. A decision is asked only on RESIDUE FOUND, and then with the step that leaks and a
   proposed fix.
3. **Residue is part of check's contract, not an acceptance criterion** (field #8, #9). The
   residue test belongs to BUILD's Done: when `scripts/check.conf` changed in the work, both
   profiles are run. Specs do not carry residue criteria.
4. **Build evidence lives in the plan** (field #9). The plan gets a `## Build evidence` section.
   The builder writes pointer lines there, never saved output: `CHECK GREEN (full, …) @<sha>` and,
   when the residue test ran, `RESIDUE CLEAN (<profile>, 2 runs) @<sha>` or the FOUND line. Review
   and VERIFY cite these lines and do not re-run what they record for the same SHA. This does not
   conflict with "show check output in the conversation, never save it to a file".
5. **The agent captures screenshots; the human looks** (field #10, #11). By default the agent
   captures every User-experience state:
   - with a scripted, headless browser;
   - the script and the images stay outside the repo and outside check, in a temporary directory;
   - ANEW names no tool.

   The images are shown as one gallery at the SHIP gate: one image per screen and state, each
   named after the state it shows. The ship approval covers looking at them; it is not a separate
   decision. The evidence table records `S-1…S-n agent-captured, judged by <name> at SHIP,
   <date>`. The human attaches them to a PR if they want to, before the gate closes; with no PR,
   the SHIP gate is enough. Like a clean clone, the temporary directory is deleted after the SHIP
   gate (G-3).
   The human captures a state only when the agent cannot reach it (a real device, an external
   system), and the evidence table says so. Component tests still prove the states; the gallery
   is the visual sign-off.
6. **Greenfield bootstrap asks for the stack** (field #1). Greenfield: a "stack & versions" topic
   comes before "architecture style". Adoption: the stack detected in INSPECT is confirmed instead.
7. **One architecture topic** (field #2). "Forbidden dependencies" is folded into "architecture
   style & module boundaries (the forbidden module dependencies included)". The interview says
   that the policy for third-party libraries belongs to `docs/security.md` "Dependencies".
8. **Bootstrap has a branch and asks about remote and CI** (field #3).
   - The bootstrap output is committed on `chore/bootstrap` and merged like any branch.
     `docs/git.md` Branching lists it.
   - The REPORT asks: is there a remote and CI? If not, where does a full green come from (a local
     full run, rule 6), and how is the branch merged?
9. **Greenfield: the walking skeleton** (field #4).
   - In a greenfield bootstrap, `check.conf` holds the planned steps and their `requires` lines as
     comments. doctor's "no steps" WARN is expected there.
   - The REPORT names the first spec: a walking skeleton, the smallest end-to-end slice. It creates
     the toolchain and activates the steps; its PLAN gate carries doctor's per-profile verdict
     (R-13), and its BUILD runs the residue test.
   - The "before the first feature" R-13 rule says this case explicitly, so the two rules no
     longer contradict each other.
10. **Deferred bootstrap decisions have a home** (field #5). A bootstrap REPORT item the human
    defers goes to the backlog with `Source: bootstrap <YYYY-MM-DD>`, which is a valid Source.
11. **Commit messages are not an extra gate** (field #6). An approved plan covers the messages of
    its `[plan NNNN/n]` and `[plan NNNN/fix-k]` commits; the ship approval covers the ship commit.
    The human sees every message in the branch and the PR. `docs/git.md` "the human approves"
    says this. The rule is the same in lite and strict: the gate before a commit covers its
    message (G-5).
12. **LF in the repository by default** (field #7). The template `.gitattributes` sets
    `* text=auto eol=lf`, with `*.cmd` and `*.bat` set to `eol=crlf`, so Windows batch files keep
    working. A formatter then sees the same line endings on a Windows checkout as on Linux CI.

## User experience
none — no graphical interface. Terminal and gate states:
- residue, survivors only from outside check → `RESIDUE CLEAN (<profile>, 2 runs)` (exit 0),
  preceded by a "not from check" list with each process's parent.
- residue, check left something → `RESIDUE FOUND (<profile>)` (exit 1). Each survivor names its
  parent, or says "gone".
- residue, memory below baseline beyond tolerance → a reported line marked informational; the
  verdict is unchanged.
- gate message: one line `Residue: clean (fast + full)`. A decision is asked only on FOUND.
- SHIP gate with UI: a gallery list (state → image path) and the usual single ship decision.
- No change in check.conf and no UI → gates read exactly as in v1.22.1.
- Accessibility: plain text, existing prefixes.

## Constraints & out of scope
- AGENTS.md invariant rules are byte-identical to v1.22.1. Rule 4 ("evidence over claims") is
  served, not weakened: the screenshot is still evidence, only the hand that takes it changes.
- POSIX sh. Windows (Git Bash) and POSIX both supported by residue, as today. Stack-neutral: no
  tool, browser driver or language is named in the docs (`anew-no-dotnet`).
- Backward compatible:
  - `ANEW_RESIDUE_SETTLE` and `ANEW_RESIDUE_MB` stay accepted; above the tolerance, a memory drop
    prints an informational line only (G-2);
  - the residue exit codes keep their meaning;
  - CHANGELOG v1.23 has Upgrading steps; `git add --renormalize .` for `.gitattributes` is listed
    as optional, never required (G-4);
  - a selftest covers every residue behavior.
- Out of scope:
  - a doctor check for a missing RESIDUE line (no field incident yet; G-6);
  - the OYP platform notes (A-5…A-7, E-1…E-4) and ANEW backlog B-1…B-4;
  - the pilot's own backlog item B-2 (re-measured after the pilot upgrades, not here).
- Split: proposed (residue script / documents); kept as one — Engin Demiroğ, 2026-10-30, one
  release for one field round, as approved in triage.

## Acceptance criteria
- [ ] AC-1 — residue: a process started during the runs by something outside check, whose parent
  is a live process from before the baseline, is listed as "not from check" with its parent; the
  verdict is `RESIDUE CLEAN` and the exit code is 0.
- [ ] AC-2 — residue: a process a check step leaves behind (backgrounded and detached, so it is
  orphaned or reparented) is a survivor with its parent shown, and the result is `RESIDUE FOUND`,
  exit 1. Zombies still count. Kernel threads are still left out.
- [ ] AC-3 — residue: memory below baseline beyond `ANEW_RESIDUE_MB` with no survivor from check →
  a line marked informational, `RESIDUE CLEAN`, exit 0.
- [ ] AC-4 — Documents, residue:
  - `docs/testing.md` Resource hygiene rule 2 defines the attribution and drops "idle machine";
  - `prompts/bootstrap.md` and `workflows/bootstrap.md` ask nothing of the human about residue
    and use the one-line gate format;
  - ANEW-0007 records the change;
  - `docs/commands.md` describes the new output.
- [ ] AC-5 — Documents, build evidence:
  - `specs/plans/TEMPLATE.md` has `## Build evidence`;
  - `prompts/build.md` writes the lines there, and its Done includes the residue test when
    check.conf changed;
  - `prompts/review.md`, `prompts/verify.md` and the segments table cite them.
- [ ] AC-6 — Documents, screenshots: `docs/testing.md` (Test layers 4, Evidence for UI criteria,
  Evidence policy 3), `workflows/segments.md`, `prompts/verify.md`, `prompts/review.md`, the
  feature, change and fix workflows, `specs/TEMPLATE-mini.md`, `docs/roles/qa.md`, and every
  adapter text the plan inventories say that the agent captures and the human judges at SHIP,
  with the human-capture fallback.
- [ ] AC-7 — Documents, bootstrap interview and output:
  - stack & versions topic (greenfield) and confirmation (adoption);
  - forbidden dependencies folded into architecture;
  - `chore/bootstrap` in `docs/git.md` Branching and in bootstrap;
  - a REPORT item for remote and CI.
- [ ] AC-8 — Documents, walking skeleton: greenfield check.conf as commented plan, the REPORT names
  the walking skeleton as the first spec, and R-13 timing in `workflows/bootstrap.md` and
  `prompts/bootstrap.md` agrees with it.
- [ ] AC-9 — Documents, small rules: `specs/backlog.md` accepts `Source: bootstrap <date>`;
  `docs/git.md` Commits states which approval covers which commit messages.
- [ ] AC-10 — `.gitattributes`: `* text=auto eol=lf`, `*.cmd`/`*.bat` `eol=crlf`; the existing
  `scripts/*` and `*.sh` LF lines stay.
- [ ] AC-11 — `scripts/selftest` covers AC-1…AC-3, and each turns red on a deliberate break
  (reported by VERIFY). CHANGELOG v1.23 has Upgrading steps; `.anew-version` is v1.23;
  `doctor --strict` reports 0 fail; AGENTS.md invariant text is byte-identical to v1.22.1.

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green (this template: `doctor --strict` + `selftest`, CI)
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [ ] Docs / ADRs updated if behavior or architecture changed
- [ ] Spec moved to `.anew-dev/done/` (it becomes immutable there)

## Scorecard (fill at ship)
| Metric | Value |
|---|---|
| Spec revisions | |
| Fix rounds | |
| Review findings: real / noise / deferred | |
| Regressions introduced | |
| Bugs escaped to production | |
