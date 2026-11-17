Review round 1 · fix rounds so far: 0

Scope: `git diff ba7cd3c..HEAD` on feature/0007-gate, reviewed against `.anew-dev/specs/0007-gate.md` and `.anew-dev/plans/0007-plan.md` (A-1 included). The full selftest result is cited from the plan's Build evidence (440/0 @53299c7), not re-run. I ran only the gate section as a scratch copy (`...\scratchpad\review7\gatetest.sh`): 75 passed, 0 failed on the current scripts/gate. I also ran four mutants and probed with small temp repos (`...\scratchpad\review7\w`). Nothing in the repo was edited or committed.

## Findings

**H-1 (High) — ship does not tick mini-spec criteria, so doctor --strict fails right after a gate ship.** `scripts/gate:190-193`
- The tick rule only covers `- [ ] ` lines under `## Acceptance criteria` and `## Definition of Done`.
- `specs/TEMPLATE-mini.md` keeps its criteria as `CB-n` under `## Changed behavior` and `PB-n` under `## Preserved behavior`.
- Reproduced: I took a mini spec to SHIP and ran `gate ship 0001`. It exited 0 and committed, but CB-1..3 and PB-1..2 stayed `- [ ]`. Then `ANEW_BASE_REF=<pre-ship> doctor --strict` gave five `FAIL unchecked criterion in a new ship … CB-1` (and the others).
- This breaks AC-5 ("doctor --strict stays green") for every mini spec. commands.md says "ticks every criterion not moved out", which is also not true here.
- Recommendation: tick by doctor's own definition, i.e. any line whose first checkbox is followed by an `AC-`/`CB-`/`PB-` id, whatever the section. Add a selftest scenario that ships a mini spec and runs doctor on it.

**M-1 (Medium) — ship's "moved out" test differs from doctor's, so a gate ship can still fail doctor.** `scripts/gate:192`
- Gate treats any `~~` on the line as moved out. Doctor treats a line as moved out only when the id is struck and a `→ moved to` target follows it (`scripts/doctor:420-431`).
- Example 1: `- [ ] AC-4 — the ~~old~~ new total` (strike-through used in the prose) stays unticked, and doctor FAILs it.
- Example 2: `- [ ] ~~AC-2~~` with no marker stays unticked, and doctor FAILs it.
- Example 3: other forms doctor counts, such as `* [ ] AC-n`, `- [] AC-n` or an indented bullet, are never ticked. I confirmed the `~~` and star-bullet cases in the probe.
- Recommendation: use doctor's rule, i.e. moved out = struck id plus a `→ moved to`/`-> moved to` target. If a line is struck but has no valid marker, ship should refuse before writing anything.

**M-2 (Medium) — a failed commit leaves a half-written decision, and then gate reports the spec as shipped.** `scripts/gate:128-129, 196-201`
- Gate writes the files, runs `git add` and `git mv`, and only then commits. If the commit fails (pre-commit hook, gpg signing, etc.), it only prints `gate: git commit failed` (exit 1).
- Reproduced with a pre-commit hook that exits 1:
  - the index was left with `R specs/active/0001-mini.md -> specs/done/0001-mini.md` and `M specs/plans/0001-plan.md`;
  - a second `gate ship 0001` refused with "0001 is shipped (specs/done/)".
- The same applies to approve-*/triage: the file stays modified and staged. commands.md says "Refusal: … nothing is written", which this contradicts.
- Recommendation: if the commit fails, restore the files to their HEAD state (`git reset -q -- <paths>`, plus undoing the move and the files from HEAD) and say so. At minimum, print what was left behind and how to undo it. Add a selftest that uses a failing hook.

**L-1 (Low) — approve-plan writes in two steps, and the second can fail after the first has written.** `scripts/gate:150-151`
- Reproduced: on a plan with no `- Approved by / on:` line, gate refused (exit 1, "could not write …"). But the plan was already left as `M` with `Status: Approved`.
- Recommendation: before writing, check that both labels exist, or pipe both set_line passes into a single write.

