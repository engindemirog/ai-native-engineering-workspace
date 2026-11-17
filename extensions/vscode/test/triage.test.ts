import { test } from 'node:test';
import assert from 'node:assert/strict';
import { problems, round, nextB, write, html, oneLine, type Decision } from '../src/triage.ts';
import type { Finding } from '../src/report.ts';
import type { Row } from '../src/status.ts';

const f = (id: string, title: string, severity: Finding['severity'] = 'Low', recommendation = ''): Finding => ({ id, severity, title, detail: '', recommendation });
const plan = '# Plan 0004\n\n## Triage\n\n### Review round 1 — Ada, 2026-11-01\n| x | real | y |\n\n### VERIFY round 1 — Ada, 2026-11-02\n';
const backlog = '# Backlog\n\n- **B-3** — old — Source: spec 0002\n- **B-7** — older\n';
const ctx = { kind: 'review' as const, spec: '0004', plan, backlog, name: 'Ada Lovelace', today: '2026-11-17' };

test('Save waits for a decision on every finding, a rationale for noise and a text for each', () => {
  const ds: Decision[] = [
    { finding: f('H-1', 'opened per decision'), verdict: 'real', note: '' },
    { finding: f('L-1', 'palette'), verdict: null, note: '' },
    { finding: f('L-2', 'wording'), verdict: 'noise', note: ' ' },
    { finding: f('L-3', '  '), verdict: 'investigate', note: '' },
  ];
  assert.deepEqual(problems(ds), ['L-1: no decision yet', 'L-2: noise needs its rationale', 'L-3: the finding has no text']);
  assert.deepEqual(problems([{ finding: f('L-1', 'x'), verdict: 'defer', note: '' }]), []);
  assert.deepEqual(problems([]), []);
});

test('the round and the next backlog number are read as gate and the backlog have them', () => {
  assert.equal(round(plan, 'review'), 2);
  assert.equal(round(plan, 'verify'), 2);
  assert.equal(round('# Plan\n\n## Triage\n', 'verify'), 1);
  assert.equal(round('## Notes\n### Review round 1\n## Triage\n', 'review'), 1);
  assert.equal(nextB(backlog), 8);
  assert.equal(nextB('# Backlog\n'), 1);
});

test('the gate call: one --finding per decision, a defer gets its backlog entry and its B-<n> in the note', () => {
  const w = write([
    { finding: f('H-1', 'approve | unlocked\twhile open', 'High'), verdict: 'real', note: 'fix-1' },
    { finding: f('L-1', 'cards cut short', 'Low', 'join the lines'), verdict: 'defer', note: 'fix rounds used up' },
    { finding: f('Info-1', 'triage stage'), verdict: 'noise', note: 'no such stage' },
    { finding: f('L-2', 'pipes'), verdict: 'defer', note: 'already B-3' },
  ], ctx);
  assert.deepEqual(w.args, ['triage', '0004', '--review',
    '--finding', 'H-1 approve / unlocked while open', 'real', 'fix-1',
    '--finding', 'L-1 cards cut short', 'defer', 'B-8 — fix rounds used up',
    '--finding', 'Info-1 triage stage', 'noise', 'no such stage',
    '--finding', 'L-2 pipes', 'defer', 'already B-3']);
  assert.deepEqual(w.entries, ['- **B-8** — cards cut short — Source: spec 0004, review round 2 (L-1) — Severity: Low — Recommendation: join the lines — Deferred by: Ada Lovelace, 2026-11-17, fix rounds used up']);
  assert.equal(w.preview.split('\n')[0], '### Review round 2 — Ada Lovelace, 2026-11-17');
  assert.ok(w.preview.includes('| L-1 cards cut short | defer | B-8 — fix rounds used up |'));
  for (const a of w.args) assert.ok(!/[|\t\n]/.test(a), a);
});

test('a clean round writes the heading only; a verify round says so', () => {
  const w = write([], { ...ctx, kind: 'verify' });
  assert.deepEqual(w.args, ['triage', '0004', '--verify']);
  assert.equal(w.preview, '### VERIFY round 2 — Ada Lovelace, 2026-11-17');
  assert.deepEqual(w.entries, []);
  assert.throws(() => write([{ finding: f('L-1', 'x'), verdict: null, note: '' }], ctx), /no decision yet/);
  assert.equal(oneLine(' a |\tb\n c '), 'a / b c');
});

const row: Row = { spec: '0004', name: 'report', spec_status: '', plan_status: '', stage: 'REVIEW', who: 'fresh session / read-only reviewer', next: '', warnings: [], notes: [] };
const view = (over = {}) => ({
  row, plan: 'specs/plans/0004-plan.md', kind: 'review' as const, kinds: ['review' as const], report: '', decisions: null, preview: null,
  problems: [], shell: true, running: false, result: null, nonce: 'n0nce', cspSource: 'vscode-resource:', ...over,
});

test('the screen: paste first; then one card per finding, no verdict chosen, Save only when complete', () => {
  const first = html(view());
  assert.ok(first.includes('<button id="split" class="primary">Split into findings</button>'));
  assert.ok(first.includes('<button id="clean" class="secondary">Clean round — no findings</button>'));
  assert.ok(!first.includes('id="save"'));
  const ds: Decision[] = [{ finding: f('H-1', 'opened <b>', 'High', 'key it by file'), verdict: null, note: '' }];
  const open = html(view({ decisions: ds, problems: problems(ds) }));
  assert.ok(open.includes('1 finding(s) read from the report · 0 / 1 decided'));
  assert.equal((open.match(/aria-pressed="true">/g) ?? []).length, 0);
  assert.ok(open.includes('<button id="save" class="primary" disabled>Save triage</button>'));
  assert.ok(open.includes('value="opened &lt;b&gt;"'));
  assert.ok(open.includes('<strong>Recommendation:</strong> key it by file'));
  const done: Decision[] = [{ ...ds[0], verdict: 'real' }];
  const ready = html(view({ decisions: done, problems: [], preview: write(done, ctx) }));
  assert.ok(ready.includes('<button id="v-0-real" class="secondary" data-keep="1" aria-pressed="true">real</button>'));
  assert.ok(ready.includes('<button id="save" class="primary">Save triage</button>'));
  assert.ok(ready.includes('### Review round 2 — Ada Lovelace, 2026-11-17'));
  assert.ok(!/https?:\/\//.test(ready));
});

test('without a shell or while gate runs, Save is not offered', () => {
  const ds: Decision[] = [{ finding: f('L-1', 'x'), verdict: 'real', note: '' }];
  assert.ok(html(view({ decisions: ds, shell: false })).includes('<button id="save" class="primary" disabled>'));
  assert.ok(html(view({ decisions: ds, running: true })).includes('Running ./scripts/gate triage…'));
});

test('a finding whose id names no severity carries it in front, as status reads it', () => {
  const t = (id: string, severity: Finding['severity']) => write([{ finding: f(id, 'x', severity), verdict: 'real', note: '' }], ctx).args[4];
  assert.equal(t('H-1', 'High'), 'H-1 x');
  assert.equal(t('Info-2', 'Info'), 'Info-2 x');
  assert.equal(t('L-a', 'Low'), 'Low L-a x');
  assert.equal(t('F-1', 'Medium'), 'Medium F-1 x');
  assert.equal(t('F-2', ''), 'F-2 x');
});
