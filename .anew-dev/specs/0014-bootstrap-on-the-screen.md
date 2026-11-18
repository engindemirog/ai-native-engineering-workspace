# Spec 0014 — bootstrap on the screen: the fixed answers, the progress, doctor, the merge

- Status: Draft
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0014-plan.md`
- Self-critique: pending
- Source: the human after 0012's SHIP: "bootstrap yapılmamışsa bootstrap işini de uçtan uca
  ekrandan yapmak istiyorum" (the first half of that request is spec 0013)

## Intent
Since 0011, a project that is not bootstrapped gets one piece of work on the Start screen, "Set up
the project", with `/bootstrap`. After the click the screen knows nothing more: the interview,
the generation, doctor's verdict and the `chore/bootstrap` branch all happen out of its sight, and
the human has to know that bootstrap ends with a branch to merge.

This spec carries bootstrap on the screen from the first answer to the merge:
- the **fixed-choice questions** — chat language, document language, mode, trivial-change policy —
  answered on the screen, each with ANEW's recommendation, and passed to the agent with the
  command;
- the **progress**, read from the files and git: not started · in the agent (the interview) ·
  generated · verified (doctor) · merged;
- **doctor** run from the screen, its failures and warnings shown;
- **the merge** of `chore/bootstrap`: push and open the PR from the screen, or the commands —
  never the merge itself.

The open questions (product, domain, stack, architecture, conventions, testing, security) stay
in the agent's interview: the agent inspects the code and recommends; a screen cannot.

Success means: a new project goes from the setup card to a merged `chore/bootstrap` with the
screen showing each step, and the human types into the agent only the open questions.

Deliberately not done:
- the interview on the screen (G-2); the screen writing `AGENTS.md` or `docs/` itself (G-1);
- merging from the screen (as 0010's Ship).

## Requirements
1. **The bootstrap section** on the Start screen while bootstrap is not complete: the phase strip
   (not started · in the agent · generated · verified · merged), the current phase's one line,
   and the step it waits for.
2. **The fixed answers:** chat language and document language (free text with a suggestion from
   VS Code's display language), mode (lite · strict · "decide in the interview"), trivial-change
   policy (1 PR + one reviewer · 2 direct commit on a trivial branch · 3 mini-spec · "decide in
   the interview"); ANEW's recommendation marked on each (G-3); the pick kept per workspace.
3. **The command carries them:** `/bootstrap chat=<xx> docs=<xx> mode=<lite|strict>
   trivial=<1|2|3>`, only the answers given, in the agent's form (`$bootstrap …` for Codex);
   Start and Copy as in 0011.
4. **The agent takes them:** `prompts/bootstrap.md` and every adapter's bootstrap command (Claude
   Code, Copilot, Cursor, Codex): an answer given with the command is the human's decision at its
   gate — confirmed in one line, not asked again; every other question as today (G-6).
5. **Generated:** once `AGENTS.md` is configured, the Mode and Language lines it holds, and whether
   `scripts/check.conf` exists.
6. **Verified:** **Run doctor** runs `./scripts/doctor` (read-only); its result as it is — the
   result line, each FAIL and WARN line; green when 0 fail.
7. **Merged:** while `chore/bootstrap` exists and is not merged into the branch it came from, the
   screen names it and offers **Push and open PR** after a confirmation naming the branch and the
   remote (`git push -u`, `gh pr create --fill`), or the commands to copy; it never merges. Once
   merged (or no such branch), the section is gone and the kinds of work remain.
8. **Release:** ANEW v1.31; extension 0.5.0, the `.vsix` on the GitHub release.

## User experience
- **Design reference:** the 0010–0013 screens; the phase strip as the stage strip.
- **Accessibility:** answers as real buttons with `aria-pressed` and labelled text fields; results
  with `role=status` / `alert`.
- **Language:** English, as the scripts' output is; the answers name language codes.

## Constraints & out of scope
- The extension writes no file: the agent writes the bootstrap output; doctor only reads; git
  pushes and gh opens the PR after the human's confirmation.
- The phase is never cached: read again on each draw.
- Tests run without a VS Code instance: logic in pure modules with `node:test`; doctor and git
  against fixture repositories; the VS Code layer by the human's run at SHIP.

## Acceptance criteria
- [ ] AC-1 — the phase read for: the template's AGENTS.md (not started), a started bootstrap
  without output (in the agent), a configured AGENTS.md on an unmerged `chore/bootstrap`
  (generated), with doctor green (verified), merged (gone) (unit + integration on fixture repos).
- [ ] AC-2 — the command carries exactly the answers given, in the agent's form; none given →
  plain `/bootstrap` (unit).
- [ ] AC-3 — `prompts/bootstrap.md` and each adapter's bootstrap command hold the given-answers
  rule (unit test reading the files; doctor's adapter parity stays green).
- [ ] AC-4 — doctor's output read into its result line, FAIL and WARN lines, from real doctor runs
  on a fixture (integration).
- [ ] AC-5 — the merge step offered only for an unmerged `chore/bootstrap`; the confirmation names
  branch and remote; no merge is ever run (unit + integration).
- [ ] AC-6 — on this machine the packaged `.vsix`: a new project from 0013 is bootstrapped from the
  screen — answers given, `/bootstrap` started, the phases followed, doctor run, the PR opened;
  judged by the human at SHIP.
- [ ] AC-7 — `./scripts/selftest` and `./scripts/doctor --strict` stay green; CI runs the
  extension's tests; README, `docs/commands.md` (`/bootstrap`, §F), `extensions/vscode/README.md`,
  CHANGELOG v1.31 and `.anew-version` v1.31.

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green (here: doctor --strict + selftest + the extension's `npm test`)
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [ ] Docs updated (README, `docs/commands.md`, CHANGELOG, `extensions/vscode/README.md`)
- [ ] Spec moved to `.anew-dev/done/`

## Self-critique
- **G-1 — the answers reach the agent with the command.** The screen could write the Language and
  Mode lines itself, but bootstrap writes them with the rest of AGENTS.md and docs/conventions.md
  in one commit on `chore/bootstrap`. Recommendation: the screen writes nothing; the answers ride
  on the command and the agent records them where it does today.
- **G-2 — only the fixed-choice questions on the screen.** The open ones need the agent's
  inspection of the code and its recommendation (the proposal rule). Recommendation: four
  questions on the screen, the rest in the interview.
- **G-3 — recommendations.** Languages: the VS Code display language for both (bootstrap's own
  rule: documents in the chat language unless the team is international or a rule requires
  English). Trivial-change policy: (1), as bootstrap recommends. Mode: "decide in the interview",
  because bootstrap weighs team size and risk, which the screen does not know.
- **G-4 — the phases come from files and git.** LANGUAGE, INSPECT and INTERVIEW happen in the chat
  and leave no file. Recommendation: one phase, "in the agent", from the moment the screen started
  `/bootstrap` (remembered per workspace) or `chore/bootstrap` exists; generated from AGENTS.md;
  verified from a doctor run made on this screen; merged from git.
- **G-5 — never the merge.** As 0010's Ship: push and the PR after a confirmation; the merge stays
  with the team (review, CI). A repository without a remote gets the local merge command to copy.
- **G-6 — the given-answers rule lives in `prompts/bootstrap.md`.** The adapters' commands point to
  it with one sentence each, so the rule is written once and doctor's adapter parity holds.
