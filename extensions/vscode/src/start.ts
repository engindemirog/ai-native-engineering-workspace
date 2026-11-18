// Starting a piece of work (mockup "Yeni iş başlat"): the kind, a description, and the command it
// builds for the agent. The screen writes no file and never drives the agent: it opens a fresh
// session with the command, or hands the command over to copy (spec 0010, G-2).
import * as path from 'node:path';
import { esc, page } from './screens.ts';
import { ADAPTERS, adapter, forAgent, type Tool } from './setup.ts';
import * as boot from './bootstrap.ts';

export type Kind = 'feature' | 'change' | 'fix' | 'refactor';
export type Mode = 'lite' | 'strict' | 'unset';

export const KINDS: { id: Kind; label: string; hint: string; cmd: string }[] = [
  { id: 'feature', label: 'New feature', hint: 'A new behaviour: spec → plan → build → review → verify → ship.', cmd: '/new-feature' },
  { id: 'change', label: 'Change', hint: 'Changes a behaviour that shipped; triaged first, then its lane.', cmd: '/change' },
  { id: 'fix', label: 'Bug fix', hint: 'A test that reproduces the bug first, then the fix.', cmd: '/fix-bug' },
  { id: 'refactor', label: 'Refactor', hint: 'Structure changes, behaviour provably the same.', cmd: '/refactor' },
];

const PROMPT: Record<Kind, string> = {
  feature: 'What should it do, for whom, and why?',
  change: 'What should change, and the work item key',
  fix: 'What is broken: expected vs actual',
  refactor: 'What to refactor, and why',
};

// AGENTS.md's `**Mode: lite**` line (bootstrap writes it).
export function mode(agents: string): Mode {
  const m = /\*\*Mode:\s*(lite|strict|unset)\*\*/i.exec(agents);
  return m ? (m[1].toLowerCase() as Mode) : 'unset';
}

// The agent command: the kind's command and the description on one line, in the form the agent
// runs it (Codex: `$new-feature`, spec 0011 G-3). In strict mode a new feature starts with its
// first segment, /analyze (the chainer refuses there). null until there is a description.
export function command(kind: Kind, description: string, m: Mode, agent: Tool = 'claude-code'): string | null {
  const d = description.replace(/\s+/g, ' ').trim();
  if (d === '') return null;
  const k = KINDS.find((x) => x.id === kind) ?? KINDS[0];
  return forAgent(`${kind === 'feature' && m === 'strict' ? '/analyze' : k.cmd} ${d}`, agent);
}

// Before bootstrap the one piece of work is setting the project up (spec 0011, R4).
export const bootstrap = (agent: Tool) => forAgent('/bootstrap', agent);

// The number the agent will most likely give the spec: the highest in specs/active, specs/done
// and specs/plans, plus one. Information only — the agent assigns it.
export function nextNumber(names: string[]): string {
  const n = names.map((f) => /^(\d{4})-/.exec(f)?.[1]).filter((x): x is string => !!x).map(Number);
  return String((n.length ? Math.max(...n) : 0) + 1).padStart(4, '0');
}

// The claude executable on PATH, as a program a terminal can start with arguments (no shell
// string, so a description needs no quoting). Windows: claude.exe, or the exe an npm shim
// (claude.cmd) points at. null when there is none: the screen then offers Copy only.
export function findClaude(o: { platform: string; pathEnv: string; exists: (p: string) => boolean; read: (p: string) => string }): string | null {
  const sep = o.platform === 'win32' ? ';' : ':';
  const join = o.platform === 'win32' ? path.win32.join : path.posix.join;
  for (const dir of o.pathEnv.split(sep).filter(Boolean)) {
    if (o.platform !== 'win32') {
      const p = join(dir, 'claude');
      if (o.exists(p)) return p;
      continue;
    }
    const exe = join(dir, 'claude.exe');
    if (o.exists(exe)) return exe;
    const cmd = join(dir, 'claude.cmd');
    if (o.exists(cmd)) {
      const m = /"%dp0%\\?([^"]+\.exe)"/i.exec(o.read(cmd));
      if (m) {
        const target = join(dir, m[1]);
        if (o.exists(target)) return target;
      }
    }
  }
  return null;
}

const EMPTY = '— write what you want first —';

