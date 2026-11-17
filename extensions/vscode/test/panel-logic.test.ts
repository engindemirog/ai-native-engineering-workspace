import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offer } from '../src/panel-logic.ts';
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
