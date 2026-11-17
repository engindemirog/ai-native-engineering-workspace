# Spec 0009 — the VS Code extension, part 1: the work list and the approvals

- Status: Shipped
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0009-plan.md`
- Self-critique: done (G-1–G-6 accepted, Engin Demiroğ, 2026-11-17)

## Intent
The human's part of ANEW is reading where each piece of work stands and making four decisions
(spec approval, plan approval, triage, ship). Since v1.25 and v1.26 both are terminal commands:
`scripts/status --json` reads, `scripts/gate` writes. The extension puts them on a screen inside
VS Code, following the approved mockup https://claude.ai/artifact/E8Qy6Eo3zRcxap5RZWd63X, so a
human who does not live in the terminal can follow the process without hand-editing a file.

It is a view over the files, nothing more: every value it shows comes from `scripts/status
--json` or the spec and plan files, and every decision it writes is one `scripts/gate` call.
It keeps no state of its own; a team without it follows the same process by hand.

This spec is part 1 (G-6): the work list, spec and plan approval, and the packaged extension.
Success means a human sees the work list and approves a spec or plan from the screen, and the
files afterwards are exactly what the same `scripts/gate` call in a terminal writes.

Deliberately not done:
- the triage, ship and start-new-work screens: spec 0010, on this base (G-6);
- running an agent; PRs, merges, pushes, tags;
- Marketplace publishing (a publisher account, outward-facing): a `.vsix` file on the release;
- other editors: VS Code forks may load the `.vsix`, untested;
- `.anew-dev/` (ANEW's own records, which status does not read).

## Requirements
1. **Where it lives:** `extensions/vscode/` in this repo (G-1). TypeScript compiled to one
   JavaScript file; no runtime dependencies beyond the VS Code API.
2. **Activation:** in a workspace whose root holds `scripts/status` and `AGENTS.md`. Anywhere else
   it stays inactive and shows nothing.
3. **The work list** (sidebar, mockup "Genel bakış"): from `scripts/status --json`, three groups —
   "your turn" (rows whose next step is the human's: spec approval, plan approval, triage, ship,
   unclear), "in progress" (the agent's), "shipped". Each row: number, name, stage; a row's
   warnings shown on it. A status bar item: how many decisions wait. It refreshes when a file
   under `specs/` changes and on a Refresh command; never on a timer.
4. **Approve spec / approve plan** (mockup main screen): a panel shows the summary read from the
   file (spec: intent and acceptance criteria; plan: files to change, criterion ↔ test map, risks
   with the recommendation). The approve button appears only after "Open the full file" has
   opened it in an editor; "Request changes" opens the file and writes nothing. Approve runs
   `scripts/gate approve-spec|approve-plan NNNN`. A row at triage or ship opens the file and says
   that its screen comes with 0010.
5. **gate's answer is shown as it is:** after a write the panel shows gate's one-line output; on
   exit 1 or 2 its message, unchanged, with nothing else written. The list refreshes.
6. **Shell:** the scripts run with `sh` (Linux, macOS) or Git for Windows' `bash.exe` (found
   from `git` on PATH, or the setting `anew.shell`). Without one, the panel says so and offers no
   write button.
7. **Release:** ANEW v1.27; the `.vsix` (extension 0.1.0) attached to the GitHub release; nothing
   to `lts/1.24`.

## User experience
- **Design reference:** the mockup's "Genel bakış ve plan onayı" screen (corrected: approve only
  after the full file is open).
- **States of a write:** idle; running (button disabled, "running gate…"); written (gate's line);
  refused (gate's message, exit code named); no shell (explained, no write button).
- **Accessibility:** native VS Code tree view for the list; the webview panel uses real buttons
  and links, keyboard reachable, VS Code theme colors (light, dark, high contrast).
- **Language:** English, as the scripts' output is (`docs/conventions.md`, protocol fields).

## Constraints & out of scope
- The extension never edits a spec or plan file itself; the only writer is `scripts/gate`.
- Summaries are read by the templates' headings; a file without them shows "open the file" only.
- Node is needed only to build and test the extension, never to use ANEW (G-5): doctor and
  selftest do not require it.
- Tests run without a VS Code instance (G-3): the logic sits in modules tested with `node:test`;
  the VS Code layer is thin and proven by AC-6's run.

## Acceptance criteria
- [x] AC-1 — the list groups, stages, warnings and waiting count match `scripts/status --json`
  for a fixture with a spec at every stage (unit tests on parsing and grouping, and one test that
  runs the real `scripts/status --json` on a fixture repo).
- [x] AC-2 — approve builds exactly `approve-spec NNNN` / `approve-plan NNNN` for gate; run
  against a fixture repo it leaves the same commit and file contents as the same call from a
  terminal; on a refusal the panel shows gate's message and nothing is written.
- [x] AC-3 — approve is not offered before the full file has been opened; a row at triage or ship
  offers no write.
- [x] AC-4 — the plan and spec summaries show the template sections; a file without them shows
  only "open the file".
- [x] AC-5 — outside an ANEW workspace the extension shows nothing; without a shell it offers no
  write.
- [x] AC-6 — on this machine (Windows, Git Bash) the packaged `.vsix` installs, and the list and
  both approvals work on a pilot copy; one screenshot per screen and state, judged by the human
  at SHIP.
- [x] AC-7 — `./scripts/selftest` and `./scripts/doctor --strict` stay green; CI runs the
  extension's tests; README and `docs/commands.md` name the extension; CHANGELOG v1.27 and
  `.anew-version` v1.27.

## Definition of Done
- [x] Every acceptance criterion mapped to proof (test or reproducible observation)
- [x] `scripts/check` green (here: doctor --strict + selftest + the extension's `npm test`)
- [x] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [x] Docs updated (README, `docs/commands.md`, CHANGELOG, `extensions/vscode/README.md`)
- [x] Spec moved to `.anew-dev/done/`

## Self-critique (approved 2026-11-17)
- **G-1 — in this repo**, `extensions/vscode/`: it reads status and gate output, which change
  with it; one CI, one release. Template users who don't want it delete `extensions/`.
- **G-2 — triage findings are pasted, not read** (0010): no file holds the reports today.
- **G-3 — tests without a VS Code instance**: `node:test` on the logic; the VS Code layer by
  AC-6's manual run with screenshots.
- **G-4 — no tick boxes on ship** (0010): criteria with proof, one Ship button.
- **G-5 — Node enters the repo** for the extension only; CI gets a separate job.
- **G-6 — split**: 0009 list + approvals + packaging; 0010 triage, ship, start.
