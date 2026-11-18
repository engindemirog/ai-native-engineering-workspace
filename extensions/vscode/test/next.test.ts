import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEGMENTS, nextFor, canContinue, fresh, type Agent } from '../src/next.ts';
import { nextBox, answerBox } from '../src/screens.ts';
import { html as panel } from '../src/panel.ts';
import { html as triage } from '../src/triage.ts';
import { offer } from '../src/panel-logic.ts';
import type { Row } from '../src/status.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const row = (stage: string, who: string, next = ''): Row => ({ spec: '0003', name: 'demo', spec_status: '', plan_status: '', stage, who, next, warnings: [], notes: [] });
const claude: Agent = { agent: 'claude-code', claude: true, have: ['claude-code'] };

test('AC-1: each stage that waits for the agent gives its command; the others none', () => {
  assert.equal(nextFor(row('PLAN', 'Developer')), '/plan 0003');
  assert.equal(nextFor(row('BUILD', 'Developer')), '/build 0003');
  assert.equal(nextFor(row('FIX ROUND', 'Developer')), '/build 0003');
  assert.equal(nextFor(row('REVIEW', 'fresh session / read-only reviewer')), '/review 0003');
  assert.equal(nextFor(row('VERIFY', 'QA')), '/verify 0003');
  for (const r of [row('ANALYZE', 'human'), row('PLAN', 'human'), row('SHIP', 'human'), row('shipped', ''), row('unclear: a plan exists but the spec is Draft', '')]) {
    assert.equal(nextFor(r), null, r.stage);
  }
});

test('G-1: the table names the stages and who as scripts/status writes them', () => {
  const status = fs.readFileSync(path.join(repo, 'scripts', 'status'), 'utf8');
  for (const s of SEGMENTS) {
    assert.ok(new RegExp(`stage="${s.stage}"; who="${s.who.replace(/\//g, '\\/')}"`).test(status), `${s.stage} · ${s.who} not in scripts/status`);
  }
});

test('AC-2: the command in the picked agent\'s form', () => {
  assert.ok(nextBox('/build 0003', { ...claude, agent: 'codex', have: ['codex'] }).includes('<code class="cmd">$build 0003</code>'));
  for (const agent of ['claude-code', 'github-copilot', 'cursor'] as const) {
    assert.ok(nextBox('/build 0003', { ...claude, agent }).includes('<code class="cmd">/build 0003</code>'), agent);
  }
});

test('AC-3: Continue only under Start\'s rule; the reason when not; the session it wants', () => {
  assert.equal(canContinue(claude), true);
  assert.equal(canContinue({ ...claude, claude: false }), false);
  assert.equal(canContinue({ ...claude, have: [] }), false);
  assert.equal(canContinue({ ...claude, agent: 'cursor', have: ['claude-code', 'cursor'] }), false);
  const go = nextBox('/build 0003', claude);
  assert.ok(go.includes('<code class="cmd">/build 0003</code><button id="copy" class="secondary" data-keep="1">Copy</button><button id="continue" class="primary">Continue in Claude Code</button>'));
  assert.ok(go.includes('Or tell the session that is waiting to go on.'));
  assert.ok(!nextBox('/build 0003', { ...claude, claude: false }).includes('id="continue"'));
  assert.ok(nextBox('/build 0003', { ...claude, claude: false }).includes('Claude Code was not found on PATH'));
  assert.ok(nextBox('/build 0003', { ...claude, have: [] }).includes('Continue waits for the Claude Code adapter'));
  assert.ok(nextBox('/build 0003', { ...claude, agent: 'cursor' }).includes('Copy it into Cursor&#39;s chat.'));
  assert.ok(!nextBox('/build 0003').includes('id="continue"'));
  for (const c of ['/review 0003', '/verify 0003']) {
    assert.equal(fresh(c), true);
    assert.ok(nextBox(c, claude).includes('A fresh session: the producer never verifies its own work.'), c);
    assert.ok(!nextBox(c, claude).includes('waiting to go on'), c);
  }
  assert.equal(fresh('/build 0003'), false);
});

test('AC-3: the approval panel, reopened at BUILD, shows the command; the answer box after an approval offers Continue', () => {
  const r = row('BUILD', 'Developer', '/build');
  const v = { row: r, file: 'specs/plans/0003-plan.md', sections: [], offer: offer({ row: r, opened: false, shell: true, running: null }), result: null, approver: 'x', nonce: 'n', cspSource: 'c' };
  const h = panel({ ...v, agent: claude });
  assert.ok(h.includes('<code class="cmd">/build 0003</code>'));
  assert.ok(h.includes('<button id="continue" class="primary">Continue in Claude Code</button>'));
  assert.ok(h.includes('BUILD: waiting for Developer.'));
  // a human row: no command
  const p = row('PLAN', 'human', 'approve the plan');
  assert.ok(!panel({ ...v, row: p, offer: offer({ row: p, opened: false, shell: true, running: null }), agent: claude }).includes('class="cmd"'));
  const after = answerBox({ written: true, code: 0, text: 'approve-plan 0003: approved', next: '/build 0003' }, 'Plan approved', claude);
  assert.ok(after.includes('<button id="continue" class="primary">Continue in Claude Code</button>'));
  assert.ok(!answerBox({ written: false, code: 1, text: 'no', next: '' }, 'x', claude).includes('id="continue"'));
});

test('AC-3: the triage screen names the review to run before its report is pasted', () => {
  const r = row('REVIEW', 'fresh session / read-only reviewer');
  const v = { row: r, plan: 'specs/plans/0003-plan.md', kind: 'review' as const, kinds: ['review' as const], report: '', decisions: null, preview: null, problems: [], shell: true, running: false, result: null, nonce: 'n', cspSource: 'c' };
  const h = triage({ ...v, agent: claude });
  assert.ok(h.includes('First run it — then paste its report'));
  assert.ok(h.includes('<code class="cmd">/review 0003</code>'));
  assert.ok(h.indexOf('/review 0003') < h.indexOf('id="split"'));
  assert.ok(triage({ ...v, row: row('VERIFY', 'QA'), kind: 'verify', agent: claude }).includes('<code class="cmd">/verify 0003</code>'));
  // once the report is split, or after the save, the first step is gone
  assert.ok(!triage({ ...v, decisions: [], agent: claude }).includes('First run it'));
  assert.ok(!triage({ ...v, result: { written: true, code: 0, text: 'ok', next: '/verify 0003' }, agent: claude }).includes('First run it'));
});
