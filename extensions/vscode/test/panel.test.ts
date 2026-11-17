import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, type View } from '../src/panel.ts';
import { offer } from '../src/panel-logic.ts';
import type { Row } from '../src/status.ts';

const row: Row = { spec: '0004', name: 'report <b>&"\'', spec_status: '', plan_status: '', stage: 'PLAN', who: 'human', next: '', warnings: ['plan <i>stale</i>'], notes: [] };
const view = (over: Partial<View> = {}): View => ({
  row, file: 'specs/plans/0004-plan.md', sections: [{ title: 'Risks', body: '<script>alert(1)</script>' }],
  offer: offer({ row, opened: false, shell: true, running: false }), result: null, nonce: 'n0nce', cspSource: 'vscode-resource:', ...over,
});

test('everything from the files is escaped', () => {
  const h = html(view());
  assert.ok(!h.includes('<script>alert(1)</script>'));
  assert.ok(h.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(h.includes('report &lt;b&gt;&amp;&quot;&#39;'));
  assert.ok(h.includes('plan &lt;i&gt;stale&lt;/i&gt;'));
  assert.ok(!h.includes('<b>&'));
});

test('no remote content: the CSP allows only the nonce\'d script and style', () => {
  const h = html(view());
  assert.ok(h.includes(`content="default-src 'none'; style-src vscode-resource: 'nonce-n0nce'; script-src 'nonce-n0nce';"`));
  assert.equal((h.match(/<script\b/g) ?? []).length, 1);
  assert.ok(h.includes('<script nonce="n0nce">'));
  assert.ok(!/https?:\/\//.test(h));
});

test('approve is a button only when the offer has it', () => {
  assert.ok(!html(view()).includes('id="approve"'));
  assert.ok(html(view()).includes('id="changes"'));
  const h = html(view({ offer: offer({ row, opened: true, shell: true, running: false }) }));
  assert.ok(h.includes('<button id="approve" class="primary">Approve the plan</button>'));
  assert.ok(!html(view({ offer: offer({ row, opened: true, shell: true, running: true }) })).includes('id="approve"'));
});

test('written and refused are shown as gate said them', () => {
  const ok = html(view({ result: { written: true, code: 0, text: 'approve-plan 0004: plan approved — specs/plans/0004-plan.md @abc1234', next: '/build in your agent' } }));
  assert.ok(ok.includes('<strong>Written.</strong><pre>approve-plan 0004: plan approved — specs/plans/0004-plan.md @abc1234</pre><p>Next: /build in your agent</p>'));
  const no = html(view({ result: { written: false, code: 1, text: 'gate: 0004 is at BUILD <x>', next: '' } }));
  assert.ok(no.includes('Refused (exit 1) — nothing was written.'));
  assert.ok(no.includes('<pre>gate: 0004 is at BUILD &lt;x&gt;</pre>'));
  assert.ok(!no.includes('Written.'));
});
