import { test } from 'node:test';
import assert from 'node:assert/strict';
import { html, notice, type View } from '../src/panel.ts';
import { offer } from '../src/panel-logic.ts';
import type { Row } from '../src/status.ts';

const row: Row = { spec: '0004', name: 'report <b>&"\'', spec_status: '', plan_status: '', stage: 'PLAN', who: 'human', next: '', warnings: ['plan <i>stale</i>'], notes: [] };
const sections = [
  { title: 'Files to change or add', body: '- `app/<x>.py` (new): the report' },
  { title: 'Risks & open questions', body: '1. **<script>alert(1)</script>** Recommendation: <img src=x onerror=alert(2)>' },
  { title: 'Criterion ↔ test map', body: '| Acceptance criterion | Proven by | Profile |\n|---|---|---|\n| AC-1 | `test_<a>` | full |\n| AC-2 | | |' },
];
const view = (over: Partial<View> = {}): View => ({
  row, file: 'specs/plans/0004-plan.md', sections,
  offer: offer({ row, opened: false, shell: true, running: null }), result: null, nonce: 'n0nce', cspSource: 'vscode-resource:', ...over,
});

test('everything from the files is escaped', () => {
  const h = html(view());
  assert.ok(!h.includes('<script>alert(1)</script>'));
  assert.ok(h.includes('1. &lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(h.includes('Recommendation: &lt;img src=x onerror=alert(2)&gt;'));
  assert.ok(!h.includes('<img'));
  assert.ok(h.includes('<li>app/&lt;x&gt;.py (new)</li>'));
  assert.ok(h.includes('test_&lt;a&gt;'));
  assert.ok(h.includes('Plan 0004 — report &lt;b&gt;&amp;&quot;&#39;'));
  assert.ok(h.includes('plan &lt;i&gt;stale&lt;/i&gt;'));
  assert.ok(!h.includes('<b>&'));
});

test('no remote content: the CSP allows only the nonce\'d script and style', () => {
  const h = html(view());
  assert.ok(h.includes(`content="default-src 'none'; style-src vscode-resource: 'nonce-n0nce'; script-src 'nonce-n0nce';"`));
  assert.equal((h.match(/<script\b/g) ?? []).length, 1);
  assert.ok(h.includes('<script nonce="n0nce">'));
  assert.ok(!/https?:\/\//.test(h));
  const n = notice('No POSIX shell found <x>', 'n0nce', 'vscode-resource:');
  assert.ok(n.includes(`content="default-src 'none'; style-src vscode-resource: 'nonce-n0nce';"`));
  assert.ok(!n.includes('<script'));
  assert.ok(n.includes('No POSIX shell found &lt;x&gt;'));
});

test('the summary reads as the mockup\'s cards: strip, files, test map, risks', () => {
  const h = html(view());
  assert.ok(h.includes('<span class="step done">✓ Spec</span><span class="step now you">● Plan · waiting for you</span><span class="step">Build</span>'));
  assert.ok(h.includes('Files to change · 1'));
  assert.ok(h.includes('Criterion ↔ test · 1/2 mapped'));
  assert.ok(h.includes('<span class="id">AC-2</span> → <span class="missing">no test yet</span>'));
  assert.ok(h.includes('Risks · 1, each with a recommendation'));
});

test('approve is a button only when the offer has it, and only after the file is open', () => {
  const closed = html(view());
  assert.ok(!closed.includes('id="approve"'));
  assert.ok(closed.includes('<button id="open" class="primary">Open the full plan</button>'));
  assert.ok(closed.includes('id="changes"'));
  assert.ok(closed.includes('0004-plan.md opens in the editor. The approve button appears here once it is open'));
  assert.ok(closed.includes('<code>./scripts/gate approve-plan 0004</code>'));
  const open = html(view({ offer: offer({ row, opened: true, shell: true, running: null }) }));
  assert.ok(open.includes('<button id="approve" class="primary">Approve the plan</button>'));
  assert.ok(open.includes('0004-plan.md is open beside this panel.'));
  assert.ok(!html(view({ offer: offer({ row, opened: true, shell: true, running: '0004' }) })).includes('id="approve"'));
});

test('written and refused are shown as gate said them', () => {
  const ok = html(view({ result: { written: true, code: 0, text: 'approve-plan 0004: plan approved — specs/plans/0004-plan.md @abc1234', next: '/build 0004' } }));
  assert.ok(ok.includes('<strong>✓ Plan approved — written and committed</strong>'));
  assert.ok(ok.includes('<pre class="out">approve-plan 0004: plan approved — specs/plans/0004-plan.md @abc1234</pre>'));
  assert.ok(ok.includes('<code class="cmd">/build 0004</code><button id="copy" class="secondary">Copy</button>'));
  assert.ok(!ok.includes('id="approve"'));
  const no = html(view({ result: { written: false, code: 1, text: 'gate: 0004 is at BUILD <x>', next: '' } }));
  assert.ok(no.includes('Refused (exit 1) — nothing was written.'));
  assert.ok(no.includes('<pre class="out">gate: 0004 is at BUILD &lt;x&gt;</pre>'));
  assert.ok(!no.includes('approved — written'));
  assert.ok(!no.includes('id="copy"'));
});
