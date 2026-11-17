import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { mode, command, nextNumber, findClaude, html, KINDS } from '../src/start.ts';

test('each kind builds its command from the description, on one line', () => {
  assert.equal(command('feature', 'export a month\n  as CSV ', 'lite'), '/new-feature export a month as CSV');
  assert.equal(command('change', 'rounding to cents, JIRA-12', 'lite'), '/change rounding to cents, JIRA-12');
  assert.equal(command('fix', 'total off by one cent', 'lite'), '/fix-bug total off by one cent');
  assert.equal(command('refactor', 'split the report', 'lite'), '/refactor split the report');
  assert.equal(command('feature', '   ', 'lite'), null);
  assert.deepEqual(KINDS.map((k) => k.cmd), ['/new-feature', '/change', '/fix-bug', '/refactor']);
});

test('strict mode starts a new feature with /analyze; the other kinds keep theirs', () => {
  assert.equal(command('feature', 'export', 'strict'), '/analyze export');
  assert.equal(command('fix', 'bug', 'strict'), '/fix-bug bug');
});

test('the mode is AGENTS.md\'s Mode line', () => {
  assert.equal(mode('# x\n**Mode: lite** — set at bootstrap'), 'lite');
  assert.equal(mode('**Mode: strict** — x'), 'strict');
  assert.equal(mode('**Mode: unset** — bootstrap sets'), 'unset');
  assert.equal(mode('no line'), 'unset');
});

test('the likely number: the highest in active, done and plans, plus one', () => {
  assert.equal(nextNumber(['0001-a.md', '0007-plan.md', 'README.md', 'TEMPLATE.md', '0005-b.md']), '0008');
  assert.equal(nextNumber(['README.md']), '0001');
});

test('claude is found as a program: on PATH, or the exe behind the npm shim; else none', () => {
  const win = String.raw`C:\npm`;
  const shim = '@ECHO off\r\n' + String.raw`"%dp0%\node_modules\@anthropic-ai\claude-code\bin\claude.exe"   %*` + '\r\n';
  const exe = String.raw`C:\npm\node_modules\@anthropic-ai\claude-code\bin\claude.exe`;
  const files = new Set([String.raw`C:\npm\claude.cmd`, exe]);
  assert.equal(findClaude({ platform: 'win32', pathEnv: String.raw`C:\x;C:\npm`, exists: (p) => files.has(p), read: () => shim }), exe);
  assert.equal(findClaude({ platform: 'win32', pathEnv: String.raw`C:\y`, exists: (p) => p === String.raw`C:\y\claude.exe`, read: () => '' }), String.raw`C:\y\claude.exe`);
  assert.equal(findClaude({ platform: 'win32', pathEnv: win, exists: (p) => p.endsWith('claude.cmd'), read: () => '@echo off\r\nnode cli.js %*' }), null);
  assert.equal(findClaude({ platform: 'linux', pathEnv: '/usr/bin:/home/a/.local/bin', exists: (p) => p === '/home/a/.local/bin/claude', read: () => '' }), '/home/a/.local/bin/claude');
  assert.equal(findClaude({ platform: 'darwin', pathEnv: '/usr/bin', exists: () => false, read: () => '' }), null);
});

const view = { kind: 'feature' as const, description: '', mode: 'lite' as const, number: '0011', claude: true, started: null, nonce: 'n0nce', cspSource: 'vscode-resource:' };

test('the screen: kinds as pressed buttons, the command shown before anything runs, Start only with claude', () => {
  const empty = html(view);
  assert.ok(empty.includes('<button id="kind-feature" class="kind" aria-pressed="true"'));
  assert.ok(empty.includes('<button id="kind-fix" class="kind" aria-pressed="false"'));
  assert.ok(empty.includes('<button id="start" class="primary" disabled>Start in Claude Code</button>'));
  assert.ok(empty.includes('data-cmd="/new-feature"'));
  const full = html({ ...view, description: 'export <a month>' });
  assert.ok(full.includes('>/new-feature export &lt;a month&gt;</pre>'));
  assert.ok(full.includes('<button id="start" class="primary">Start in Claude Code</button>'));
  const none = html({ ...view, claude: false, description: 'x' });
  assert.ok(!none.includes('id="start"'));
  assert.ok(none.includes('Claude Code was not found on PATH'));
  assert.ok(html({ ...view, mode: 'strict' }).includes('data-cmd="/analyze"'));
  assert.equal((full.match(/<script nonce="n0nce">/g) ?? []).length, 2);
  assert.ok(!/https?:\/\//.test(full));
});

test('the live preview script collapses whitespace as command() does', () => {
  assert.ok(html(view).includes(String.raw`ta.value.replace(/\s+/g, ' ').trim()`));
});
