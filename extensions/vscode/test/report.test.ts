import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { split } from '../src/report.ts';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'reports');
const read = (f: string) => split(fs.readFileSync(path.join(dir, f), 'utf8'));
const ids = (f: string) => read(f).map((x) => `${x.id}:${x.severity}`);

// The reports spec 0009 was triaged on (and 0007's, for other shapes), as the subagents returned
// them. The ids below are the ones the human triaged.
test('0009 review round 1: one High, five Low, five Info', () => {
  assert.deepEqual(ids('0009-review-1.md'), ['H-1:High', 'L-1:Low', 'L-2:Low', 'L-3:Low', 'L-4:Low', 'L-5:Low', 'Info-1:Info', 'Info-2:Info', 'Info-3:Info', 'Info-4:Info', 'Info-5:Info']);
  const h = read('0009-review-1.md')[0];
  assert.match(h.title, /^Correctness/);
  assert.match(h.detail, /opened/);
});

test('0009 re-review of fix-1: the resolved list is not findings; the new ones get ids', () => {
  const r = read('0009-review-2.md');
  assert.deepEqual(r.map((x) => `${x.id}:${x.severity}`), ['L-1:Low', 'L-2:Low', 'Info-1:Info']);
  assert.equal(r[0].title, "one spec's gate answer can be shown on another spec's panel");
  assert.match(r[0].recommendation, /^capture `const spec = this.spec`/);
});

test('0009 VERIFY round 1: lettered ids and a severity next to them', () => {
  const r = read('0009-verify-1.md');
  assert.deepEqual(r.map((x) => `${x.id}:${x.severity}`), ['L-a:Low', 'L-b:Low', 'L-c:Low', 'Info-1:Info', 'Info-2:Info']);
  assert.match(r[0].title, /^the panel never shows its "no shell" state/);
});

test('0009 review of fix-3: severity words without ids; the regressions section is not findings', () => {
  const r = read('0009-review-4.md');
  assert.deepEqual(r.map((x) => `${x.id}:${x.severity}`), ['L-1:Low', 'L-2:Low', 'L-3:Low', 'L-4:Low', 'Info-1:Info']);
  assert.match(r[0].title, /^wrapped criteria are cut short/);
  assert.match(r[3].recommendation, /^split on unescaped pipes/);
  assert.match(r[4].title, /approver/);
});

test('0009 VERIFY round 2', () => {
  const r = read('0009-verify-2.md');
  assert.deepEqual(r.map((x) => `${x.id}:${x.severity}`), ['L-1:Low', 'L-2:Low', 'L-3:Low', 'Info-1:Info', 'Info-2:Info']);
  assert.match(r[0].recommendation, /^add a spec-section case/);
});

test('0007: ids with a severity in parentheses or after them', () => {
  assert.deepEqual(ids('0007-review-1.md'), ['H-1:High', 'M-1:Medium', 'M-2:Medium', 'L-1:Low', 'L-2:Low', 'L-3:Low', 'L-4:Low', 'Info-1:Info', 'Info-2:Info', 'Info-3:Info']);
  assert.deepEqual(ids('0007-verify-1.md'), ['F-1:Low', 'F-2:Low', 'F-3:Low']);
  assert.match(read('0007-review-1.md')[7].recommendation, /trap/);
});

test('a clean report and prose without ids give no finding, never a guessed one', () => {
  assert.deepEqual(split('## Review round 2 · fix rounds so far: 1\n\nClean. All findings resolved; nothing new.\n'), []);
  assert.deepEqual(split('I looked at the diff. The error message could be friendlier, and the test name is long.\n- **Note:** nothing blocks.'), []);
  assert.deepEqual(split(''), []);
});

test('a finding written as a heading, and one inside a fenced block is not one', () => {
  const r = split('### M-1 (Medium) — rounding at the limit\nThe 99,995 case. Recommendation: round half up.\n\n```\n**H-9** not a finding\n```\n');
  assert.deepEqual(r.map((x) => [x.id, x.severity, x.title, x.recommendation]), [['M-1', 'Medium', 'rounding at the limit', 'round half up.']]);
});
