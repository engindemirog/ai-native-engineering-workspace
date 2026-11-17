# Spec 0010 — the VS Code extension, part 2: the whole process on the screen

- Status: Shipped
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0010-plan.md`
- Self-critique: done (G-1–G-6 accepted as recommended, Engin Demiroğ, 2026-11-17)
- Source: spec 0009 G-6 (the split); B-14–B-20 (`.anew-dev/backlog.md`); the human at 0009's SHIP:
  "tüm süreç mockup gibi olsun. gerekirse iş bile başlatılabilsin"

## Intent
Spec 0009 put the work list and the two approvals on a VS Code screen. The rest of the human's
part still happens in the terminal or by hand: starting a piece of work, triaging review and
VERIFY findings, and shipping. This spec puts the whole process on the screen, following the
approved mockup https://claude.ai/artifact/E8Qy6Eo3zRcxap5RZWd63X — its four screens (overview
and approval, start, triage, ship) and its sidebar of cards.

It stays a view over the files: every value comes from `scripts/status --json` or the spec and
plan files, every decision is one `scripts/gate` call, and starting work hands a command to the
human's agent. The extension keeps no state of its own and never runs an agent's step itself.

Success means a human starts a feature, approves, triages and ships it without leaving VS Code
or editing a file by hand, and the files afterwards are exactly what the same commands in a
terminal leave.

Deliberately not done:
- running an agent's segment from the extension beyond opening a session with the command the
  human chose (G-2); merges, tags and releases (G-3);
- other editors; Marketplace publishing;
- a change to the ANEW protocol: review and VERIFY reports stay in the chat (G-1).

## Requirements
1. **The sidebar as the mockup's cards** (G-4): a webview view in place of 0009's tree — a
   **+ New work** button on top; groups your turn · in progress · shipped (shipped collapsed);
   each row a card: number and name, a badge naming the decision (Spec approval, Plan approval,
   Triage, Ship) or the stage and who has it, one line from status (next step or first warning).
   The waiting badge and the status bar stay. Clicking a card opens its screen.
2. **Start new work** (mockup "Yeni iş başlat"): the kind (new feature, change, bug fix,
   refactor — each with its one-line meaning and its command), a short description, and the
   command it builds, shown before anything runs. **Start in Claude Code** opens a new VS Code
   terminal that runs `claude` with that command (offered only when `claude` is on PATH);
   **Copy command** for any other agent. In strict mode (AGENTS.md `Mode:`) a new feature starts
   with `/analyze`. The spec's number is the agent's to assign; the screen writes no file.
3. **Triage** (mockup "Triage paneli") for a row at REVIEW or VERIFY (or `unclear: investigate
   open`): the human pastes the review or VERIFY report (G-1); the screen splits it into findings
   (id, severity, title, the reviewer's recommendation), each a card with real · noise · defer ·
   investigate and no default; noise needs a rationale, defer a `B-<n>` the backlog holds (the
   screen can add the entry). A finding can be edited, removed or added by hand. The table to be
   written is previewed; **Save triage** runs `scripts/gate triage NNNN --review|--verify` with
   the findings; a clean round (no findings) is one click. Afterwards: the next step and its
   command, with Copy.
4. **Ship** (mockup "Ship"): for a row at SHIP — the stage strip; the Definition of Done read
   from the spec; each acceptance criterion with its proof from the plan's criterion ↔ test map
   and the newest Verify table; the triage rounds' state; the approver (git `user.name`). **Ship**
   runs `scripts/gate ship NNNN`; afterwards the moved file and the next steps (G-3).
5. **The approval panel** keeps 0009's behaviour and fixes B-14–B-20: wrapped and odd-shaped
   criteria, the risks label, pipes in test-map cells, a test for the spec cards' escaping, no
   "Open" button while gate runs, AA contrast in the light theme; after a plan approval the cards
   stay the plan's (0009 VERIFY round 2, Info-1); the approver line from the mockup.
6. **gate's answer as it is**, on every screen: the written line, or the refusal with its exit
   code and nothing else written; the list refreshes.
7. **Release:** ANEW v1.28; extension 0.2.0, the `.vsix` on the GitHub release.

## User experience
- **Design reference:** the mockup's four screens and its sidebar; colours from the VS Code theme
  (dark close to the mockup; light and high contrast readable, AA contrast).
- **Accessibility:** every card and choice is a real button or radio, reachable by keyboard in
  reading order, with its state announced (`aria-pressed`, `role=status` / `alert`); no colour
  carries meaning alone.
- **States of every write:** idle; running (which spec, controls disabled); written; refused; no
  shell.
- **Language:** English, as the scripts' output is.

## Constraints & out of scope
- The only writer of spec and plan files is `scripts/gate`; the backlog entry for a defer (R3) is
  the one file the extension writes itself, appended in the backlog's own format, and shown
  before it is written.
- Reports are not stored by the extension; a pasted report lives only in the open screen.
- Node is for building and testing only; doctor and selftest do not require it.
- Tests run without a VS Code instance: logic in pure modules with `node:test`; the VS Code layer
  by the human's run at SHIP.

## Acceptance criteria
- [x] AC-1 — the sidebar shows the groups, card badges, lines and waiting count that
  `scripts/status --json` gives for a fixture with a row at every stage; every card and
  **+ New work** are keyboard reachable buttons (unit tests on the view model and the HTML).
- [x] AC-2 — start: each kind builds its command from the description, `/analyze` for a new
  feature in strict mode; **Start in Claude Code** is offered only when `claude` is found; no file
  changes (unit tests; the human's run).
- [x] AC-3 — triage: the 0009 review and VERIFY reports in this repo's history split into their
  findings (id, severity, title, recommendation); a report the splitter cannot read leaves the
  hand-entry form, never a guessed finding (unit tests on real reports).
- [x] AC-4 — triage: Save stays disabled until every finding has a verdict, noise a rationale and
  defer a backlog entry; it builds exactly the `scripts/gate triage` arguments, and on a fixture
  repo leaves the same commit as the terminal call; a refusal writes nothing (unit + integration).
- [x] AC-5 — ship: criteria, proofs and the Definition of Done shown match the files; Ship runs
  `scripts/gate ship NNNN` and on a fixture repo leaves the same commit and move as the terminal
  call; at a stage other than SHIP no Ship is offered (unit + integration).
- [x] AC-6 — the approval panel: B-14–B-20 each have a test that fails on the old code; after a
  plan approval the plan's cards stay (unit tests).
- [x] AC-7 — on this machine the packaged `.vsix` installs, and a feature on a pilot copy goes
  from **+ New work** through both approvals, a triage and Ship on the screens; screenshots of
  every screen and state, judged by the human at SHIP.
- [x] AC-8 — `./scripts/selftest` and `./scripts/doctor --strict` stay green; CI runs the
  extension's tests; README, `docs/commands.md`, `extensions/vscode/README.md`, CHANGELOG v1.28
  and `.anew-version` v1.28.

## Definition of Done
- [x] Every acceptance criterion mapped to proof (test or reproducible observation)
- [x] `scripts/check` green (here: doctor --strict + selftest + the extension's `npm test`)
- [x] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [x] Docs updated (README, `docs/commands.md`, CHANGELOG, `extensions/vscode/README.md`)
- [x] Spec moved to `.anew-dev/done/`

## Self-critique (approved 2026-11-17)
- **G-1 — triage reads a pasted report.** Reports live in the chat; no file holds them (0009 G-2).
  Recommendation: paste and split, with hand entry as the fallback — no protocol change. The
  alternative, `/review` and `/verify` writing their report to a file, changes the template for
  every user and belongs in its own spec if the paste proves clumsy.
- **G-2 — starting work opens the agent, it does not drive it.** Recommendation: a new terminal
  running `claude "<command>"` — the session is the human's, fresh, and stops at the first gate
  as always; Copy for Copilot, Cursor and Codex. The extension never answers a gate for the agent.
- **G-3 — after Ship: the PR.** gate's ship stops before the PR ("the PR, the merge and the tag
  stay with you"); the mockup shows "Ship and open PR". Recommendation: after a written ship, a
  **Push and open PR** button that runs `git push -u` and `gh pr create --fill` for the current
  branch, offered only when `gh` is signed in, after a confirmation that names the branch and the
  remote; otherwise the two commands with Copy. Merge stays on GitHub, as the mockup says.
- **G-4 — the sidebar becomes a webview.** 0009 kept the native tree for accessibility; the
  mockup's cards need a webview. Recommendation: the webview view, with the accessibility rules
  above tested on its HTML; the tree is dropped (two lists would disagree).
- **G-5 — ship has no tick boxes** (0009 G-4, approved): each criterion is shown with its proof;
  the mockup's "tick what you have seen" is not written anywhere. Recommendation: keep it — one
  Ship button, after reading.
- **G-6 — size.** Four screens and the panel fixes are more than one capability. Recommendation:
  one spec, because the screens share the sidebar, the state model and the release, and the
  human asked for the whole process at once; the plan builds it in commit-sized steps, one screen
  each, so review can follow. The alternative is 0010 (sidebar, start) and 0011 (triage, ship).
