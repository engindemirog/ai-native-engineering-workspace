# ANEW for VS Code

The human's part of the ANEW process on a screen, inside VS Code — over two scripts,
`scripts/status --json` (what it shows) and `scripts/gate` (what it writes):

- **The sidebar** (the ANEW view in the activity bar): **+ New work**, then every spec as a card,
  grouped as *your turn* · *in progress* · *shipped*, each naming the decision it waits for. The
  view's badge and the status bar show how many decisions wait for you.
- **Start new work:** pick the kind (new feature, change, bug fix, refactor), say what you want;
  the command for the agent is shown first. **Start in Claude Code** opens a fresh session with it
  in a new terminal (when `claude` is on PATH); **Copy command** for any other agent — the command
  in the form the agent you pick runs it (`$new-feature` for Codex).
- **Setup** (on the start screen; a sidebar card while something is missing): which adapters are
  installed — Claude Code, GitHub Copilot, Cursor, Codex — read as `scripts/doctor` reads them;
  **Install** a missing one, after a confirmation naming the files: `./scripts/init <tool>`, never
  `--force` (existing files are kept; nothing is committed). While AGENTS.md is not configured, the
  one work offered is `/bootstrap`.
- **Spec and plan approval:** the file as cards (intent and criteria; files, criterion ↔ test,
  risks). **Approve** appears only after **Open the full file** has opened it, and runs
  `scripts/gate approve-spec|approve-plan NNNN`. **Request changes** opens the file.
- **Triage** (a row at REVIEW or VERIFY): paste the reviewer's report; it is split into findings,
  each decided real · noise · defer · investigate — none chosen for you. A missed finding is added
  by hand. The table is previewed, then written by `scripts/gate triage`.
- **Ship** (a row at SHIP): each criterion with its proof from the plan, the Definition of Done,
  the evidence, the triage rounds; **Ship** runs `scripts/gate ship NNNN`. Then **Push and open
  PR**, after a confirmation that names the branch and the remote — or the commands to copy. The
  merge stays on GitHub.

- **The agent's next step:** a row that waits for the agent (PLAN, BUILD, a fix round, REVIEW,
  VERIFY) shows the command that continues it — `/build NNNN`, `/review NNNN`, … in the picked
  agent's form — with **Copy**, and **Continue in Claude Code** where Start is offered: a fresh
  session with the command. The chat that asked for a decision taken on the screen does not learn
  of it: tell it to go on, or continue in a new session.

gate's answer is shown as it is on every screen, with the next step.

## What it reads and writes

It reads what `scripts/status --json` and the spec and plan files say. Every decision is one
`scripts/gate` call, every install one `scripts/init` call, the same one you would type; the only file it writes itself is the backlog
entry for a deferred finding (shown in the preview, left for you to commit). A pasted report lives
only in the open screen. It keeps no state of its own; a team without it follows the same process
by hand.

## Install

From the GitHub release: download `anew-<version>.vsix`, then in VS Code: Extensions view → `…` →
**Install from VSIX…**. It activates in a workspace whose root holds `scripts/status` and
`AGENTS.md`, and stays silent anywhere else.

## The shell

The scripts are POSIX sh. On Linux and macOS the extension uses `sh`; on Windows, Git for
Windows' `bash.exe`, found next to the `git` on `PATH`. The setting `anew.shell` names another
one; it is read from user or machine settings only, never from a workspace's own settings. In
Restricted Mode (an untrusted workspace) the extension stays off. Without a shell, the view says so
and nothing is read or written.

## Building it

Node 24 (only to build and test; using ANEW never needs Node):

```sh
npm ci
npm test          # typecheck + node:test; the integration tests run the real scripts
npm run package   # → anew-<version>.vsix
```
