// The extension against this repo's real scripts/status and scripts/gate, in fixture git repos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findShell, runScript } from '../src/shell.ts';
import { parseStatus, writeFor } from '../src/status.ts';
import { gateArgs, answer } from '../src/gate.ts';
import { write as triageWrite, type Decision } from '../src/triage.ts';
import { offered } from '../src/ship.ts';
import { ADAPTERS, existsIn, initArgs, installed } from '../src/setup.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const shell = findShell({ setting: process.env.ANEW_TEST_SHELL ?? '', platform: process.platform, pathEnv: process.env.PATH ?? '' });
const skip = shell === null ? 'no POSIX shell on this machine' : false;
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anew-ext-'));
process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));

function git(dir: string, ...args: string[]): string {
  return execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();
}

const spec = (status: string) => ['# Spec 0001 — demo', '', `- Status: ${status}`, '- Mode: lite',
  '- Plan: `specs/plans/0001-plan.md`', '- Self-critique: done', '', '## Intent', 'Demo intent.', '',
  '## Requirements', '1. It works.', '', '## Acceptance criteria', '- [ ] AC-1 — it works', ''].join('\n');
const plan = ['# Plan 0001 — demo', '', '- Spec: `specs/active/0001-demo.md`', '- Status: Awaiting approval',
  '- Approved by / on: —', '', '## Files to change or add', '- app.txt', '', '## Ordered steps', '1. Write app.txt.', '',
  '## Build evidence', ''].join('\n');

// A fixture repo: the two scripts, one Draft spec, committed. `name` keeps twins apart.
function fixture(name: string): string {
  const dir = path.join(tmp, name);
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'specs', 'active'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'specs', 'plans'), { recursive: true });
  for (const s of ['status', 'gate']) {
    fs.copyFileSync(path.join(repo, 'scripts', s), path.join(dir, 'scripts', s));
    fs.chmodSync(path.join(dir, 'scripts', s), 0o755);
  }
  fs.writeFileSync(path.join(dir, 'specs', 'active', '0001-demo.md'), spec('Draft'));
  git(dir, 'init', '-q');
  git(dir, 'config', 'user.name', 'fixture');
  git(dir, 'config', 'user.email', 'fixture@example.invalid');
  git(dir, 'config', 'core.autocrlf', 'false');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'draft');
  return dir;
}

// The same decision typed in a terminal: one command line for the shell.
function terminal(dir: string, line: string): void {
  execFileSync(shell as string, ['-c', line], { cwd: dir, stdio: 'pipe' });
}

function snapshot(dir: string) {
  return { tree: git(dir, 'rev-parse', 'HEAD^{tree}'), message: git(dir, 'log', '-1', '--format=%B'),
    author: git(dir, 'log', '-1', '--format=%an'), count: git(dir, 'rev-list', '--count', 'HEAD'), dirty: git(dir, 'status', '--porcelain') };
}

test('the list reads the real scripts/status --json', { skip }, async () => {
  const dir = fixture('list');
  const r = await runScript(shell as string, dir, 'status', ['--json']);
  assert.equal(r.code, 0, r.stderr);
  const s = parseStatus(r.stdout);
  assert.equal(s.rows.length, 1);
  assert.equal(s.rows[0].stage, 'ANALYZE');
  assert.equal(writeFor(s.rows[0]), 'approve-spec');
});

test('approve-spec and approve-plan leave what the terminal call leaves', { skip }, async () => {
  const a = fixture('twin-a');
  const b = fixture('twin-b');
  const r1 = await runScript(shell as string, a, 'gate', gateArgs('approve-spec', '0001'));
  assert.equal(answer(r1.code, r1.stdout, r1.stderr).written, true, r1.stderr);
  terminal(b, './scripts/gate approve-spec 0001');
  assert.deepEqual(snapshot(a), snapshot(b));

  for (const d of [a, b]) fs.writeFileSync(path.join(d, 'specs', 'plans', '0001-plan.md'), plan);
  const st = parseStatus((await runScript(shell as string, a, 'status', ['--json'])).stdout);
  assert.equal(writeFor(st.rows[0]), 'approve-plan');
  const r2 = await runScript(shell as string, a, 'gate', gateArgs('approve-plan', '0001'));
  const ans = answer(r2.code, r2.stdout, r2.stderr);
  assert.equal(ans.written, true, r2.stderr);
  assert.match(ans.text, /^approve-plan 0001: .* — specs\/plans\/0001-plan\.md @[0-9a-f]+/);
  terminal(b, './scripts/gate approve-plan 0001');
  assert.deepEqual(snapshot(a), snapshot(b));
  assert.match(fs.readFileSync(path.join(a, 'specs', 'plans', '0001-plan.md'), 'utf8'), /^- Approved by \/ on: fixture, \d{4}-\d{2}-\d{2}$/m);
});

