// triage.withBacklog against a real file in a temp directory: what the triage screen writes to
// specs/backlog.md around the gate call, and what it puts back (spec 0010, AC-4; review round 2, L-7).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { withBacklog, type BacklogIO } from '../src/triage.ts';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anew-backlog-'));
process.on('exit', () => fs.rmSync(dir, { recursive: true, force: true }));
let n = 0;
function file(content: string | null): { io: BacklogIO; text: () => string | null } {
  const f = path.join(dir, `backlog-${n++}.md`);
  if (content !== null) fs.writeFileSync(f, content);
  return {
    io: { read: () => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null), write: (t) => fs.writeFileSync(f, t), remove: () => fs.rmSync(f, { force: true }) },
    text: () => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null),
  };
}
const still = async () => 'abc';
const entry = ['- **B-8** — x'];

test('written: the entries stay', async () => {
  const b = file('# Backlog\n');
  let during: string | null = null;
  const a = await withBacklog(b.io, entry, async () => { during = b.text(); return { written: true }; }, still);
  assert.equal(a.written, true);
  assert.equal(during, '# Backlog\n- **B-8** — x\n'); // gate sees the entry
  assert.equal(b.text(), '# Backlog\n- **B-8** — x\n');
});

test('refused: the file is as it was', async () => {
  const b = file('# Backlog\n- **B-7** — y');
  await withBacklog(b.io, entry, async () => ({ written: false }), still);
  assert.equal(b.text(), '# Backlog\n- **B-7** — y');
});

test('refused, and there was no file: there is none again', async () => {
  const b = file(null);
  await withBacklog(b.io, entry, async () => ({ written: false }), still);
  assert.equal(b.text(), null);
});

test('the call fails: the file is put back and the error goes on', async () => {
  const b = file('# Backlog\n');
  await assert.rejects(withBacklog(b.io, entry, async () => { throw new Error('spawn failed'); }, still), /spawn failed/);
  assert.equal(b.text(), '# Backlog\n');
});

test('HEAD moved (gate committed, then was interrupted): the entries stay, the table names them', async () => {
  const b = file('# Backlog\n');
  let h = 'abc';
  await withBacklog(b.io, entry, async () => { h = 'def'; return { written: false }; }, async () => h);
  assert.equal(b.text(), '# Backlog\n- **B-8** — x\n');
});

test('no defer: the file is not touched', async () => {
  const b = file('# Backlog');
  await withBacklog(b.io, [], async () => ({ written: false }), still);
  assert.equal(b.text(), '# Backlog');
});
