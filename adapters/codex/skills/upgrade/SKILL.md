---
name: upgrade
description: "ANEW Upgrade ANEW in this project to a newer release, keeping what the project made of it. Run explicitly: $upgrade."
---
Read AGENTS.md, then execute workflows/upgrade.md using the prompt in prompts/upgrade.md.
The two releases are under .git/anew-upgrade/; work on chore/anew-<tag> and the "merge" lines of
scripts/upgrade. Every question with your recommendation (proposal rule), one decision per
message. Finish with ./scripts/doctor and ./scripts/selftest green, .anew-version written last,
one commit; never push or merge.
The new tag is the text typed after $upgrade.