test('a refusal shows gate\'s message and writes nothing', { skip }, async () => {
  const dir = fixture('refused');
  const before = snapshot(dir);
  const r = await runScript(shell as string, dir, 'gate', gateArgs('approve-plan', '0001'));
  const ans = answer(r.code, r.stdout, r.stderr);
  assert.equal(ans.written, false);
  assert.equal(ans.code, 1);
  assert.match(ans.text, /^gate: /);
  assert.deepEqual(snapshot(dir), before);
});

// A fixture at REVIEW: spec and plan approved through gate, the spec In progress, the plan's
// build evidence recorded at HEAD, a backlog file — the state /build leaves.
async function atReview(name: string): Promise<string> {
  const dir = fixture(name);
  terminal(dir, './scripts/gate approve-spec 0001');
  fs.writeFileSync(path.join(dir, 'specs', 'plans', '0001-plan.md'), plan);
  terminal(dir, './scripts/gate approve-plan 0001');
  const specFile = path.join(dir, 'specs', 'active', '0001-demo.md');
  fs.writeFileSync(specFile, fs.readFileSync(specFile, 'utf8').replace('- Status: Approved', '- Status: In progress'));
  fs.writeFileSync(path.join(dir, 'specs', 'backlog.md'), '# Backlog — deferred findings\n');
  fs.mkdirSync(path.join(dir, 'specs', 'done'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'specs', 'done', 'README.md'), '# Shipped specs\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'build');
  const p = path.join(dir, 'specs', 'plans', '0001-plan.md');
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace('## Build evidence\n', `## Build evidence\n- CHECK GREEN (full, 1 passed) @${git(dir, 'rev-parse', '--short', 'HEAD')}\n`) + '\n## Triage\n');
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'evidence');
  return dir;
}

// Twins built at different moments name different evidence shas, so they compare by what the
// decision itself changed: the last commit's diff, plus message, author, count and dirty files.
function change(dir: string) {
  const { tree: _tree, ...rest } = snapshot(dir);
  return { ...rest, diff: git(dir, 'show', '--format=', '--unified=0', 'HEAD').split('\n').filter((l) => !l.startsWith('index ')).join('\n') };
}

const quote = (a: string) => `'${a.replace(/'/g, String.raw`'\''`)}'`;

test('triage: the screen\'s gate call leaves what the terminal call leaves; then VERIFY, then a clean round reaches SHIP', { skip }, async () => {
  const a = await atReview('triage-a');
  const b = await atReview('triage-b');
  const st = parseStatus((await runScript(shell as string, a, 'status', ['--json'])).stdout);
  assert.equal(st.rows[0].stage, 'REVIEW');
  const ds: Decision[] = [
    { finding: { id: 'L-a', severity: 'Low', title: "a | pipe and 'quotes'", detail: '', recommendation: 'later' }, verdict: 'defer', note: 'not now' },
    { finding: { id: 'Info-1', severity: 'Info', title: 'wording', detail: '', recommendation: '' }, verdict: 'noise', note: 'style only' },
  ];
  const ctx = { kind: 'review' as const, spec: '0001', plan: fs.readFileSync(path.join(a, 'specs', 'plans', '0001-plan.md'), 'utf8'),
    backlog: fs.readFileSync(path.join(a, 'specs', 'backlog.md'), 'utf8'), name: 'fixture', today: '2026-11-17' };
  const w = triageWrite(ds, ctx);
  for (const d of [a, b]) fs.appendFileSync(path.join(d, 'specs', 'backlog.md'), w.entries.join('\n') + '\n');
  const r = await runScript(shell as string, a, 'gate', w.args);
  const ans = answer(r.code, r.stdout, r.stderr);
  assert.equal(ans.written, true, r.stderr);
  assert.match(ans.text, /^triage 0001: Review round 1/);
  terminal(b, `./scripts/gate ${w.args.map(quote).join(' ')}`);
  assert.deepEqual(change(a), change(b));
  const after = parseStatus((await runScript(shell as string, a, 'status', ['--json'])).stdout).rows[0];
  assert.equal(after.stage, 'VERIFY');

  const clean = triageWrite([], { ...ctx, kind: 'verify', plan: fs.readFileSync(path.join(a, 'specs', 'plans', '0001-plan.md'), 'utf8') });
  const r2 = await runScript(shell as string, a, 'gate', clean.args);
  assert.equal(r2.code, 0, r2.stderr);
  terminal(b, './scripts/gate triage 0001 --verify');
  assert.deepEqual(change(a), change(b));
  assert.equal(parseStatus((await runScript(shell as string, a, 'status', ['--json'])).stdout).rows[0].stage, 'SHIP');
});

