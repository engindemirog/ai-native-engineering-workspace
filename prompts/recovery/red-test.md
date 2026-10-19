# R-02 — Red Test

```
These tests are red: <test names>.
Many unrelated tests red at once (timeouts, refused connections)? Check the ENVIRONMENT first —
daemons, containers, ports. A crashed environment is not a code fault; restore it and re-run.
Before fixing anything, DECIDE with rationale — which one is wrong?
a) CODE is wrong (test demands correct behavior) → fix the code.
b) TEST is wrong (encodes wrong behavior) → prove it to me; change the test only WITH MY APPROVAL,
   showing which acceptance criterion it maps to.
c) SPEC is ambiguous/contradictory → stop; bring it to me in R-10 format.
PROTECTION: weakening asserts, deleting or skipping tests is FORBIDDEN. Nothing done "just to make
it pass" is accepted. Iterate with ./scripts/check --fast; finish with the whole suite green
(./scripts/check, full profile).
```
