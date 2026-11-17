# ANEW for VS Code

A screen over two ANEW scripts, inside VS Code:

- **The work list** (the ANEW view in the activity bar): every spec from `scripts/status --json`,
  grouped as *your turn* · *in progress* · *shipped*, with its stage and warnings. The status bar
  shows how many decisions wait for you.
- **Spec and plan approval:** opening a spec at ANALYZE or a plan at PLAN (human) shows the file's
  summary. **Approve** appears only after **Open the full file** has opened it, and runs
  `scripts/gate approve-spec NNNN` or `scripts/gate approve-plan NNNN`; gate's answer is shown as
  it is. **Request changes** opens the file and writes nothing.

Triage, ship and starting new work come in a later version; until then those rows open the file,
and `scripts/gate` does the rest in a terminal (`docs/commands.md`).

## What it reads and writes

It reads what `scripts/status --json` and the spec and plan files say, and writes nothing itself:
every decision is one `scripts/gate` call, the same one you would type. It keeps no state of its
own; a team without it follows the same process by hand.

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
