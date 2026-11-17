import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStatus, grouped, groupOf, waiting, writeFor, type Row } from '../src/status.ts';

function row(spec: string, stage: string, who: string, extra: Partial<Row> = {}): Row {
  return { spec, name: `n${spec}`, spec_status: '', plan_status: '', stage, who, next: '', warnings: [], notes: [], ...extra };
}

// One row at every stage scripts/status writes, as --json prints it.
const doc = {
  anew_status: 1,
  rows: [
    row('0001', 'ANALYZE', 'human', { spec_status: 'Draft' }),
    row('0002', 'PLAN', 'Developer', { spec_status: 'Approved' }),
    row('0003', 'PLAN', 'human', { spec_status: 'Approved', plan_status: 'Awaiting approval' }),
    row('0004', 'BUILD', 'Developer', { warnings: ['changed after approval: Requirements'] }),
    row('0005', 'REVIEW', 'fresh session / read-only reviewer'),
    row('0006', 'FIX ROUND', 'Developer'),
    row('0007', 'VERIFY', 'QA'),
    row('0008', 'SHIP', 'human'),
    row('0009', "unclear: investigate open — M-1 in '### Review round 1'", ''),
    row('0010', 'shipped', '', { spec_status: 'Shipped' }),
  ],
  notes: ['a note'],
};

test('parses every row and keeps warnings and notes', () => {
  const s = parseStatus(JSON.stringify(doc));
  assert.equal(s.rows.length, 10);
  assert.deepEqual(s.rows[3].warnings, ['changed after approval: Requirements']);
  assert.deepEqual(s.notes, ['a note']);
});

test('groups: the human and every unclear row are "your turn"', () => {
  const g = grouped(parseStatus(JSON.stringify(doc)));
  assert.deepEqual(g['your turn'].map((r) => r.spec), ['0001', '0003', '0008', '0009']);
  assert.deepEqual(g['in progress'].map((r) => r.spec), ['0002', '0004', '0005', '0006', '0007']);
  assert.deepEqual(g.shipped.map((r) => r.spec), ['0010']);
});

test('waiting counts the decisions that wait', () => {
  assert.equal(waiting(parseStatus(JSON.stringify(doc))), 4);
});

test('only spec and plan approval offer a write in 0.1.0', () => {
  const s = parseStatus(JSON.stringify(doc));
  const w = Object.fromEntries(s.rows.map((r) => [r.spec, writeFor(r)]));
  assert.equal(w['0001'], 'approve-spec');
  assert.equal(w['0003'], 'approve-plan');
  assert.equal(w['0002'], null); // PLAN, but the Developer's
  assert.equal(w['0008'], null); // SHIP: spec 0010
  assert.equal(w['0009'], null);
  assert.equal(w['0010'], null);
});

test('an empty workspace has no rows and nothing waits', () => {
  const s = parseStatus('{"anew_status":1,"rows":[],"notes":[]}');
  assert.equal(s.rows.length, 0);
  assert.equal(waiting(s), 0);
});

test('a row without a stage is refused, not guessed', () => {
  assert.throws(() => parseStatus('{"anew_status":1,"rows":[{"spec":"0001"}]}'), /row 1 has no string "name"/);
  assert.throws(() => parseStatus('not json'), /no JSON/);
  assert.throws(() => parseStatus('{"anew_status":2,"rows":[]}'), /anew_status 1/);
});

test('groupOf reads shipped before who', () => {
  assert.equal(groupOf(row('0001', 'shipped', 'human')), 'shipped');
});
