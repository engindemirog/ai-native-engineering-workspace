# ADR 0002 — Segments always stop; the chainer flows only as far as the mode allows

- Status: Accepted
- Date: 2026-09-25

## Context
A single "do the whole feature" command is convenient for a solo developer, but in a team it
collapses the roles the workflow relies on: the session that wrote the spec goes on to plan and
build it, and the human is asked for approval by an agent that already has the next step drafted.
The invariant "the producer never verifies its own work" needs a mechanical seam between stages,
not a reminder. At the same time, forcing five separate sessions on a solo developer doing a
low-risk change is ceremony without a payoff.

## Decision
Each stage of feature development is a **segment** (ANALYZE, PLAN, BUILD, REVIEW, VERIFY,
`workflows/segments.md`) that checks an entry condition from files, does its work, and **always
stops** at a handoff written to files (spec `Status`, plan `Approved by / on`). `/new-feature` is
a **chainer**: in `lite` mode it runs the segments in order and asks at every gate; in `strict`
mode it refuses and redirects to the segment commands, one role per session. Spec approval is
asked in every mode because it is PLAN's entry condition; in lite it is a light yes/no.

## Consequences
- Benefits: role separation is a property of the files, not of the agent's memory; a new
  session can pick up at any gate; `scripts/doctor` can verify the gates from the status fields,
  so they hold in CI regardless of tool.
- Costs: more commands to learn; in strict mode a feature costs at least five sessions; the
  handoff summaries add some repetition. Lite-mode users pay one extra yes/no (spec approval).

## Alternatives considered
- One chained command with mode-dependent behavior only: fewer commands, but the seam between
  roles would still live inside one session; rejected.
- Segment commands only, no chainer: cleanest, but solo developers would drive five commands by
  hand for every small feature; rejected.

## Revisit triggers
- Tools offer reliable session-scoped role isolation natively (subagents with enforced context).
- Evidence that lite users skip `/new-feature` and run segments anyway (then drop the chainer),
  or that strict teams keep bypassing the segments (then the gates are wrong, not the users).