test('triage: a refusal (a defer whose entry is missing) writes nothing', { skip }, async () => {
  const dir = await atReview('triage-refused');
  const before = snapshot(dir);
  const r = await runScript(shell as string, dir, 'gate', ['triage', '0001', '--review', '--finding', 'L-1 x', 'defer', 'B-9']);
  const ans = answer(r.code, r.stdout, r.stderr);
  assert.equal(ans.written, false);
  assert.match(ans.text, /B-9 is not in specs\/backlog\.md/);
  assert.deepEqual(snapshot(dir), before);
});

test('ship: the screen\'s gate call leaves what the terminal call leaves; before SHIP it is refused', { skip }, async () => {
  const a = await atReview('ship-a');
  const b = await atReview('ship-b');
  const early = await runScript(shell as string, a, 'gate', ['ship', '0001']);
  assert.equal(answer(early.code, early.stdout, early.stderr).written, false);
  for (const d of [a, b]) {
    terminal(d, './scripts/gate triage 0001 --review');
    terminal(d, './scripts/gate triage 0001 --verify');
  }
  const row = parseStatus((await runScript(shell as string, a, 'status', ['--json'])).stdout).rows[0];
  assert.equal(row.stage, 'SHIP');
  assert.equal(offered(row).ok, true);
  const r = await runScript(shell as string, a, 'gate', ['ship', '0001']);
  const ans = answer(r.code, r.stdout, r.stderr);
  assert.equal(ans.written, true, r.stderr);
  assert.match(ans.text, /^ship 0001: .*specs\/done\/0001-demo\.md @[0-9a-f]+/);
  terminal(b, './scripts/gate ship 0001');
  assert.deepEqual(change(a), change(b));
  assert.ok(fs.existsSync(path.join(a, 'specs', 'done', '0001-demo.md')));
  assert.match(fs.readFileSync(path.join(a, 'specs', 'done', '0001-demo.md'), 'utf8'), /^- \[x\] AC-1 — it works$/m);
});

// A bare template copy for init: scripts/init and adapters/, nothing installed.
function initFixture(name: string): string {
  const dir = path.join(tmp, name);
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(repo, 'scripts', 'init'), path.join(dir, 'scripts', 'init'));
  fs.cpSync(path.join(repo, 'adapters'), path.join(dir, 'adapters'), { recursive: true });
  return dir;
}

function files(dir: string, under = ''): string[] {
  return fs.readdirSync(path.join(dir, under), { withFileTypes: true }).flatMap((e) => {
    const rel = under ? `${under}/${e.name}` : e.name;
    return e.isDirectory() ? files(dir, rel) : [rel];
  });
}

test('setup: what init writes for each adapter is what the confirmation lists, and the marker is among it', { skip }, async () => {
  for (const a of ADAPTERS) {
    const dir = initFixture(`init-${a.id}`);
    const before = new Set(files(dir));
    const r = await runScript(shell as string, dir, 'init', initArgs(a.id));
    assert.equal(r.code, 0, r.stderr);
    const wrote = files(dir).filter((f) => !before.has(f));
    assert.ok(wrote.length > 0, a.id);
    for (const f of wrote) assert.ok(a.writes.some((w) => w.endsWith('/') ? f.startsWith(w) : f === w), `${a.id}: ${f} is not in the list`);
    for (const w of a.writes) assert.ok(wrote.some((f) => w.endsWith('/') ? f.startsWith(w) : f === w), `${a.id}: ${w} is listed but not written`);
    assert.deepEqual(installed(existsIn(dir)), [a.id]);
  }
});

test('install: the screen\'s init call leaves what the terminal call leaves; an existing file is kept and named', { skip }, async () => {
  const a = initFixture('install-a');
  const b = initFixture('install-b');
  for (const dir of [a, b]) {
    fs.mkdirSync(path.join(dir, '.cursor', 'rules'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.cursor', 'rules', 'anew.mdc'), 'our own rule\n');
  }
  const r = await runScript(shell as string, a, 'init', initArgs('cursor'));
  terminal(b, './scripts/init cursor');
  assert.equal(r.code, 0, r.stderr);
  const tree = (dir: string) => files(dir).sort().map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8')]);
  assert.deepEqual(tree(a), tree(b));
  assert.equal(fs.readFileSync(path.join(a, '.cursor', 'rules', 'anew.mdc'), 'utf8'), 'our own rule\n');
  assert.match(r.stdout, /^kept {3}\.cursor\/rules\/anew\.mdc \(exists — use --force to overwrite\)$/m);
});
