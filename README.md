# ANEW — AI Native Engineering Workspace

**A general-purpose, technology-agnostic bootstrap for building software with AI — under control.**

> It doesn't matter what you're building. ANEW gives you a starting environment where context,
> decisions, specs, roles, quality gates, and verification are managed in files — not lost in chat.

Use this repo as a GitHub template (or drop it into an existing project), install the adapter for
your AI tool, run the bootstrap workflow, and start your first feature. No frameworks, no
dependencies, no code generators — a working *system*, written in Markdown plus three small scripts.

## Why this exists

AI lowers development latency — and amplifies decision errors. A misunderstood requirement once
cost a developer two weeks; an agent now ships the same misunderstanding in twenty minutes, with
green tests. The bottleneck has moved from writing code to deciding correctly and proving it. ANEW
is built for that bottleneck: it does not make the AI write more code; it makes the AI work inside
an engineering process.

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
#    Claude Code / Cursor / Copilot:  /bootstrap
#    Other tools:  paste prompts/bootstrap.md

# 3. The AI first asks two things: interview language and document language (recorded in
#    AGENTS.md — permanent). Then it interviews you — product, domain, stack, boundaries,
#    conventions, mode — and fills docs/, AGENTS.md, and scripts/check.conf from your answers.

./scripts/doctor                  # 4. Confirm the workspace is healthy

# 5. Start your first feature (Claude Code, Cursor and Copilot share the same commands)
#    lite mode:     /new-feature "short description"    # chains the segments, asks at each gate
#    strict mode:   /analyze "short description"        # one segment per role, one role per session
#    existing behavior must change:  /change "<request> <work item>"
#    any other tool: adapters/generic/README.md (paste the prompts by hand)
```

Works for **new projects** (empty repo) and **existing codebases** (bootstrap detects your stack
and adapts the rules to what's already there).

## The loop

Every piece of work runs through a workflow, and every workflow follows the same spine:

```
INTENT → CLARIFY → SPEC → PLAN → [HUMAN APPROVAL] → BUILD
       → INDEPENDENT REVIEW → [HUMAN TRIAGE] → VERIFY → SHIP
