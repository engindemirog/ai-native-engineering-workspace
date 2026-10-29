# ANEW-0011 — ANEW assumes no tool; it runs what the project declares

- Status: Accepted
- Date: 2026-10-29

## Context
A field project (.NET modular monolith, Windows + Git Bash) found at the end of BUILD that its
container runtime was too old for its integration tests; the full profile could not run locally
and every full proof cost a push and a CI round. Nothing in ANEW asked about the environment.
The obvious fix — teach doctor about that runtime and its API version — would tie the core to
one tool, while projects use another runtime, a different toolchain, or none at all.

## Decision
ANEW knows no tool, runtime or version. Where it needs to know whether this machine can do
something, the project declares a command and ANEW runs it: `requires <step>: <command>` in
`scripts/check.conf`, exit 0 = met. check runs the profile's prerequisites before the first step
(unmet → red); doctor reports which profile this machine can run; bootstrap, plan and build show
that verdict at their gates; R-13 handles the gap. No ANEW script names a specific tool; examples
that touch one show alternatives side by side.

## Consequences
- Benefits: environment gaps surface at bootstrap or plan time, for any stack; the core stays
  language- and tool-agnostic (same reasoning as ANEW-0007).
- Costs: the project writes and maintains its prerequisite commands; ANEW cannot judge whether a
  command really tests what the step needs. doctor now runs project commands (side-effect free
  by contract, not by enforcement; no timeout — POSIX sh has no portable one).

## Alternatives considered
- Version requirements parsed by ANEW (`requires: <tool> >= <version>`): needs per-tool version
  knowledge in the core and ages with every tool release.
- Skipping a step whose prerequisite is unmet: a silent false green. Rejected — unmet is red.

## Revisit triggers
- Prerequisite commands that hang or have side effects show up in the field (consider a timeout
  or a dry-run convention).
- A need for prerequisites that are not tied to one step.
