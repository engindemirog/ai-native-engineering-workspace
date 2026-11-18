# Workflow: Upgrade

**Goal:** move a bootstrapped project to a newer ANEW release without losing what the project
made of it. **Prompt:** `prompts/upgrade.md` · **Role:** Developer · **Input:** CHANGELOG's
"Upgrading" sections between the base (`.anew-version`) and the new tag — they are the spec.

```
FETCH → SCRIPT → MERGE (agent) → CHECK → PR
```

1. **FETCH.** Clone the base tag and the new tag (shallow) into `.git/anew-upgrade/<tag>/` —
   inside `.git`, so never committed. From a clean working tree, create `chore/anew-<new tag>`.
2. **SCRIPT.** `.git/anew-upgrade/<new>/scripts/upgrade .git/anew-upgrade/<base> .` — the new
   release's own copy (`docs/commands.md`, `scripts/upgrade`): files the project never changed are
   replaced, added or removed; the rest are `kept` or listed `merge`.
3. **MERGE.** `/upgrade <new tag>` (`$upgrade` in Codex): the agent applies each entry's behavior
   lists and intents to the `merge` files, takes new `ANEW-*` decisions, writes `.anew-version`
   last and commits. Every question with a recommendation. **[GATE: human]** on any change it
   cannot apply without guessing.
4. **CHECK.** `./scripts/doctor` and `./scripts/selftest` green (selftest takes minutes).
5. **PR.** Push `chore/anew-<new tag>` and open its PR; the team reviews and merges. Then delete
   `.git/anew-upgrade/`. **[GATE: human]**

The VS Code extension does FETCH and SCRIPT after a confirmation, offers `/upgrade`, runs CHECK
and opens the PR; never the merge. A project on the LTS line (`v1.24.x`) moves within it unless
you choose the latest release.