export interface StartView {
  kind: Kind;
  description: string;
  mode: Mode;
  number: string;
  claude: boolean; // claude was found on PATH
  started: string | null; // the command a session was opened with
  agent: Tool; // the agent the command is built for (the human's pick)
  have: Tool[]; // installed adapters
  installable: Tool[]; // adapters scripts/init can install here
  why: Partial<Record<Tool, string>>; // why Install is not offered (setup.whyNot)
  bootstrapped: boolean;
  shell: boolean;
  installing: Tool | null;
  installed: { tool: Tool; written: boolean; code: number; text: string } | null; // init's answer
  boot?: boot.BootView | null; // bootstrap on the screen (spec 0014); without it, 0011's card
  nonce: string;
  cspSource: string;
}

// The agent card: each adapter installed or not, the pick, Install for a missing one (spec 0011).
function agents(v: StartView): string {
  const rows = ADAPTERS.map((a) => {
    const on = v.have.includes(a.id);
    const state = on ? '<span class="ok">✓ installed</span>' : '<span class="missing">not installed</span>';
    const install = on ? ''
      : !v.installable.includes(a.id) ? `<span class="muted small">${esc(v.why[a.id] || 'not installable here')}: run ./scripts/init from a template copy</span>`
      : `<button id="install-${a.id}" class="secondary small"${!v.shell || v.installing ? ' disabled' : ''}>${v.installing === a.id ? 'Installing…' : 'Install'}</button>`;
    return `<li class="agent"><button id="agent-${a.id}" class="secondary small" data-keep="1" aria-pressed="${a.id === v.agent}"${v.installing ? ' disabled' : ''}>${esc(a.label)}</button>${state}${install}</li>`;
  }).join('');
  const picked = adapter(v.agent);
  const warn = v.have.includes(v.agent) ? '' : `<p class="missing small" role="note">${esc(picked.label)} is not installed here: it does not know the ANEW commands until it is.</p>`;
  const r = v.installed;
  const answer = r ? `<div class="result ${r.written ? 'ok' : 'refused'}" role="${r.written ? 'status' : 'alert'}"><strong>${r.written
    ? `✓ ${esc(adapter(r.tool).label)} installed — the files are new and not committed; the commit is yours.`
    : `scripts/init exited ${r.code} — see its output.`}</strong><pre class="out">${esc(r.text)}</pre></div>` : '';
  return `<section class="card" aria-label="Your agent"><span class="label">Your agent</span>
<ul class="agents">${rows}</ul>
${warn}
<p class="foot">Install runs <code>./scripts/init &lt;tool&gt;</code>; files that exist are kept. To refresh an installed adapter, run <code>./scripts/init --force &lt;tool&gt;</code> in a terminal — it overwrites files you customized. Any other tool: paste AGENTS.md at the start of a session (<button id="generic" class="link" data-keep="1">adapters/generic/README.md</button>).</p>
${v.shell ? '' : '<p class="hint" role="status">No POSIX shell found: set anew.shell. Nothing can be installed.</p>'}
${answer}
</section>`;
}

