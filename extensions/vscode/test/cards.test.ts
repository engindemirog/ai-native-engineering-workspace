import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { items, files, pairs, risks, criteria, plain } from '../src/cards.ts';
import { sections, PLAN_SECTIONS, SPEC_SECTIONS } from '../src/summary.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

test('list items keep their continuation lines; text around them is not an item', () => {
  assert.deepEqual(items('intro\n- one\n  more\n- two\n\n1. three'), ['one\nmore', 'two', 'three']);
});

test('files: the path and "(new)", not the description', () => {
  assert.deepEqual(files('- `app/report.py` (new): the report\n- app/cli.py — wires it\n- `docs/domain.md`'),
    ['app/report.py (new)', 'app/cli.py', 'docs/domain.md']);
});

test('the test map: rows only, an empty proof is "no test yet"', () => {
  const t = '| Acceptance criterion | Proven by | Profile |\n|---|---|---|\n| AC-1 | `test_month_totals` | full |\n| AC-2 | | |';
  assert.deepEqual(pairs(t), [{ criterion: 'AC-1', proof: 'test_month_totals' }, { criterion: 'AC-2', proof: '' }]);
});

test('risks: the bold lead or first sentence, then the recommendation', () => {
  assert.deepEqual(risks('1. **Month boundary.** Dates group by local time? Recommendation: local time,\n   tested at 23:30.\n2. Empty month. Recommendation: say so, exit 0.\n3. No advice here'), [
    { title: 'Month boundary', advice: 'Recommendation: local time, tested at 23:30.' },
    { title: 'Empty month', advice: 'Recommendation: say so, exit 0.' },
    { title: 'No advice here', advice: '' },
  ]);
});

test('criteria: "- [ ] AC-n — text" lines; a struck-out criterion keeps its id', () => {
  assert.deepEqual(criteria('- [ ] AC-1 — it **works**\n- [x] AC-2 — done\n- [ ] ~~AC-3 — moved~~ → moved to B-1\nnot one'), [
    { id: 'AC-1', text: 'it works', done: false },
    { id: 'AC-2', text: 'done', done: true },
    { id: 'AC-3', text: 'moved → moved to B-1', done: false },
  ]);
  assert.equal(plain('a `b` **c**\n d'), 'a b c d');
});

test('this repo\'s own plan 0009 and spec 0009 read as cards', () => {
  const plan = Object.fromEntries(sections(fs.readFileSync(path.join(repo, '.anew-dev/plans/0009-plan.md'), 'utf8'), PLAN_SECTIONS).map((s) => [s.title, s.body]));
  assert.ok(files(plan['Files to change or add']).includes('extensions/vscode/package.json (new)'));
  assert.deepEqual(pairs(plan['Criterion ↔ test map']).map((p) => p.criterion), ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5', 'AC-6', 'AC-7']);
  const r = risks(plan['Risks & open questions']);
  assert.equal(r.length, 6);
  assert.equal(r[0].title, 'Node 24\'s type stripping for tests');
  assert.match(r[0].advice, /^Recommendation: accept;/);
  const spec = Object.fromEntries(sections(fs.readFileSync(path.join(repo, '.anew-dev/done/0009-vscode-extension.md'), 'utf8'), SPEC_SECTIONS).map((s) => [s.title, s.body]));
  assert.deepEqual(criteria(spec['Acceptance criteria'])!.map((c) => c.id), ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5', 'AC-6', 'AC-7']);
});

test('B-14: a wrapped criterion keeps its continuation lines', () => {
  assert.deepEqual(criteria('- [ ] AC-1 — the list groups match\n  for a fixture (unit tests).\n- [ ] AC-2 — short'), [
    { id: 'AC-1', text: 'the list groups match for a fixture (unit tests).', done: false },
    { id: 'AC-2', text: 'short', done: false },
  ]);
});

test('B-15: a criterion in another shape makes the list unreadable, not shorter', () => {
  assert.equal(criteria('- [ ] AC-1 — fine\n- [ ] AC-3: other shape'), null);
  assert.equal(criteria('- [ ] AC-1 — fine\n* [ ] AC-2 — star bullet'), null);
  assert.deepEqual(criteria('Some prose.\n- [ ] AC-1 — fine'), [{ id: 'AC-1', text: 'fine', done: false }]);
});

test('B-17: pipes inside a cell; a header that is not "Acceptance criterion"', () => {
  assert.deepEqual(pairs('| AC | Test |\n|---|---|\n| AC-1 | `a \| b` |\n| AC-2 | `x|y` and z |'), [
    { criterion: 'AC-1', proof: 'a | b' },
    { criterion: 'AC-2', proof: 'x|y and z' },
  ]);
});
