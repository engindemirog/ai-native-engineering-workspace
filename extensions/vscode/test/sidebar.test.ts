import { test } from 'node:test';
import assert from 'node:assert/strict';
import { model, card, badge, html } from '../src/sidebar.ts';
import { parseStatus, type Row } from '../src/status.ts';

function row(spec: string, stage: string, who: string, extra: Partial<Row> = {}): Row {
  return { spec, name: `n${spec}`, spec_status: '', plan_status: '', stage, who, next: `next ${spec}`, warnings: [], notes: [], ...extra };
}

// One row at every stage scripts/status writes, as --json prints it.
const status = parseStatus(JSON.stringify({
  anew_status: 1,
  rows: [
    row('0001', 'ANALYZE', 'human'),
    row('0002', 'PLAN', 'Developer'),
    row('0003', 'PLAN', 'human'),
    row('0004', 'BUILD', 'Developer', { warnings: ['changed after approval: Requirements', 'second'] }),
    row('0005', 'REVIEW', 'fresh session / read-only reviewer'),
    row('0006', 'FIX ROUND', 'Developer'),
    row('0007', 'VERIFY', 'QA'),
    row('0008', 'SHIP', 'human'),
    row('0009', "unclear: investigate open — M-1 in '### Review round 1'", ''),
    row('0010', 'shipped', ''),
  ],
  notes: [],
}));

test('groups, badges, lines and the waiting count follow status', () => {
  const m = model(status, null, 'lite · v1.28');
  assert.equal(m.waiting, 4);
  assert.deepEqual(m.groups.map((g) => [g.group, g.cards.map((c) => `${c.spec}:${c.badge}:${c.tone}`)]), [
    ['your turn', ['0001:Spec approval:you', '0003:Plan approval:you', '0008:Ship:you', '0009:Unclear:you']],
    ['in progress', ['0002:PLAN:agent', '0004:BUILD:warn', '0005:REVIEW:agent', '0006:FIX ROUND:agent', '0007:VERIFY:agent']],
    ['shipped', ['0010:Shipped:done']],
  ]);
  assert.equal(card(status.rows[3]).line, '⚠ changed after approval: Requirements');
  assert.equal(card(status.rows[8]).line, "unclear: investigate open — M-1 in '### Review round 1'");
  assert.equal(card(status.rows[0]).line, 'next 0001');
  assert.equal(badge(row('0011', 'REVIEW', 'human')), 'Triage');
});

test('a problem, the first read and an empty workspace say so', () => {
  assert.equal(model(status, 'No POSIX shell found', '').message, 'No POSIX shell found');
  assert.deepEqual(model(null, null, '').message, 'reading scripts/status…');
  const empty = model({ rows: [], notes: [] }, null, '');
  assert.equal(empty.message, 'No work yet — start with + New work.');
  assert.equal(empty.waiting, 0);
});

test('every card and + New work is a keyboard-reachable button with its meaning in words', () => {
  const h = html(model(status, null, 'lite · v1.28'), 'n0nce', 'vscode-resource:');
  assert.ok(h.includes('<button id="new" data-keep="1" class="primary wide">+ New work</button>'));
  assert.equal((h.match(/<button id="row-\d{4}"/g) ?? []).length, 10);
  assert.ok(h.includes('aria-label="0003 n0003: Plan approval, your turn"'));
  assert.ok(h.includes('aria-label="0010 n0010: Shipped, shipped"'));
  assert.ok(h.includes('<details><summary class="glabel shipped">Shipped · 1</summary>'));
  assert.ok(h.includes('<h2 class="glabel you">Your turn · 4</h2>'));
  assert.ok(h.includes('lite · v1.28'));
  assert.ok(!/https?:\/\//.test(h));
});

test('names and lines from the files are escaped', () => {
  const s = parseStatus(JSON.stringify({ anew_status: 1, rows: [row('0001', 'ANALYZE', 'human', { name: '<img src=x onerror=1>', next: '<b>x</b>' })], notes: [] }));
  const h = html(model(s, null, '<i>'), 'n0nce', 'vscode-resource:');
  assert.ok(!h.includes('<img') && !h.includes('<b>x') && !h.includes('<i>'));
  assert.ok(h.includes('&lt;img src=x onerror=1&gt;'));
});