export function html(v: StartView): string {
  const setup = !v.bootstrapped;
  const cmd = setup ? (v.boot ? boot.command(v.boot.answers, v.agent) : bootstrap(v.agent)) : command(v.kind, v.description, v.mode, v.agent);
  const base = setup ? '' : (command(v.kind, 'x', v.mode, v.agent) as string).slice(0, -2);
  const kinds = KINDS.map((k) => `<button id="kind-${k.id}" class="kind" aria-pressed="${k.id === v.kind}" data-keep="1">
  <strong>${esc(k.label)}</strong><span>${esc(k.hint)}</span><code>${esc(forAgent(k.id === 'feature' && v.mode === 'strict' ? '/analyze' : k.cmd, v.agent))}</code>
</button>`).join('\n');
  const modeLine = v.mode === 'strict' ? 'Mode: strict — one segment per role; it stops at its handoff'
    : v.mode === 'lite' ? 'Mode: lite — it stops at every gate' : 'Mode: unset — bootstrap sets it';
  const canStart = v.claude && v.agent === 'claude-code';
  // a session whose agent lacks the adapter does not know the command: Start waits for Install (L-1)
  const ready = v.have.includes(v.agent);
  const start = canStart ? `<button id="start" class="primary"${canStart && (!ready || v.installing !== null) ? ' data-hold="1"' : ''}${cmd && ready && !v.installing ? '' : ' disabled'}>Start in Claude Code</button>` : '';
  const foot = canStart ? 'Copilot, Cursor, Codex: pick it above, then copy the command into its chat.'
    : v.agent === 'claude-code' ? 'Claude Code was not found on PATH: copy the command into your agent\'s chat.'
    : `Copy the command into ${adapter(v.agent).label}'s chat.`;
  // the bootstrap section: in place of 0011's card, and above the kinds until chore/bootstrap is merged
  const bootHtml = v.boot ? boot.section(v.boot) : '';
  const work = setup && v.boot ? bootHtml : setup
    ? `<section class="card" aria-label="Set up the project"><span class="label">Set up the project</span>
<p class="prose"><strong>The project is not set up yet</strong> (AGENTS.md is not configured, or names no mode). Bootstrap is the first work: the agent reads the project, asks what it cannot see, and writes AGENTS.md, the docs and <code>scripts/check.conf</code>, stopping for your approval. The kinds of work appear once it has set the mode.</p></section>`
    : `${bootHtml}<section aria-label="Kind"><span class="label">Kind of work</span><div class="kinds">${kinds}</div></section>
<label class="field"><span class="label">What do you want?</span>
<textarea name="description" placeholder="${esc(PROMPT[v.kind])}">${esc(v.description)}</textarea></label>
<p class="foot">You need not write the acceptance criteria: the agent proposes them in the spec draft, and you approve it. Its number will most likely be ${esc(v.number)}; the agent assigns it.</p>`;
  const script = setup ? '' : `<script nonce="${v.nonce}">
// the preview follows the typing; the extension builds the command again from the text it receives
const ta = document.querySelector('textarea[name=description]');
const pre = document.getElementById('preview');
const live = ['start', 'copy'].map((id) => document.getElementById(id)).filter((b) => b && !b.dataset.hold);
ta.addEventListener('input', () => {
  const d = ta.value.replace(/\\s+/g, ' ').trim();
  pre.textContent = d ? pre.dataset.cmd + ' ' + d : ${JSON.stringify(EMPTY)};
  for (const b of live) b.disabled = !d;
});
</script>`;
  return page({ title: 'ANEW · new work', nonce: v.nonce, cspSource: v.cspSource }, `
<header>
  <span class="path">ANEW · new work</span>
  <h1>${setup ? 'Set up the project' : 'Start new work'}</h1>
</header>
<p class="muted">This screen does not run the agent: it describes the work, builds the command and opens a fresh session with it.</p>
${agents(v)}
${work}
<div class="decide">
  <span class="label">Goes to the agent</span>
  <pre id="preview" class="out" aria-live="polite" data-cmd="${esc(base)}">${cmd ? esc(cmd) : EMPTY}</pre>
  <ul class="facts"><li>A new session — no context carried over</li><li>${esc(modeLine)}</li><li>${setup ? 'It stops for your approval of what bootstrap writes' : 'First stop: the spec approval is yours'}</li></ul>
  <div class="row">${start}<button id="copy" class="secondary" data-keep="1"${v.installing ? ' data-hold="1"' : ''}${cmd && !v.installing ? '' : ' disabled'}>Copy command</button></div>
  <p class="foot">${esc(canStart && !ready ? 'Start waits for the Claude Code adapter: install it above, or copy the command.' : foot)}</p>
</div>
${v.started ? `<div class="result ok" role="status"><strong>✓ A session opened in a new terminal with the command.</strong><p class="prose">${setup ? 'When bootstrap has set the mode, the kinds of work appear here.' : 'When the spec draft is written, it appears under “Your turn” in the sidebar.'}</p></div>` : ''}
${script}
<style nonce="${v.nonce}">
.kinds { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
.kind { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; text-align: left; padding: 12px 14px; min-height: 0; background: var(--card); color: var(--fg); border: 1px solid var(--line); font-weight: 400; }
.kind span { font-size: 12.5px; color: var(--muted); }
.kind[aria-pressed="true"] span, .kind[aria-pressed="true"] code { color: inherit; }
.field { display: flex; flex-direction: column; gap: 8px; }
.facts { font-size: 12.5px; color: var(--muted); }
.agents { gap: 8px; }
.agent { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.agent > button:first-child { min-width: 150px; }
.small { font-size: 12.5px; }
button.small { min-height: 30px; padding: 0 10px; }
button.link { min-height: 0; padding: 0; border: 0; background: none; color: var(--vscode-textLink-foreground); font-weight: 400; text-decoration: underline; }
${boot.CSS}
</style>`);
}
