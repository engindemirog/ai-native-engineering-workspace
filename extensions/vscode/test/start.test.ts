import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as path from 'node:path';
import { mode, command, bootstrap, nextNumber, findClaude, html, KINDS, type StartView } from '../src/start.ts';
import { ADAPTERS, whyNot, type Tool } from '../src/setup.ts';

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

const view = { kind: 'feature' as const, description: '', mode: 'lite' as const, number: '0011', claude: true, started: null, nonce: 'n0nce', cspSource: 'vscode-resource:',
  agent: 'claude-code' as Tool, have: ['claude-code'] as Tool[], installable: [] as Tool[], bootstrapped: true, shell: true, installing: null as Tool | null, installed: null as StartView['installed'], why: {} as StartView['why'] };

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

test('AC-3: the command follows the picked agent — $ for Codex, / for the others — for every kind and for bootstrap', () => {
  for (const k of KINDS) {
    assert.equal(command(k.id, 'x', 'lite', 'codex'), `$${k.cmd.slice(1)} x`);
    for (const a of ['claude-code', 'github-copilot', 'cursor'] as const) assert.equal(command(k.id, 'x', 'lite', a), `${k.cmd} x`);
  }
  assert.equal(command('feature', 'x', 'strict', 'codex'), '$analyze x');
  assert.equal(bootstrap('codex'), '$bootstrap');
  assert.equal(bootstrap('cursor'), '/bootstrap');
  const h = html({ ...view, agent: 'codex', have: ['codex'], description: 'export' });
  assert.ok(h.includes('>$new-feature export</pre>'));
  assert.ok(h.includes('data-cmd="$new-feature"'));
  assert.ok(h.includes('<code>$fix-bug</code>'));
  assert.ok(!h.includes('id="start"'));
  assert.ok(h.includes('Copy the command into Codex&#39;s chat.'));
});