```

Two human checkpoints are never automated: **plan approval** and **finding triage**. Spec approval
is always asked as well — in lite mode a quick yes/no, never skipped, because it is PLAN's entry
condition.

Each stage is a *segment* with an entry condition and a handoff written to files (the spec's
`Status`, the plan's `Approved by / on` line). The rule:
**Segments always stop; /new-feature flows only as far as the mode allows.**

### Segment commands (every adapter; defined once in `workflows/segments.md`)

| Command | What it does | Stops at |
|---|---|---|
| `/new-feature "<feature>"` | **Lite: start here.** Chainer — runs the segments below in order and asks at every gate. In `strict` it refuses and redirects to the segment commands. | Each gate |
| `/analyze "<feature>"` | Intent → clarify → spec (+ self-critique); refuses to open a twin spec | Spec `Status: Approved` → "Next: /plan" |
| `/plan <NNNN>` | Plan from the spec; **refuses unless the spec is Approved** | Approval recorded in the plan → "Next: /build" |
| `/build <NNNN>` | Implements the plan; **refuses unless `Approved by / on` is filled**; sets `In progress` | `scripts/check` green with output → "Next: /review" |
| `/review <NNNN>` | Independent review — read-only where the tool supports it (see "How strongly is each rule held?") | Findings report → human triage |
| `/verify <NNNN>` | QA: criterion ↔ evidence table | Table → human ship |
| `/change "<request> <work item>"` | Change an existing behavior: triage rubric (bug → `/fix-bug` · trivial → one commit per `docs/git.md` policy · change → mini-spec lane), then the lane by mode (`workflows/change-request.md`) | Triage verdict; then the lane's gates |
| `/bootstrap` · `/fix-bug` · `/refactor` · `/adr` · `/recover` | Other workflows — same commands in Claude Code, Cursor and Copilot; any other tool pastes the prompts | Their gates |

Claude Code and Cursor expose these as slash commands, GitHub Copilot as prompt files, and any
other tool by pasting the prompts (`adapters/generic/README.md`). CI runs `scripts/doctor --strict`,
so the spec/plan gates hold whichever tool produced the PR.

### Two operating modes

Chosen at bootstrap, recorded in `AGENTS.md`, honored by every workflow:

| | **Lite** — solo developers, low-risk work | **Strict** — teams, critical systems |
|---|---|---|
| Spine | Spec → Plan → Build → Review → Verify | Full spine incl. Intent → Clarify |
| Human gates | Spec approval (light yes/no) · plan approval; `/new-feature` also asks at triage and ship | Spec approval · plan approval · finding triage · ship decision |
| Review | Independent (separate session/subagent) | Independent + one role per session (Documented; see the table below) |
| Ceremony | Minimum viable | Full evidence trail |

Running the full process on every project is unnecessary cost; running none is uncontrolled risk.
Pick per project — or per feature.

### How strongly is each rule held?

Not every rule is held the same way, and not every tool can hold it the same way. Three levels:

- **Documented** — the rule is written down; the agent is instructed to follow it.
- **Validated** — a script detects a violation (`scripts/doctor` / `scripts/check`, locally and in CI).
- **Enforced** — the tool physically prevents the action.

| Rule | Claude Code | GitHub Copilot | Cursor | Other tools |
|---|---|---|---|---|
| Spec approved before plan | Validated (CI) | Validated (CI) | Validated (CI) | Validated (CI) |
| Plan approval recorded before build | Validated (CI) | Validated (CI) | Validated (CI) | Validated (CI) |
| Who approved the plan | Documented | Documented | Documented | Documented |
| Producer ≠ verifier | Enforced (reviewer subagent has no Edit/Write; Bash kept for `scripts/check`, instructed never to write) | Enforced (reviewer agent, no edit tools; `runCommands` kept) | Documented (fresh chat) | Documented (fresh session) |
| Shipped specs immutable | Enforced (hook, editor tools) + Validated (CI) | Documented (instruction) + Validated (CI) | Documented (rule) + Validated (CI) | Validated (CI) |
| No force-push / hard reset | Enforced (permission deny) | Documented | Documented | Documented |
| "Done" = `scripts/check` green | Validated (CI) | Validated (CI) | Validated (CI) | Validated (CI) |

Segment commands also refuse out-of-order work (entry checks) — that is the agent following a
Documented rule; CI is what makes it Validated.

"Who approved" is Documented because a line in a file cannot prove identity. The real fix lives
in the hosting platform, not in this repo: in strict mode, protect the default branch and require
a pull-request review from `CODEOWNERS` — then the approver's identity comes from GitHub. The same
branch protection setting makes "no force-push" Enforced for every tool.

## What's in the box

| Path | Purpose |
|---|---|
| `AGENTS.md` | The signpost every agent auto-loads: invariant rules, operating mode, where everything lives. Rewritten by bootstrap; invariants survive. |
| `docs/` | Long-term memory: architecture, domain language, conventions, testing, security, git rules — templates filled at bootstrap. |
| `docs/decisions/` | ADRs — decisions with rationale, so "why" survives the people and the sessions. ANEW's own design decisions are recorded there (0001–0003). |
| `docs/roles/` | Role cards bound to responsibility, not technology: analyst, developer, reviewer, QA. Producer and verifier are never the same session. |
| `specs/` | One spec per piece of work: intent, behavior, testable acceptance criteria (`TEMPLATE-mini.md` for behavior changes: changed + preserved criteria). `active/` → `done/` (immutable once shipped). Plans live in `specs/plans/`. |
| `workflows/` | The processes: bootstrap, feature-development, change-request, bug-fix, refactor, incident. Steps, roles, gates, evidence — each step points to its prompt. `segments.md` defines the feature stages as stop-at-handoff segments that every adapter maps onto. |
| `prompts/` | Reusable prompt bodies with placeholders. `prompts/recovery/` is the catalog of safe ramps (R-01…R-12) for when things go wrong. |
| `adapters/` | Per-tool wiring. `scripts/init <tool>` installs one. |
| `scripts/check` | The single verification contract: humans, agents, hooks, and CI all run this one command. Stack-specific internals live in `check.conf`, written at bootstrap. |
| `scripts/doctor` | Workspace health: structure, configuration state, adapter presence, spec/plan gate consistency (`--strict` in CI). |
| `scripts/init` | Installs an adapter; keeps existing files unless `--force`. |
| `CHANGELOG.md` | What changed between versions of the workspace, for template users upgrading their copy. |
| `.github/` | CI that runs the same `scripts/check` and `scripts/doctor --strict` + a PR template mirroring the gates. |

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

## Scope

ANEW governs the path from intent to merge: context, specification, plan, authorization,
implementation, independent review, evidence. Release, deployment and production operations are
deliberately out of scope — that is where organizations differ most and already have tooling;
ANEW connects to it through `scripts/check` and CI instead of replacing it. The incident workflow
(`workflows/incident.md`) is the existing bridge back from production into this loop.

## Adapting it

Everything is plain Markdown and POSIX shell — edit, don't fork the philosophy:

- Gates too heavy? Switch the mode line in `AGENTS.md` to `lite`, or tailor workflows per project.
- Tool not listed? Copy `adapters/generic/` and wire your own; core never changes.
- Team doesn't work in English? The core stays English; your documents don't have to. Bootstrap asks
  for the interview and document languages first and records them in `AGENTS.md`. Protocol fields
  (`Status:` values, `Approved by / on:`) stay English so the gates keep working.
- Want stack presets? That's the packs layer — coming after v1 proves the core.

## Origin

ANEW distills the methodology behind the course *AI-Native Software Engineering* by
[Engin Demiroğ](https://www.udemy.com/user/engindemirog/) — where the full discipline is taught by
building a production system from an empty folder. The workspace is the system; the course is the
mastery of it.

## License

MIT
