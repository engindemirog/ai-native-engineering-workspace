# ANEW-0010 — The template's decisions live in their own namespace

- Status: Accepted
- Date: 2026-10-19

## Context
ANEW recorded its own design decisions as ADR 0001–0009 in `docs/decisions/`, the same folder
and number range a project uses for its own decisions. A project derived from the template
starts writing its ADRs there too, so every template release that adds a decision collides with
one of the project's: a field report found the template's ADR 0009 already taken in the project
by an unrelated decision, and the template's had to be renumbered 0012 by hand. The collision
recurs with every release that brings a decision.

## Decision
The template's decisions live in `docs/decisions/anew/` and are numbered `ANEW-NNNN`; the
project's decisions stay in `docs/decisions/` and number from 0001 on their own. A project never
edits or renumbers an `ANEW-` record — it takes new ones from upstream as they are; its own
decisions that refine or override one say so and link it.

## Consequences
- Benefits: upgrades bring decisions without collisions; the reader sees at once which decisions
  are the workspace's and which are the project's; no renumbering, no source notes.
- Costs: one move of nine accepted records (an editorial change, recorded with a `Revised:` line
  each); projects that already copied 0001–0009 into their own range move them once
  (CHANGELOG v1.13); two folders to look in.

## Alternatives considered
- Keep one range and have the template start high (e.g. 9000+): still one folder mixing two
  owners, and a project could reach the range.
- Leave the numbers and let projects renumber on upgrade: the status quo the field report
  describes — manual, repeated, and it breaks references.
- Keep the template's decisions out of derived projects entirely: loses the "why" behind the
  rules the project now follows.

## Revisit triggers
- A project needs to supersede an ANEW decision formally, not just refine it.
- More than one upstream (e.g. stack packs) starts shipping decisions.