test('AC-1: the agent card — each adapter installed or not, the pick pressed, Install for a missing one', () => {
  const h = html({ ...view, have: ['claude-code'], installable: ['github-copilot', 'cursor', 'codex'] });
  assert.ok(h.includes('<button id="agent-claude-code" class="secondary small" data-keep="1" aria-pressed="true">Claude Code</button><span class="ok">✓ installed</span></li>'));
  assert.ok(h.includes('<button id="agent-codex" class="secondary small" data-keep="1" aria-pressed="false">Codex</button><span class="missing">not installed</span><button id="install-codex" class="secondary small">Install</button>'));
  assert.ok(!h.includes('id="install-claude-code"'));
  assert.ok(h.includes('./scripts/init --force &lt;tool&gt;'));
  assert.ok(h.includes('<button id="generic" class="link" data-keep="1">adapters/generic/README.md</button>'));
  // no adapters/ folder: no Install, and why
  const why = (exists: (rel: string) => boolean) => Object.fromEntries(ADAPTERS.map((a) => [a.id, whyNot(a.id, exists)]));
  const bare = html({ ...view, have: [], installable: [], why: why((rel) => rel === 'scripts/init') });
  assert.ok(!/id="install-/.test(bare));
  assert.ok(bare.includes('no adapters/cursor/ here'));
  // L-3: only scripts/init missing names scripts/init
  assert.ok(html({ ...view, have: [], installable: [], why: why((rel) => rel.startsWith('adapters/')) }).includes('no scripts/init here: run ./scripts/init from a template copy'));
  assert.ok(bare.includes('Claude Code is not installed here: it does not know the ANEW commands until it is.'));
  // no shell, or an install running: Install disabled
  assert.ok(html({ ...view, installable: ['codex'], have: [], shell: false }).includes('<button id="install-codex" class="secondary small" disabled>Install</button>'));
  assert.ok(html({ ...view, installable: ['codex', 'cursor'], have: [], installing: 'codex' }).includes('<button id="install-codex" class="secondary small" disabled>Installing…</button>'));
});

test('init\'s answer as it is: installed and uncommitted, or refused with its exit code', () => {
  const ok = html({ ...view, installed: { tool: 'cursor', written: true, code: 0, text: 'kept   .cursor/rules/x.mdc (exists — use --force to overwrite)\nInstalled: <rules>' } });
  assert.ok(ok.includes('✓ Cursor installed — the files are new and not committed; the commit is yours.'));
  assert.ok(ok.includes('kept   .cursor/rules/x.mdc (exists — use --force to overwrite)\nInstalled: &lt;rules&gt;'));
  const no = html({ ...view, installed: { tool: 'cursor', written: false, code: 1, text: 'Unknown adapter' } });
  // L-2: init is not atomic — the exit code and the output, no claim about what was written
  assert.ok(no.includes('scripts/init exited 1 — see its output.'));
  assert.ok(!no.includes('nothing else was written'));
});

test('AC-4: before bootstrap the one work is "Set up the project" with /bootstrap; no kinds, no description', () => {
  const h = html({ ...view, bootstrapped: false, mode: 'unset' });
  assert.ok(h.includes('<h1>Set up the project</h1>'));
  assert.ok(h.includes('>/bootstrap</pre>'));
  assert.ok(h.includes('<button id="start" class="primary">Start in Claude Code</button>'));
  assert.ok(h.includes('<button id="copy" class="secondary" data-keep="1">Copy command</button>'));
  assert.ok(!h.includes('id="kind-'));
  assert.ok(!h.includes('name="description"'));
  assert.equal((h.match(/<script nonce="n0nce">/g) ?? []).length, 1);
  assert.ok(html({ ...view, bootstrapped: false, agent: 'codex' }).includes('>$bootstrap</pre>'));
  const configured = html(view);
  assert.ok(configured.includes('id="kind-feature"'));
  assert.ok(!configured.includes('Set up the project'));
});

test('L-1: Start waits while the picked agent\'s adapter is not installed; Copy stays, the reason is shown', () => {
  const h = html({ ...view, have: [], bootstrapped: false });
  assert.ok(h.includes('<button id="start" class="primary" data-hold="1" disabled>Start in Claude Code</button>'));
  assert.ok(h.includes('<button id="copy" class="secondary" data-keep="1">Copy command</button>'));
  assert.ok(h.includes('Start waits for the Claude Code adapter: install it above, or copy the command.'));
  // the live preview leaves a held Start alone
  assert.ok(html({ ...view, have: [] }).includes('filter((b) => b && !b.dataset.hold)'));
  assert.ok(html({ ...view, description: 'x' }).includes('<button id="start" class="primary">Start in Claude Code</button>'));
});

test('L-4: while init runs, the agent picks, Start and Copy are disabled', () => {
  const h = html({ ...view, description: 'x', installable: ['codex'], installing: 'codex' });
  assert.equal((h.match(/<button id="agent-[a-z-]+" class="secondary small" data-keep="1" aria-pressed="(?:true|false)" disabled>/g) ?? []).length, 4);
  assert.ok(h.includes('<button id="start" class="primary" data-hold="1" disabled>Start in Claude Code</button>'));
  // R2-2: held, so typing in the description does not enable it again
  assert.ok(h.includes('<button id="copy" class="secondary" data-keep="1" data-hold="1" disabled>Copy command</button>'));
});

test('spec 0014: the bootstrap section in place of the card, the answers in the command; above the kinds until merged', () => {
  const template = { here: '> **STATUS: NOT CONFIGURED.**\n**Mode: unset**\n', branch: null, base: '> **STATUS: NOT CONFIGURED.**\n', defaultBranch: 'main', current: 'main', remote: 'origin', gh: true, started: false, checkConf: false, state: 's' };
  const b = { facts: template, answers: { chat: 'tr', docs: 'tr', mode: '' as const, trivial: '1' as const }, suggested: 'tr', agent: 'claude-code' as Tool, doctor: null, doctoring: false, pushing: false, prOutput: null, shell: true };
  const h = html({ ...view, bootstrapped: false, mode: 'unset', boot: b });
  assert.ok(h.includes('aria-label="Set up the project"><span class="label">Set up the project — bootstrap</span>'));
  assert.ok(h.includes('>/bootstrap chat=tr docs=tr trivial=1</pre>'));
  assert.ok(!h.includes('The project is not set up yet</strong>'));
  assert.ok(html({ ...view, bootstrapped: false, agent: 'codex', have: ['codex'], boot: { ...b, agent: 'codex' } }).includes('>$bootstrap chat=tr docs=tr trivial=1</pre>'));
  const configured = '**Mode: lite** — x\n';
  const gen = html({ ...view, boot: { ...b, facts: { ...template, here: configured, branch: configured, current: 'chore/bootstrap' } } });
  assert.ok(gen.includes('Set up the project — bootstrap'));
  assert.ok(gen.indexOf('Set up the project — bootstrap') < gen.indexOf('id="kind-feature"'));
  const merged = html({ ...view, boot: { ...b, facts: { ...template, here: configured, base: configured } } });
  assert.ok(!merged.includes('Set up the project — bootstrap'));
  assert.ok(merged.includes('id="kind-feature"'));
});
