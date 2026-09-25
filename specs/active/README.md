# specs/active/

Specs currently being worked on. One file per piece of work, numbered `NNNN-<short-name>.md`.
No branch, plan, or code exists before a spec does.

- New behavior → `specs/TEMPLATE.md`.
- Existing behavior must change (CHANGE lane of `workflows/change-request.md`) or an incident
  (`workflows/incident.md`) → `specs/TEMPLATE-mini.md` (`Source:` mandatory; changed + preserved
  behavior criteria).
- Numbering is one sequence shared by `active/`, `done/`, and `plans/`: next = highest + 1.
  `scripts/doctor` reports duplicates — a twin spec is a process failure, not a naming issue.
- `Status` moves Draft → Approved → In progress → Shipped; at ship the file moves to `done/`.
