# .anew-dev/

ANEW's own development records: the specs and plans that change the template itself.
They follow the same rules as a project's `specs/` (`specs/TEMPLATE.md`, `specs/plans/TEMPLATE.md`,
AGENTS.md invariant rules) but live here so the template's `specs/` stays empty for its users.

- `specs/NNNN-<name>.md` — one per piece of work; numbering is shared with `plans/`.
- `plans/NNNN-plan.md` — the approved plan, `Approved by / on` is the gate record.
- Shipped specs move to `done/` and are never edited again.
- `docs/testing.md` rule 6 (a ship commit touching only `specs/` inherits the full green) applies
  here to `.anew-dev/`: `git diff --name-only <green-sha> HEAD -- . ':!.anew-dev/'` prints nothing.

- doctor scans `specs/`, not `.anew-dev/`: ANEW's own ships are checked by the reviewer and
  VERIFY against the same rules (ticked or moved-out criteria, open targets), not by doctor. In rule 6
  doctor's judgment of the ship is replaced by this: before the ship commit, the human (or a
  reviewer on the ship diff) checks the `done/` file against those rules, with the diff shown;
  only then does the `.anew-dev/` ship commit inherit the full green.

## Releases and the LTS line

- Every release is an annotated tag on the commit that ships it (message: its CHANGELOG heading),
  pushed by name; its GitHub release carries the CHANGELOG entry.
- `lts/1.24` starts at the v1.24.1 tag and takes fixes only (`README.md`, Versions and support).
- A fix lands on `main` first, through its own spec. It reaches `lts/1.24` by
  `git cherry-pick -x <main commit>` in a PR with CI green. Its `.anew-dev/` hunks are dropped;
  its `CHANGELOG.md` and `.anew-version` hunks are replaced by the branch's own `v1.24.<n+1>`
  entry and marker. After merge the tag `v1.24.<n+1>`; then `main`'s entry for that fix gets
  "also in v1.24.<n+1>".
- If the fix's other files do not apply cleanly, it is redone on the branch, never forced. Every
  fix on `lts/1.24` names its `main` commit (`cherry picked from`; a redone fix writes that line
  by hand): no fix reaches the line that `main` does not already hold.

Template users: this folder is not part of your workspace — delete it after you create your repo.
