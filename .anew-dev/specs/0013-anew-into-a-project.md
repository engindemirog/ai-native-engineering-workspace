# Spec 0013 — ANEW into a project: add it to an existing one, or start a new one, from the screen

- Status: Approved
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0013-plan.md`
- Self-critique: done (G-1–G-5 accepted as recommended, Engin Demiroğ, 2026-11-18)
- Source: the human after 0012's SHIP: "projede anew yoksa githubdan anew entegre etmek, yepyeni
  proje oluşturmak, bootstrap yapılmamışsa bootstrap işini de uçtan uca ekrandan yapmak
  istiyorum" — the first two here; bootstrap on the screen is spec 0014.

## Intent
The extension works only where ANEW already is: it activates on `scripts/status`. A team that
wants ANEW in its project copies files by hand ("use this template, or copy the files into an
existing repo" — README), and nothing says which files are the project's and which are the
template's own (`.anew-dev/`, `extensions/`, its README, CHANGELOG, LICENSE).

This spec adds two ways in, both from the screen and both from the terminal:
- **Add ANEW to this project:** the folder open in VS Code gets the ANEW core from the latest
  release on GitHub — files already there are kept, nothing is committed;
- **New ANEW project:** a new folder with the core, a git repository and its first commit, opened
  in VS Code.

Then 0011's setup card goes on: install an adapter, then `/bootstrap`.

What is copied is decided by one new script in the template, `scripts/adopt <target>`, so the
screen and a terminal leave the same files (G-2).

Success means: a folder without ANEW, and an empty one, each reach the setup card from the
screen, and `./scripts/doctor` there reports no structure failure.

Deliberately not done:
- the LTS line from the screen (G-3);
- overwriting a file that exists, or merging into it (`.gitignore`, README) — kept and named;
- bootstrap itself (spec 0014).

## Requirements
1. **`scripts/adopt <target>`** (new): copies the ANEW core into `<target>` — `AGENTS.md`,
   `.anew-version`, `docs/`, `workflows/`, `prompts/`, `scripts/`, `adapters/`, `specs/`
   (templates, READMEs, `backlog.md`), `.gitattributes`, `.gitignore`,
   `.github/workflows/check.yml`, `.github/pull_request_template.md`, and a short `README.md` when
   the target has none (G-4). Never the template's own: `.anew-dev/`, `extensions/`, its
   README, `CHANGELOG.md`, `LICENSE`, `.claude/`. A file that exists is kept and named
   (`kept   <path> (exists)`), as `scripts/init` does; no `--force`. It writes no git state.
2. **`check.yml` works without the extension:** its `extension` job runs only where
   `extensions/vscode/` exists, so an adopted project's CI is green before bootstrap.
3. **The extension activates in every folder.** Without ANEW the ANEW view shows **Add ANEW to
   this project** and **New ANEW project**; with no folder open, **New ANEW project**.
4. **The version:** the latest release on GitHub (`releases/latest` of the template repository,
   setting `anew.templateRepository`, default the official one), fetched with
   `git clone --depth 1 --branch <tag>` into a temporary folder that is removed afterwards.
5. **Add:** a confirmation naming the folder, the version and "files that exist are kept; nothing
   is committed"; then `<template>/scripts/adopt <folder>`; its output as it is; the screens of
   0010–0012 start in the same window.
6. **New:** a parent folder and a name (a new or empty folder); `git init`, `scripts/adopt`, one
   commit `chore: ANEW <tag>` with the scripts executable in the index (G-5); the folder opens.
7. **States** as in 0011: running (controls disabled), done, refused (exit code and output, no
   claim), no git, no network, no POSIX shell.
8. **Release:** ANEW v1.30; extension 0.4.0, the `.vsix` on the GitHub release.

## User experience
- **Design reference:** the 0010–0012 screens; VS Code's own welcome view for the two buttons.
- **Accessibility:** real buttons; the confirmation is VS Code's modal; results with
  `role=status` / `alert`.
- **Language:** English, as the scripts' output is.

## Constraints & out of scope
- The extension writes no ANEW file itself: `scripts/adopt` does; git writes the new project's
  repository and commit.
- Network only to fetch the release (the GitHub API and `git clone`); nothing else is sent.
- Tests run without a VS Code instance and without the network: the clone from a local fixture
  repository (`file://`); the VS Code layer by the human's run at SHIP.

## Acceptance criteria
- [ ] AC-1 — `scripts/adopt` into an empty folder writes exactly the core list, and doctor there
  has no structure failure; into a folder with files it keeps every one and names it; the
  template's own files are never written; no git state changes (selftest).
- [ ] AC-2 — `check.yml`'s `extension` job is guarded by `extensions/vscode/` (selftest).
- [ ] AC-3 — without ANEW the view offers Add and New; the tag read from a `releases/latest`
  answer, the clone and adopt arguments, the confirmation's text (unit tests).
- [ ] AC-4 — Add and New against a local fixture release leave the same files as the terminal
  calls; New's commit holds the scripts as `100755` (integration).
- [ ] AC-5 — on this machine the packaged `.vsix`: a folder without ANEW gets it from the screen,
  a new project is created and opened, and each reaches the setup card; judged by the human at
  SHIP.
- [ ] AC-6 — `./scripts/selftest` and `./scripts/doctor --strict` stay green; CI runs the
  extension's tests; README, `docs/commands.md` (`scripts/adopt`, §F), `extensions/vscode/README.md`,
  CHANGELOG v1.30 and `.anew-version` v1.30.

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green (here: doctor --strict + selftest + the extension's `npm test`)
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [ ] Docs updated (README, `docs/commands.md`, CHANGELOG, `extensions/vscode/README.md`)
- [ ] Spec moved to `.anew-dev/done/`

## Self-critique (approved 2026-11-18)
- **G-1 — two specs.** Adding ANEW is a file copy; bootstrap is the agent's interview.
  Recommendation: this spec for the copy, 0014 for bootstrap, each shipped on its own.
- **G-2 — the list lives in the template, in `scripts/adopt`.** Embedded in the extension it would
  drift from the template it copies. Recommendation: the extension runs the downloaded
  template's own `scripts/adopt`; terminal users run the same script; a selftest scenario runs
  doctor on an adopted folder, so the list cannot fall behind doctor's required files.
- **G-3 — the latest release only.** The screens need the current scripts (`status --json`,
  `gate`); a v1.24.x copy lacks them. Recommendation: the LTS line stays a terminal clone of its
  tag (README, Versions and support); the setting lets a team point at its own fork.
- **G-4 — README.** Doctor requires a `README.md`; the template's README describes ANEW, not the
  project. Recommendation: a project that has one keeps it; one that has none gets three lines (the
  folder's name, "Built with ANEW <tag> — the rules are in AGENTS.md").
- **G-5 — the new project's first commit.** `gate` and `status` need a repository with history;
  on Windows git records the scripts without their executable bit, and CI then fails on
  `./scripts/doctor`. Recommendation: the new project's commit adds the scripts with
  `--chmod=+x`; an existing project gets no commit (the commit is the team's, as 0011 G-5), and
  adopt's output names the same `git add --chmod=+x` line for it.
