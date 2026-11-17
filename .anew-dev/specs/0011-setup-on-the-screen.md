# Spec 0011 — the VS Code extension, part 3: setting up a project on the screen

- Status: Draft
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0011-plan.md`
- Self-critique: pending
- Source: the human after 0010's SHIP: "Ekranda scripts initi mevcut adaptörler kurulmamışsa bile
  onları kuracak seçenek de olmalı"

## Intent
Spec 0010 lets a human start work from the screen, but only in a repo where the setup was already
done in the terminal: an adapter installed with `scripts/init <tool>` and the project bootstrapped
(`/bootstrap`). Without them the command the screen hands over fails in the agent — the agent does
not know `/new-feature`, or AGENTS.md (`STATUS: NOT CONFIGURED`, `Mode: unset`) stops it. The
screen does not say so today.

This spec puts the setup on the screen: which adapters are installed, an **Install** for the ones
that are not (one `scripts/init <tool>` call), and, while the project is not bootstrapped,
`/bootstrap` as the first work to start. A fresh copy of the template can then go from nothing to
its first feature without the terminal.

It stays a view over the files: installed or not is read from the files `scripts/doctor` checks;
every install is one `scripts/init` call, shown as it answers; bootstrap stays the agent's work.

Success means a human opens a fresh template copy in VS Code, installs an adapter, starts
`/bootstrap` and then a feature from the screens, and the files afterwards are exactly what the
same commands in a terminal leave.

Deliberately not done:
- `scripts/init --force` from the screen (G-2);
- running bootstrap from the extension: the screen hands the command to the agent (as 0010 G-2);
- a Start button for agents other than Claude Code (G-4); a commit of the installed files (G-5).

## Requirements
1. **The agent card** on the Start screen: claude-code, github-copilot, cursor and codex, each
   installed or not, read from the files doctor's adapter check names (`CLAUDE.md`,
   `.github/copilot-instructions.md`, `.cursor/rules/`, `.agents/skills/analyze/SKILL.md`);
   generic named with its meaning ("nothing to install: paste AGENTS.md", a link to
   `adapters/generic/README.md` opened in the editor).
2. **Install** for each adapter that is not installed: a confirmation naming the files and
   folders `scripts/init` writes for it, then `./scripts/init <tool>` (no `--force`); its output
   shown as it is, "kept … (exists)" lines included; the card refreshes. A repo without
   `adapters/` (or without the adapter's folder) offers no Install and says why.
3. **The agent's command form:** the command is built for the agent the human picks on the card
   (G-3) — `/new-feature …` for Claude Code, Copilot and Cursor, `$new-feature …` for Codex; the
   pick is remembered per workspace.
4. **Bootstrap first:** while AGENTS.md says `STATUS: NOT CONFIGURED` or `Mode: unset`, the Start
   screen offers one piece of work, "Set up the project", with `/bootstrap` (`$bootstrap` for
   Codex) and its one-line meaning; the kinds of work appear once bootstrap has set the mode.
5. **The sidebar** shows one card above the groups while no adapter is installed or the project is
   not bootstrapped: what is missing, and a button that opens Start.
6. **States of every write** as in 0010: idle, running (controls disabled), written, refused (exit
   code, nothing else claimed), no shell.
7. **Release:** ANEW v1.29; extension 0.3.0, the `.vsix` on the GitHub release.

## User experience
- **Design reference:** the 0010 screens' frame (cards, stage colours from the theme, AA contrast).
- **Accessibility:** Install and the agent pick are real buttons with `aria-pressed`; the
  confirmation is VS Code's modal; results announced with `role=status` / `alert`.
- **Language:** English, as the scripts' output is.

## Constraints & out of scope
- The extension writes no file itself: `scripts/init` does.
- Installed or not is never cached: read again on each draw and after each install.
- Tests run without a VS Code instance: logic in pure modules with `node:test`; the VS Code layer
  by the human's run at SHIP.

## Acceptance criteria
- [ ] AC-1 — the agent card shows each adapter installed or not for fixtures with none, one and
  all four installed; the markers are the ones `scripts/doctor` checks (unit tests on the model and
  the HTML).
- [ ] AC-2 — Install runs exactly `./scripts/init <tool>` and on a fixture repo leaves the same
  files as the terminal call; an existing file is kept and its "kept" line shown; no `--force` is
  ever passed; a repo without the adapter's folder offers no Install (unit + integration).
- [ ] AC-3 — the command follows the picked agent: `/…` for claude-code, github-copilot and
  cursor, `$…` for codex, for every kind and for bootstrap (unit tests).
- [ ] AC-4 — with AGENTS.md not configured (the template's own text) Start offers only "Set up the
  project" with `/bootstrap`; with a configured AGENTS.md the kinds as in 0010 (unit tests on the
  template's real AGENTS.md and a configured fixture).
- [ ] AC-5 — the sidebar's setup card appears when no adapter is installed or bootstrap has not
  run, and not otherwise (unit tests).
- [ ] AC-6 — on this machine the packaged `.vsix` installs, and a fresh template copy goes from no
  adapter to an installed one, `/bootstrap` started from the screen, and a feature started from
  the screen; screenshots of each state, judged by the human at SHIP.
- [ ] AC-7 — `./scripts/selftest` and `./scripts/doctor --strict` stay green; CI runs the
  extension's tests; README, `docs/commands.md` §F, `extensions/vscode/README.md`, CHANGELOG v1.29
  and `.anew-version` v1.29.

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green (here: doctor --strict + selftest + the extension's `npm test`)
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [ ] Docs updated (README, `docs/commands.md`, CHANGELOG, `extensions/vscode/README.md`)
- [ ] Spec moved to `.anew-dev/done/`

## Self-critique
- **G-1 — where the setup lives.** Recommendation: on the Start screen, because that is where the
  missing setup breaks the work, plus one card in the sidebar so a fresh copy shows it at once. The
  alternative, a separate setup screen, is one more screen for a step done once per project.
- **G-2 — no `--force`.** `--force` overwrites adapter files the team may have customized, and
  nothing on the screen could show what would be lost. Recommendation: Install only what is
  missing; refreshing an adapter stays a terminal command, named on the card.
- **G-3 — the command depends on the agent.** Codex runs commands as skills (`$bootstrap`), the
  others as slash commands; 0010's Copy gives `/…` to every agent, which Codex does not run.
  Recommendation: the human picks the agent on the card (default: Claude Code when it is found,
  else the first installed adapter), and the command follows the pick. This also fixes 0010's
  copy for Codex.
- **G-4 — Start only in Claude Code.** Copilot and Cursor have no chat that can be opened from
  outside with a command; Codex has a CLI. Recommendation: keep Copy for the others in this spec;
  a Codex terminal start is added when a real need shows.
- **G-5 — the installed files are not committed.** Which adapter files belong in the repo is the
  team's choice (some keep `.claude/settings.local.json` out). Recommendation: the screen says the
  files are new and uncommitted, and the commit stays the human's; bootstrap's own commits follow
  as today.
- **G-6 — the bootstrap check.** Recommendation: `STATUS: NOT CONFIGURED` or `Mode: unset` in
  AGENTS.md, the same lines doctor warns about, so the screen and doctor never disagree.
