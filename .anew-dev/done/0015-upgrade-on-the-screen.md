# Spec 0015 — ANEW upgraded on the screen: the newer release, the unchanged files, the agent for the rest, the merge

- Status: Shipped
- Mode: lite (ANEW's own development)
- Plan: `.anew-dev/plans/0015-plan.md`
- Self-critique: done (G-1–G-7 accepted as recommended, Engin Demiroğ, 2026-11-18)
- Source: the human after 0014's SHIP, on the one screen gap named — ANEW upgraded in a project:
  "Başla"

## Intent
0013 puts ANEW into a project; 0014 bootstraps it. From then on the project keeps the version it
started with: an upgrade is done by hand, following CHANGELOG's "How to upgrade" — the base from
`.anew-version`, every entry above it read, unchanged scripts copied, extended ones and translated
or bootstrapped documents given the behavior lists and intents, the new version written. No
screen says a newer release exists, and the work is long and easy to get wrong.

This spec carries an upgrade on the screen, the way 0014 carries bootstrap:
- **what is available:** the project's base and the newer release it can move to, with the
  CHANGELOG headings in between;
- **the mechanical part done by a script:** every ANEW file still identical to the base release's
  copy replaced by the new one, new files added — nothing the project changed is touched;
- **the rest by the agent:** `/upgrade`, which applies the behavior lists and intents to the files
  the project changed, on `chore/anew-<tag>`;
- **the check and the merge:** doctor and selftest run from the screen; push and open the PR —
  never the merge.

Success means: a bootstrapped project sees "v1.31 → v1.32 available", starts the upgrade from the
screen, and ends with a PR of `chore/anew-v1.32` whose doctor and selftest are green, having typed
into the agent only answers to its questions.

Deliberately not done:
- the extension updating itself (VS Code installs a `.vsix`; out of scope);
- the screen merging, or upgrading a project that is not bootstrapped (bootstrap first, 0014);
- an upgrade of ANEW's own template repository (it is the source).

## Requirements
1. **Available:** in a bootstrapped project, the Start screen reads `.anew-version` (the base) and
   the release to offer (G-3); when it is newer, an **Upgrade** section names both and lists the
   CHANGELOG headings between them. `.anew-version` missing or not a release tag: the section says
   so and how to fix it (G-2); nothing is offered.
2. **The two releases, fetched:** after a confirmation naming the repository and both tags, the
   base and the new release are cloned (shallow, by tag) into `.git/anew-upgrade/<tag>/` (G-5) —
   the same network reach as 0013, nothing sent.
3. **`scripts/upgrade <base-dir> <new-dir>`** (G-1), run in the project on `chore/anew-<tag>`
   (created from the current branch): over 0013's core set (`scripts/adopt`'s files and folders)
   and the installed adapters' files (as `scripts/init` places them):
   - a file identical to the base's copy and changed in the new → replaced;
   - a file new in the new release → added; one the new release removed and the project never
     changed → removed;
   - a file the project changed (differs from the base's copy) that the new release also changed →
     left as it is and listed `merge <path>` for the agent;
   - nothing committed; its output lists each path with what it did, and `.anew-version` is not
     written (the agent writes it last, as step 6 of "How to upgrade").
   It refuses outside a configured project, from a dirty working tree, or when a directory is not
   an ANEW release of the tag it claims.
4. **`/upgrade`** (G-4) in `prompts/upgrade.md`, `workflows/upgrade.md` and every adapter's
   command (Claude Code, Copilot, Cursor, Codex): from the two release folders and the script's
   `merge` list, apply each CHANGELOG entry above the base, oldest first — behavior lists to the
   changed scripts, intents to the changed documents in the project's own words and language;
   take new `ANEW-*` decisions as they are; write `.anew-version`; commit on `chore/anew-<tag>`.
   Every question to the human with a recommendation; it stops on a conflict it cannot resolve
   (the recovery ramp).
5. **The phases** read from files and git: available · in the agent · upgraded (`.anew-version` on
   `chore/anew-<tag>` says the new tag) · verified (doctor and selftest green on these files, run
   from the screen) · merged. Never cached.
6. **Verified:** **Run checks** runs `./scripts/doctor` and `./scripts/selftest` (read-only), their
   result lines and FAIL lines shown; the screen says selftest takes minutes.
7. **Merged:** as 0014: **Push and open PR** of `chore/anew-<tag>` after a confirmation naming the
   branch and the remote, or the commands to copy; never the merge. Once merged, the release
   folders under `.git/anew-upgrade/` are removed and the section is gone.
8. **Release:** ANEW v1.32; extension 0.6.0, the `.vsix` on the GitHub release.

## User experience
- **Design reference:** 0014's bootstrap section: the phase strip, one line per phase, the step it
  waits for.
- **Accessibility:** buttons and results as in 0014 (`role=status` / `alert`).
- **Language:** English, as the scripts' output is.

## Constraints & out of scope
- The extension writes no project file itself: `scripts/upgrade` and the agent write; git and gh
  push and open the PR after the human's confirmation.
- `scripts/upgrade` is POSIX sh, tested in `scripts/selftest` like `scripts/adopt`.
- No rule changes: AGENTS.md's invariants, the gates and `docs/` the project wrote stay its own.
- Tests run without a VS Code instance: logic in pure modules with `node:test`; the script and git
  against fixture repositories; the VS Code layer by the human's run at SHIP.

## Acceptance criteria
- [x] AC-1 — `scripts/upgrade` on fixtures: unchanged files replaced, new added, removed removed,
  changed-on-both listed `merge`, project-only changes untouched, installed adapter files
  included, `.anew-version` not written, the refusals (selftest).
- [x] AC-2 — the offer: base and release read, the headings between them, the LTS rule (G-3),
  `.anew-version` missing or unknown (unit).
- [x] AC-3 — `prompts/upgrade.md`, `workflows/upgrade.md` and each adapter's `/upgrade` exist and
  agree (unit test reading the files; doctor's adapter parity stays green).
- [x] AC-4 — the phases for: a newer release (available), started (in the agent), `.anew-version`
  at the new tag on `chore/anew-<tag>` (upgraded), checks green (verified), merged — through a
  squash merge (unit + integration on fixture repos).
- [x] AC-5 — the merge step offered only for an unmerged `chore/anew-<tag>`; no merge is ever run;
  the release folders removed once merged (unit + integration).
- [ ] AC-6 — on this machine the packaged `.vsix`: a project on an older release (one made with
  0013 from v1.31) is upgraded to v1.32 from the screen — fetched, the script run, `/upgrade`
  done, checks green, the PR opened; judged by the human at SHIP. Run on the published v1.32
  right after its release (plan, Risk 1): the verdict is recorded in the plan's Build evidence.
- [x] AC-7 — `./scripts/selftest` and `./scripts/doctor --strict` stay green; CI runs the
  extension's tests; README, `docs/commands.md` (`/upgrade`, `scripts/upgrade`, §F),
  `extensions/vscode/README.md`, CHANGELOG v1.32 ("How to upgrade" names the screen and the
  script) and `.anew-version` v1.32.

## Definition of Done
- [x] Every acceptance criterion mapped to proof (test or reproducible observation)
- [x] `scripts/check` green (here: doctor --strict + selftest + the extension's `npm test`)
- [x] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `.anew-dev/backlog.md`
- [x] Docs updated (README, `docs/commands.md`, CHANGELOG, `extensions/vscode/README.md`)
- [x] Spec moved to `.anew-dev/done/`

## Self-critique (approved 2026-11-18)
- **G-1 — the unchanged files by a script, not the agent.** A file identical to the base release's
  copy can be replaced without judgement; the agent would spend tokens and could slip.
  Recommendation: `scripts/upgrade` compares each file with the base's copy and does that part;
  the agent gets only the `merge` list. It is testable in selftest, and usable without the screen.
- **G-2 — the base is never guessed.** Without `.anew-version` (or with a tag that has no release)
  there is nothing to compare against. Recommendation: the screen refuses and says to write the
  version (as doctor's warning says); no guessing from the files.
- **G-3 — which release is offered.** A project on the LTS line (`v1.24.x`) should not be moved off
  it unasked. Recommendation: on `v1.24.x`, offer the newest `v1.24.x` and name the latest release
  as the other choice; otherwise offer the latest release (`releases/latest`, as 0013).
- **G-4 — `/upgrade` is a chore like bootstrap, not a feature.** It changes ANEW's process files,
  not the application; CHANGELOG's entries are its spec. Recommendation: no spec file — a branch
  `chore/anew-<tag>`, checks green, a PR the team reviews and merges, as bootstrap.
- **G-5 — where the releases live.** The agent needs both to read; they must never be committed.
  Recommendation: `.git/anew-upgrade/<tag>/` — untracked by construction, no `.gitignore` change
  (which would itself need an upgrade), removed once merged.
- **G-6 — never the merge.** As 0010 and 0014: push and the PR after a confirmation; the merge
  stays with the team.
- **G-7 — the checks.** An upgrade touches `scripts/`; doctor alone does not exercise them.
  Recommendation: verified needs doctor and selftest green (CHANGELOG's step 3 already names
  selftest); the screen says selftest takes minutes.
