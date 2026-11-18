# Prompt: Upgrade

```
Upgrade this project's ANEW to <new tag> (workflows/upgrade.md). Read AGENTS.md first.

INPUTS: the base release (the tag in .anew-version) and the new one, cloned under
.git/anew-upgrade/<tag>/; the answer of <new>/scripts/upgrade <base> ., kept in
.git/anew-upgrade/upgrade-<new tag>.out — read the "merge" lines there (do not run the script
again: it refuses the uncommitted tree it left). No such file → stop and ask me to run Fetch again (on a clean tree:
the script's earlier changes discarded or stashed first). We are
on chore/anew-<new tag>; if not, stop and say so.

TASK, oldest first, for every entry of <new>/CHANGELOG.md above the base:
1. Read its "Upgrading" section: a behavior list per changed script, a one-line intent per
   changed document, new files.
2. Each "merge" path: apply that entry's behavior list (a script the project extended — never a
   plain copy, which would delete the extension) or intent (a document — in the project's own
   words and in the docs language of AGENTS.md; protocol fields stay English). Compare
   <base>/<path> with <new>/<path> to see exactly what changed upstream.
3. New docs/decisions/anew/ANEW-*.md files are taken as they are; the project's own ADRs are
   never renumbered.
4. A "kept" path needs nothing unless an entry names it; files the script replaced, added or
   removed are done.

BOUNDARIES: AGENTS.md's invariant rules stay verbatim (take the new release's wording of them);
the project's own content in docs/ stays its own; no application code; nothing outside the
ANEW files the script listed and the entries name.

EVIDENCE: ./scripts/doctor and ./scripts/selftest green; a table: path · what changed upstream ·
what you did. Then write <new tag> into .anew-version and make one commit on chore/anew-<new tag>:
"chore: ANEW <base> → <new tag>".

APPROVAL: every question to me with your recommendation (proposal rule); one decision per
message. A change you cannot apply without guessing → stop with the matching ramp
(prompts/recovery/ambiguity.md, or spec-change.md when it would change a rule). Never push or
merge: the team reviews the PR.
```
