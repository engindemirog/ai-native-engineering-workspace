---
description: Independent review of the current change set against its spec
argument-hint: spec number or branch/diff reference
---
Delegate to the `reviewer` subagent: review the change set for $ARGUMENTS against its spec in
specs/active/, using prompts/review.md. You (the main session) must not review it yourself — the
producer never verifies its own work. Return the subagent's findings verbatim for my triage
(real / noise / investigate), with no softening or commentary.
