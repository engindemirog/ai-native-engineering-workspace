# R-11 — Safe Rollback

```
We need to undo <commit(s)/change>. Use git revert — history rewriting and force push are
forbidden (docs/git.md). Before executing:
- List exactly what will be reverted and what depends on it.
- If data/schema migrations are involved: a RISK REPORT first — is the migration reversible,
  what happens to data written since, what is the safe sequence?
Execute only with my approval. After: ./scripts/check green + a short note on what remains
(e.g. the forward-fix now goes through the bug-fix workflow).
```
