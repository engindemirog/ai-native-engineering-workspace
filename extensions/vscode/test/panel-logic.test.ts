import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offer, decision, done, shown } from '../src/panel-logic.ts';
import type { Row } from '../src/status.ts';

const row = (stage: string, who: string): Row => ({ spec: '0004', name: 'report', spec_status: '', plan_status: '', stage, who, next: '', warnings: [], notes: [] });
const plan = row('PLAN', 'human');

test('approve is offered only after the full file was opened', () => {
  assert.equal(offer({ row: plan, opened: false, shell: true, running: false }).approve, false);
  assert.match(offer({ row: plan, opened: false, shell: true, running: false }).hint, /Open the full file first/);
  const o = offer({ row: plan, opened: true, shell: true, running: false });
  assert.equal(o.approve, true);
  assert.equal(o.write, 'approve-plan');
  assert.equal(o.hint, 'Approve runs ./scripts/gate approve-plan 0004.');
});

test('the same for a spec', () => {
  assert.equal(offer({ row: row('ANALYZE', 'human'), opened: true, shell: true, running: false }).write, 'approve-spec');
});

test('without a shell nothing is written; request changes only opens the file', () => {
  const o = offer({ row: plan, opened: true, shell: false, running: false });
  assert.equal(o.approve, false);
  assert.equal(o.requestChanges, true);
  assert.match(o.hint, /No POSIX shell found/);
});

test('while gate runs, no second write', () => {
  assert.equal(offer({ row: plan, opened: true, shell: true, running: true }).approve, false);
});

test('triage, ship and agent stages offer no write', () => {
  for (const r of [row('SHIP', 'human'), row("unclear: investigate open — M-1 in 'x'", ''), row('BUILD', 'Developer'), row('VERIFY', 'QA'), row('PLAN', 'Developer'), row('shipped', '')]) {
    const o = offer({ row: r, opened: true, shell: true, running: false });
    assert.equal(o.approve, false, r.stage);
    assert.equal(o.requestChanges, false, r.stage);
  }
  assert.match(offer({ row: row('SHIP', 'human'), opened: true, shell: true, running: false }).hint, /comes with spec 0010/);
});

test('opening the spec does not open the plan approval that follows it (the panel stays open)', () => {
  const spec = row('ANALYZE', 'human');
  const opened = decision(spec, 'specs/active/0004-report.md');
  assert.equal(offer({ row: spec, opened: opened === decision(spec, 'specs/active/0004-report.md'), shell: true, running: false }).approve, true);
  // approve-spec written; the agent writes the plan; the watcher refreshes the same panel
  const next = decision(plan, 'specs/plans/0004-plan.md');
  assert.notEqual(opened, next);
  assert.equal(offer({ row: plan, opened: opened === next, shell: true, running: false }).approve, false);
});

test('gate\'s answer stays while the agent works, and goes once a new decision is up', () => {
  const spec = row('ANALYZE', 'human');
  const d = decision(spec, 'specs/active/0004-report.md');
  const ok = done({ written: true, code: 0, text: 'approve-spec 0004: spec approved — x @abc' }, d, 'approve-spec');
  assert.equal(ok.next, '/plan in your agent');
  assert.equal(done({ written: true, code: 0, text: '' }, d, 'approve-plan').next, '/build in your agent');
  assert.equal(done({ written: false, code: 1, text: 'gate: no' }, d, 'approve-spec').next, '');
  assert.equal(shown(ok, d, 'approve-spec'), ok); // refused or not yet refreshed: same decision
  assert.equal(shown(ok, decision(row('PLAN', 'Developer'), 'specs/plans/0004-plan.md'), null), ok); // the agent writes the plan
  assert.equal(shown(ok, decision(plan, 'specs/plans/0004-plan.md'), 'approve-plan'), null); // the plan approval is up
  assert.equal(shown(null, d, 'approve-spec'), null);
});
