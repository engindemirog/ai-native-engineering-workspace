# R-13 — Environment Gap

```
The environment cannot satisfy an ANEW rule or a check step: <state it — e.g. a prerequisite
not met (doctor/check output), a tool missing or too old, the agent's permission layer refusing
an action a rule requires, a profile that cannot run on this machine>.
STOP. DO NOT WORK AROUND THE RULE. Bring me:
- The rule or step (file + section, or the check.conf line) and the exact constraint, with the
  output that shows it.
- The options, each with its cost — e.g. fix the environment (what, by whom); run that profile
  in CI only (every proof of it then costs a push); change the step or its prerequisite; I do
  the refused action myself (you give me the exact command and path).
- Your recommendation and why.
After I decide: record the decision as a plan amendment (A-n), then continue from where you
stopped.
PROTECTION: never weaken, skip or disable the rule, the step or its prerequisite to get past it;
never report its evidence as present while the gap is open.
```
