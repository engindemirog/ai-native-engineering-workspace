# ANEW — AI Native Engineering Workspace

**A general-purpose, technology-agnostic bootstrap for building software with AI — under control.**

> It doesn't matter what you're building. ANEW gives you a starting environment where context,
> decisions, specs, roles, quality gates, and verification are managed in files — not lost in chat.

Use this repo as a GitHub template (or drop it into an existing project), install the adapter for
your AI tool, run the bootstrap workflow, and start your first feature. No frameworks, no
dependencies, no code generators — a working *system*, written in Markdown plus two small scripts.

## Why this exists

Most AI coding advice is prose nobody enforces. An AI agent's behavior is only shaped by three
mechanical channels:

1. **Context it auto-loads.** `AGENTS.md` is read at session start by every major agent. Everything
   else matters only if it's pointed to from there.
2. **Verification it can run.** Agents work in a run–test–fix loop. When checking is one cheap
   command (`scripts/check`), the agent disciplines itself. When it isn't, the agent says "done"
   without proof.
3. **Rules it cannot bypass.** Prose is advice; tooling is law. Hooks, permission denies, and CI
   gates don't rely on the agent remembering anything.

Every file in ANEW connects to one of these channels — plus one more thing prose can't give you:
**process memory.** Intent, decisions, and evidence live in files that survive every session.

## The three layers

| Layer | What | Ages with |
|---|---|---|
| **Core** (`docs/`, `specs/`, `workflows/`, `prompts/`, `scripts/`, `AGENTS.md`) | The system: context, specs, ADRs, roles, gates, verification, recovery. 100% tool- and stack-agnostic. | Engineering practice (slowly) |
| **Adapters** (`adapters/`) | Thin per-tool wiring: Claude Code, GitHub Copilot, Cursor, generic. Pointers + tool-specific extras only — rules are never duplicated here. | AI tools (they change; core doesn't) |
| **Packs** (roadmap) | Optional stack presets (.NET, Spring, Node, Python, React): conventions/testing/CI suggestions. Not in v1 — the core works without them. | Ecosystems |

## Quickstart

```bash
# 1. Use this template on GitHub (or copy the files into an existing repo), then:
./scripts/init claude-code        # or: github-copilot | cursor | generic

# 2. Open your AI tool and run the bootstrap workflow
#    Claude Code:  /bootstrap
#    Other tools:  paste prompts/bootstrap.md

# 3. The AI interviews you — product, domain, stack, boundaries, conventions, mode —
#    and fills docs/, AGENTS.md, and scripts/check.conf from your answers.

./scripts/doctor                  # 4. Confirm the workspace is healthy

# 5. Start your first feature
#    Claude Code:  /new-feature "short description"
#    Other tools:  follow workflows/feature-development.md
```

Works for **new projects** (empty repo) and **existing codebases** (bootstrap detects your stack
and adapts the rules to what's already there).

## The loop

Every piece of work runs through a workflow, and every workflow enforces the same spine:

```
INTENT → CLARIFY → SPEC → PLAN → [HUMAN APPROVAL] → BUILD
       → INDEPENDENT REVIEW → [HUMAN TRIAGE] → VERIFY → SHIP
```

Two human checkpoints are never automated: **plan approval** and **finding triage**.

### Two operating modes

Chosen at bootstrap, recorded in `AGENTS.md`, honored by every workflow:

| | **Lite** — solo developers, low-risk work | **Strict** — teams, critical systems |
|---|---|---|
| Spine | Spec → Plan → Build → Review → Verify | Full spine incl. Intent → Clarify |
| Human gates | Plan approval | Spec approval · plan approval · finding triage · ship decision |
| Review | Independent (separate session/subagent) | Independent + role separation enforced |
| Ceremony | Minimum viable | Full evidence trail |

Running the full process on every project is unnecessary cost; running none is uncontrolled risk.
Pick per project — or per feature.

## What's in the box

| Path | Purpose |
|---|---|
| `AGENTS.md` | The signpost every agent auto-loads: invariant rules, operating mode, where everything lives. Rewritten by bootstrap; invariants survive. |
| `docs/` | Long-term memory: architecture, domain language, conventions, testing, security, git rules — templates filled at bootstrap. |
| `docs/decisions/` | ADRs — decisions with rationale, so "why" survives the people and the sessions. |
| `docs/roles/` | Role cards bound to responsibility, not technology: analyst, developer, reviewer, QA. Producer and verifier are never the same session. |
| `specs/` | One spec per piece of work: intent, behavior, testable acceptance criteria. `active/` → `done/` (immutable once shipped). Plans live in `specs/plans/`. |
| `workflows/` | The processes: bootstrap, feature-development, bug-fix, refactor, incident. Steps, roles, gates, evidence — each step points to its prompt. |
| `prompts/` | Reusable prompt bodies with placeholders. `prompts/recovery/` is the catalog of safe ramps (R-01…R-12) for when things go wrong. |
| `adapters/` | Per-tool wiring. `scripts/init <tool>` installs one. |
| `scripts/check` | The single verification contract: humans, agents, hooks, and CI all run this one command. Stack-specific internals live in `check.conf`, written at bootstrap. |
| `scripts/doctor` | Workspace health: structure, configuration state, adapter presence. |
| `.github/` | CI that runs the same `scripts/check` + a PR template mirroring the gates. |

## Design principles

**Context lives in files, not in chat.** Sessions forget; files don't. Architecture, decisions,
conventions, and specs are written down and pointed to — `AGENTS.md` stays a short signpost
(≤ 40 lines), never a handbook, because long context files get ignored in the middle.

**No spec, no code.** Work starts by writing down intent and testable acceptance criteria. The most
expensive bugs happen before the first line of code — when human, business, and AI each understood
a different sentence.

**The producer never verifies its own work.** Review runs in a separate session (or a read-only
subagent) that sees the diff and the spec — not the builder's rationalizations.

**Evidence over claims.** "Done" means `scripts/check` is green and every acceptance criterion maps
to a test or a reproducible observation. "It works" is not a status.

**Proposal rule.** Every question, option, or finding an agent raises must include its own
recommendation and rationale. The human decides — faster, with the agent's reasoning visible.

**One verification contract.** There is exactly one way to ask "is this good?": `scripts/check`.
The agent cannot pass locally and fail in CI by running different commands.

## Adapting it

Everything is plain Markdown and POSIX shell — edit, don't fork the philosophy:

- Gates too heavy? Switch the mode line in `AGENTS.md` to `lite`, or tailor workflows per project.
- Tool not listed? Copy `adapters/generic/` and wire your own; core never changes.
- Want stack presets? That's the packs layer — coming after v1 proves the core.

## Origin

ANEW distills the methodology behind the course *AI-Native Software Engineering* by
[Engin Demiroğ](https://www.udemy.com/user/engindemirog/) — where the full discipline is taught by
building a production system from an empty folder. The workspace is the system; the course is the
mastery of it.

## License

MIT
