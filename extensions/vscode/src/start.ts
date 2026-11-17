// Starting a piece of work (mockup "Yeni iş başlat"): the kind, a description, and the command it
// builds for the agent. The screen writes no file and never drives the agent: it opens a fresh
// session with the command, or hands the command over to copy (spec 0010, G-2).
import * as path from 'node:path';
import { esc, page } from './screens.ts';

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

// The agent command: the kind's command and the description on one line. In strict mode a new
// feature starts with its first segment, /analyze (the chainer refuses there). null until there
// is a description.
export function command(kind: Kind, description: string, m: Mode): string | null {
  const d = description.replace(/\s+/g, ' ').trim();
  if (d === '') return null;
  const k = KINDS.find((x) => x.id === kind) ?? KINDS[0];
  return `${kind === 'feature' && m === 'strict' ? '/analyze' : k.cmd} ${d}`;
}

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
  claude: boolean; // Start in Claude Code is offered
  started: string | null; // the command a session was opened with
  nonce: string;
  cspSource: string;
}

export function html(v: StartView): string {
  const cmd = command(v.kind, v.description, v.mode);
  const base = (command(v.kind, 'x', v.mode) as string).slice(0, -2);
  const kinds = KINDS.map((k) => `<button id="kind-${k.id}" class="kind" aria-pressed="${k.id === v.kind}" data-keep="1">
  <strong>${esc(k.label)}</strong><span>${esc(k.hint)}</span><code>${esc(k.id === 'feature' && v.mode === 'strict' ? '/analyze' : k.cmd)}</code>
</button>`).join('\n');
  const modeLine = v.mode === 'strict' ? 'Mode: strict — one segment per role; it stops at its handoff'
    : v.mode === 'lite' ? 'Mode: lite — it stops at every gate' : 'Mode: unset — run /bootstrap first';
  const start = v.claude
    ? `<button id="start" class="primary"${cmd ? '' : ' disabled'}>Start in Claude Code</button>`
    : '';
  return page({ title: 'ANEW · new work', nonce: v.nonce, cspSource: v.cspSource }, `
<header>
  <span class="path">ANEW · new work</span>
  <h1>Start new work</h1>
</header>
<p class="muted">This screen does not run the agent: it describes the work, builds the command and opens a fresh session with it.</p>
<section aria-label="Kind"><span class="label">Kind of work</span><div class="kinds">${kinds}</div></section>
<label class="field"><span class="label">What do you want?</span>
<textarea name="description" placeholder="${esc(PROMPT[v.kind])}">${esc(v.description)}</textarea></label>
<p class="foot">You need not write the acceptance criteria: the agent proposes them in the spec draft, and you approve it. Its number will most likely be ${esc(v.number)}; the agent assigns it.</p>
<div class="decide">
  <span class="label">Goes to the agent</span>
  <pre id="preview" class="out" aria-live="polite" data-cmd="${esc(base)}">${cmd ? esc(cmd) : EMPTY}</pre>
  <ul class="facts"><li>A new session — no context carried over</li><li>${esc(modeLine)}</li><li>First stop: the spec approval is yours</li></ul>
  <div class="row">${start}<button id="copy" class="secondary" data-keep="1"${cmd ? '' : ' disabled'}>Copy command</button></div>
  <p class="foot">${v.claude ? 'Copilot, Cursor, Codex: copy the command and paste it into their chat.' : 'Claude Code was not found on PATH: copy the command into your agent\'s chat.'}</p>
</div>
${v.started ? `<div class="result ok" role="status"><strong>✓ A session opened in a new terminal with the command.</strong><p class="prose">When the spec draft is written, it appears under “Your turn” in the sidebar.</p></div>` : ''}
<script nonce="${v.nonce}">
// the preview follows the typing; the extension builds the command again from the text it receives
const ta = document.querySelector('textarea[name=description]');
const pre = document.getElementById('preview');
const live = ['start', 'copy'].map((id) => document.getElementById(id)).filter(Boolean);
ta.addEventListener('input', () => {
  const d = ta.value.replace(/\\s+/g, ' ').trim();
  pre.textContent = d ? pre.dataset.cmd + ' ' + d : ${JSON.stringify(EMPTY)};
  for (const b of live) b.disabled = !d;
});
</script>
<style nonce="${v.nonce}">
.kinds { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
.kind { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; text-align: left; padding: 12px 14px; min-height: 0; background: var(--card); color: var(--fg); border: 1px solid var(--line); font-weight: 400; }
.kind span { font-size: 12.5px; color: var(--muted); }
.kind[aria-pressed="true"] span, .kind[aria-pressed="true"] code { color: inherit; }
.field { display: flex; flex-direction: column; gap: 8px; }
.facts { font-size: 12.5px; color: var(--muted); }
</style>`);
}