**L-2 (Low) — CRLF files are rewritten as LF.** `scripts/gate:97, 158, 168`
- `tr -d '\r'` normalizes the whole file. Reproduced: approve-spec on a CRLF spec made a commit showing 61+/61-.
- Ship is inconsistent: the plan's `Spec:` rewrite (line 197) keeps CR, while the spec's tick goes through set_line and loses it.
- Status and doctor are not affected, but the diff noise and history churn are real.
- Recommendation: detect a CRLF file and keep its line endings, or document the normalization.

**L-3 (Low) — Requirement 4 / AC-4 tests miss the line-break and tab checks, and the "approval not committed" ship refusal is untested.** `scripts/selftest:906-920, 960-975`
Mutants run on temp copies, against the 75-test gate section:
- **m1** (drop the `$NL`/`$TAB` input check): 75/0. The mutant survived.
- **m2** (drop the `uncommitted` refusal on ship, gate:184): 75/0. The mutant survived.
- **m3** (drop `had_edits` on ship): 75/0. The mutant survived; AC-6's "edits named" is only tested on approve-plan.
- **m4** (tick struck criteria): 74/1. Caught.

Recommendation: add one scenario each for a finding containing a newline, a tab-only note, ship with an uncommitted approval, and ship with uncommitted spec edits named in the output.

**L-4 (Low) — the ship rewrite of the plan's Spec line passes the path through `awk -v`.** `scripts/gate:197`
- `awk -v` processes escapes, so a filename containing `\` would be mangled. Every other value in the script goes through ENVIRON.
- The plan's Spec line is also left unchanged, with no warning, when its form differs from `specs/active/<file>`.
- Recommendation: pass the paths through ENVIRON, and warn when no Spec line was rewritten.

**Info-1** — The EXIT trap at gate:115 does not run on INT under dash, so a `*.gate.$$` temp file can be left behind. Recommendation: `trap … EXIT INT TERM`.

**Info-2** — The plan says `git diff --quiet` detects uncommitted edits; the code uses `git status --porcelain`. That is better (it also catches untracked and staged files). Note it in the plan if you wish.

**Info-3** — After a same-day re-approval, a further drift on the same day has no gate remedy: gate refuses, and status's advice says to add `(re-approved)`. This is a pre-existing gap in the protocol, so I recommend a backlog entry rather than a fix here.

## Checked and clean
- **Input robustness:** the triage table and set_line values go through ENVIRON, so there is no awk escape processing. Probed with `\\`, a literal `\n`, `%s`, `"`, `&`, `$HOME`, backticks and ü/Ä (in the finding, the note and the git user name). The bytes were preserved and status read the round.
- **Checks before writing:** all triage checks run before any file is read or written. The AC-4 test checks the plan cksum, the index and the commit count.
- **Template forms:**
  - approve-plan on the plan template's spanning comment gives `cur` "—", drops the comment up to `-->`, and status reads BUILD.
  - The spec template's Status comment sits on the next line and is kept.
  - The Triage template comment's example heading is indented, so it does not count toward the round number.
  - The table is appended after the comment, inside `## Triage`, or before the next `##` heading.
- **Status JSON row extraction:** `{"spec":"NNNN",` and `},{"spec":` cannot occur inside a jstr-escaped string. jget keys are unique. Neither the `"warnings":[]` check nor the "not committed yet" check can be matched by another field or by the top-level notes. Stage comes only from status, so gate cannot disagree with it.
- **Commit scope:** the pathspec commit with the rename records `{active => done}`, and an unrelated staged file stays staged (tested). `had_edits` runs before the writes.
- **Status change (B-11):** the investigate marker is gathered before the stage rules and placed after the unknown-heading rule. A-1 covers triage at "investigate open".
- **Portability:** no `local`, `[[`, `mapfile` or `sed -i` in the scripts. `grep -o` and `tr '\t'` are available on BSD, GNU and Git Bash.
- **Plan conformance:** the changed files match the plan's list. Docs, CHANGELOG v1.26, `.anew-version` and B-11 were updated.
- **Security and performance:** nothing to report.

Verdict: not clean — 1 High (H-1), 2 Medium (M-1, M-2), 4 Low, 3 Info. H-1 and M-1 break AC-5 for mini specs and for some criterion forms; M-2 contradicts the documented "nothing is written" refusal.

Next: TRIAGE — human
