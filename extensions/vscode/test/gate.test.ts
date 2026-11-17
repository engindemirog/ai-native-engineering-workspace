import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gateArgs, answer } from '../src/gate.ts';

test('the arguments are the terminal call, nothing added', () => {
  assert.deepEqual(gateArgs('approve-spec', '0012'), ['approve-spec', '0012']);
  assert.deepEqual(gateArgs('approve-plan', '0003'), ['approve-plan', '0003']);
});

test('a spec number that is not four digits builds nothing', () => {
  for (const s of ['12', '00012', '0012 ', 'abcd', '0012;rm']) assert.throws(() => gateArgs('approve-spec', s), /not a spec number/);
});

test('the answer is gate\'s own text: the result line, or the refusal', () => {
  const ok = answer(0, 'approve-plan 0003: plan approved — specs/plans/0003-plan.md @abc1234\n      committed with your uncommitted edits to specs/plans/0003-plan.md\n', '');
  assert.equal(ok.written, true);
  assert.equal(ok.text, 'approve-plan 0003: plan approved — specs/plans/0003-plan.md @abc1234\n      committed with your uncommitted edits to specs/plans/0003-plan.md');
  const no = answer(1, '', 'gate: 0003 is at BUILD (Developer); approve-plan decides PLAN (human)\n');
  assert.deepEqual(no, { written: false, code: 1, text: 'gate: 0003 is at BUILD (Developer); approve-plan decides PLAN (human)' });
  assert.equal(answer(2, '', '').text, 'gate exited 2');
});
