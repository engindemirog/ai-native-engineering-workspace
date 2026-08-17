# R-09 — Context Fog / Session Handoff

```
This session's context has become unreliable (too long, contradictory, or drifting). Do this:
1) Write a STATE FILE (specs/plans/<NNNN>-handoff.md): what is DONE with evidence, what is
   IN PROGRESS exactly, what is NEXT, open questions, and the commands to verify state.
2) List files a fresh session must read (spec, plan, relevant docs).
PROTECTION: nothing may be claimed "done" in the state file without evidence — the next session
will trust this file. After writing it, I will close this session and open a fresh one that starts
by reading the state file.
```
