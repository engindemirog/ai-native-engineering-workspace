import { test } from 'node:test';
import assert from 'node:assert/strict';
import { model, offered, prStep, triageRounds, html, probed, defaultBranch } from '../src/ship.ts';
import type { Row } from '../src/status.ts';

const spec = ['# Spec 0004 — report', '', '- Status: In progress', '', '## Acceptance criteria',
  '- [ ] AC-1 — totals per category', '  match the ledger', '- [ ] ~~AC-2 — empty month~~ → moved to B-3 | spec 0004 — report, 2026-11-17, later',
  '- [ ] AC-3 — <b>the CLI</b> prints it', '', '## Definition of Done', '- [ ] Every acceptance criterion mapped to proof', '- [x] `scripts/check` green', ''].join('\n');
const plan = ['# Plan 0004', '', '## Criterion ↔ test map', '| Acceptance criterion | Proven by | Profile |', '|---|---|---|',
  '| AC-1 | `test_month_totals` | full |', '| AC-3 | | |', '', '## Build evidence', '- CHECK GREEN (full, 3 passed) @abc1234', '- CHECK GREEN (full, 5 passed) @def5678', '',
  '## Triage', '', '### Review round 1 — Ada, 2026-11-10', '| x | real | fix-1 |', '', '### VERIFY round 1 — Ada, 2026-11-12', ''].join('\n');

test('the files read for ship: criteria with their proof, the DoD, the newest evidence, the rounds', () => {
  const m = model(spec, plan);
  assert.deepEqual(m.criteria, [
    { id: 'AC-1', text: 'totals per category match the ledger', proof: 'test_month_totals', moved: false },
    { id: 'AC-2', text: 'empty month → moved to B-3 | spec 0004 — report, 2026-11-17, later', proof: '', moved: true },
    { id: 'AC-3', text: '<b>the CLI</b> prints it', proof: '', moved: false },
  ]);
  assert.deepEqual(m.dod, [{ text: 'Every acceptance criterion mapped to proof', done: false }, { text: 'scripts/check green', done: true }]);
  assert.equal(m.evidence, 'CHECK GREEN (full, 5 passed) @def5678');
  assert.deepEqual(m.rounds, ['Review round 1 — Ada, 2026-11-10', 'VERIFY round 1 — Ada, 2026-11-12']);
  assert.deepEqual(triageRounds('## Notes\n### x\n'), []);
  assert.equal(model('## Acceptance criteria\n- [ ] AC-1: odd shape\n', '').criteria, null);
});

const row = (stage: string, who: string, warnings: string[] = []): Row => ({ spec: '0004', name: 'report', spec_status: '', plan_status: '', stage, who, next: '', warnings, notes: [] });

test('Ship is offered at SHIP only, and not with a status warning', () => {
  assert.deepEqual(offered(row('SHIP', 'human')), { ok: true, why: '' });
  assert.equal(offered(row('VERIFY', 'QA')).ok, false);
  assert.equal(offered(row('BUILD', 'Developer')).ok, false);
  assert.match(offered(row('SHIP', 'human', ['evidence is older than the code'])).why, /warning/);
});

test('the PR step: offered on a feature branch with gh signed in; else the commands to copy', () => {
  const base = { branch: 'feat/0004-report', defaultBranch: 'main', remote: 'origin', gh: true };
  assert.deepEqual(prStep(base), { offered: true, why: '', commands: ['git push -u origin feat/0004-report', 'gh pr create --fill'] });
  assert.match(prStep({ ...base, branch: 'main' }).why, /default branch/);
  assert.equal(prStep({ ...base, gh: false }).offered, false);
  assert.equal(prStep({ ...base, branch: 'HEAD' }).offered, false);
});

const view = (over = {}) => ({ row: row('SHIP', 'human'), file: 'specs/active/0004-report.md', model: model(spec, plan), approver: 'Ada',
  shell: true, running: false, result: null, pr: null, prOutput: null, pushing: false, nonce: 'n0nce', cspSource: 'vscode-resource:', ...over });

test('the screen: criteria with proof (no tick boxes), one Ship button, escaped text', () => {
  const h = html(view());
  assert.ok(h.includes('<button id="ship" class="primary">Ship</button>'));
  assert.ok(h.includes('Criteria ↔ proof · 2 / 3 with proof'));
  assert.ok(h.includes('proof: test_month_totals'));
  assert.ok(h.includes('moved out (R-08)'));
  assert.ok(h.includes('⚠ no proof named in the plan'));
  assert.ok(h.includes('&lt;b&gt;the CLI&lt;/b&gt;'));
  assert.ok(!h.includes('type="checkbox"'));
  assert.ok(h.includes('✓ CHECK GREEN (full, 5 passed) @def5678'));
  assert.ok(!/https?:\/\//.test(h));
  assert.ok(html(view({ row: row('VERIFY', 'QA') })).includes('<button id="ship" class="primary" disabled>Ship</button>'));
  assert.ok(html(view({ shell: false })).includes('<button id="ship" class="primary" disabled>Ship</button>'));
});

test('after a written ship: gate\'s line, then the PR step; a refusal shows gate\'s message', () => {
  const pr = prStep({ branch: 'feat/x', defaultBranch: 'main', remote: 'origin', gh: true });
  const h = html(view({ result: { written: true, code: 0, text: 'ship 0004: shipped — specs/done/0004-report.md @abc', next: '' }, pr }));
  assert.ok(h.includes('✓ Shipped — written and committed'));
  assert.ok(h.includes('<button id="pr" class="primary">Push and open PR…</button>'));
  assert.ok(!h.includes('id="ship"'));
  const no = html(view({ result: { written: false, code: 1, text: 'gate: 0004 is at VERIFY', next: '' } }));
  assert.ok(no.includes('Refused (exit 1) — nothing was written.'));
  const manual = html(view({ result: { written: true, code: 0, text: 'x', next: '' }, pr: prStep({ branch: 'feat/x', defaultBranch: 'main', remote: 'origin', gh: false }) }));
  assert.ok(!manual.includes('id="pr"'));
  assert.ok(manual.includes('git push -u origin feat/x\ngh pr create --fill'));
});

test('H-2: a failed git probe is no branch name; a remote without HEAD means main', () => {
  assert.equal(probed({ code: 128, stdout: 'fatal: ref refs/remotes/origin/HEAD is not a symbolic ref\n' }), '');
  assert.equal(probed({ code: 0, stdout: 'origin/main\n' }), 'origin/main');
  assert.equal(defaultBranch('', 'origin'), 'main');
  assert.equal(defaultBranch('origin/trunk', 'origin'), 'trunk');
  // shipped on main with origin/HEAD unset: no push button
  assert.equal(prStep({ branch: 'main', defaultBranch: defaultBranch(probed({ code: 128, stdout: '' }), 'origin'), remote: 'origin', gh: true }).offered, false);
});

test('L-1: while pushing, the button is disabled and the screen says so', () => {
  const pr = prStep({ branch: 'feat/x', defaultBranch: 'main', remote: 'origin', gh: true });
  const h = html(view({ result: { written: true, code: 0, text: 'x', next: '' }, pr, pushing: true }));
  assert.ok(h.includes('<button id="pr" class="primary" disabled>Push and open PR…</button>'));
  assert.ok(h.includes('<p class="hint" role="status">Pushing and opening the PR…</p>'));
});
