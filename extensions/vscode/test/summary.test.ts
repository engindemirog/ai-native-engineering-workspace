import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sections, SPEC_SECTIONS, PLAN_SECTIONS } from '../src/summary.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const plan = [
  '# Plan 0004 — monthly report', '', '- Status: Awaiting approval', '- Approved by / on: —', '',
  '## Files to change or add', '<!-- Path by path. -->', '- app/report.py (new)', '- app/cli.py', '',
  '## Ordered steps', '1. Report first.', '',
  '## Risks & open questions', '<!-- Each with YOUR recommendation',
  '     spanning two lines. -->', '1. Month boundary. Recommendation: local time.', '',
  '## Criterion ↔ test map', '| Acceptance criterion | Proven by | Profile |', '|---|---|---|', '| AC-1 | `test_month_totals` | full |', '',
  '## Build evidence', '',
].join('\n');

test('a plan: its three sections, in the file\'s order, without template comments', () => {
  const s = sections(plan, PLAN_SECTIONS);
  assert.deepEqual(s.map((x) => x.title), ['Files to change or add', 'Risks & open questions', 'Criterion ↔ test map']);
  assert.equal(s[0].body, '- app/report.py (new)\n- app/cli.py');
  assert.equal(s[1].body, '1. Month boundary. Recommendation: local time.');
  assert.match(s[2].body, /\| AC-1 \| `test_month_totals` \| full \|/);
});

test('a spec: intent and acceptance criteria', () => {
  const spec = '# Spec 0001 — demo\n\n- Status: Draft\n\n## Intent\nWhy.\n\n## Requirements\n1. x\n\n## Acceptance criteria\n- [ ] AC-1 — it works\n';
  assert.deepEqual(sections(spec, SPEC_SECTIONS), [{ title: 'Intent', body: 'Why.' }, { title: 'Acceptance criteria', body: '- [ ] AC-1 — it works' }]);
});

test('the untouched templates: their comments are no summary, their placeholders stay', () => {
  const p = sections(fs.readFileSync(path.join(repo, 'specs/plans/TEMPLATE.md'), 'utf8'), PLAN_SECTIONS);
  assert.deepEqual(p.map((x) => x.title), ['Criterion ↔ test map']);
  assert.match(p[0].body, /^\| Acceptance criterion \| Proven by \| Profile \|/);
  const s = sections(fs.readFileSync(path.join(repo, 'specs/TEMPLATE.md'), 'utf8'), SPEC_SECTIONS);
  assert.deepEqual(s.map((x) => x.title), ['Acceptance criteria']);
  assert.match(s[0].body, /^- \[ \] AC-1 —/);
});

test('a file without the sections gives nothing', () => {
  assert.deepEqual(sections('# Notes\n\nfree text\n', PLAN_SECTIONS), []);
});

test('a heading inside a comment or a fence is not a heading', () => {
  const text = [
    '## Intent', 'Real intent.', '<!--', '## Acceptance criteria', 'commented out', '-->',
    '```', '## Acceptance criteria', '```', 'more intent.',
  ].join('\n');
  const s = sections(text, SPEC_SECTIONS);
  assert.equal(s.length, 1);
  assert.equal(s[0].title, 'Intent');
  assert.equal(s[0].body, 'Real intent.\n```\n## Acceptance criteria\n```\nmore intent.');
});

test('CRLF files read the same', () => {
  assert.deepEqual(sections(plan.replace(/\n/g, '\r\n'), PLAN_SECTIONS), sections(plan, PLAN_SECTIONS));
});
