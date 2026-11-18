// Bootstrap on the screen (spec 0014): the fixed-choice answers that ride on `/bootstrap`, the
// phase read from the files and git, doctor's output, and the merge of `chore/bootstrap` — pushed
// and opened as a PR, never merged here. Pure: the VS Code layer gathers the facts.
import { esc } from './screens.ts';
import { bootstrapped, forAgent, type Tool } from './setup.ts';
import { prStep, defaultBranch as defaultOf } from './ship.ts';

export const BRANCH = 'chore/bootstrap';

export interface Answers {
  chat: string; // a language code, '' = asked in the interview
  docs: string;
  mode: '' | 'lite' | 'strict'; // '' = decide in the interview
  trivial: '' | '1' | '2' | '3';
}

export const NO_ANSWERS: Answers = { chat: '', docs: '', mode: '', trivial: '' };

// A language code as bootstrap records it: `tr`, `en`, `pt-BR`.
export const langOk = (s: string) => /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})?$/.test(s);

// What was typed, as a code: `TR` → `tr`, `en_US` → `en-US`; '' when it is none (review round 1, L-2).
export function lang(typed: string): string {
  const [l, ...rest] = typed.trim().split(/[-_]/);
  const code = [l.toLowerCase(), ...rest].join('-');
  return langOk(code) ? code : '';
}

// The answers kept per workspace (or typed), each checked; anything else is not given.
export function answers(raw: unknown): Answers {
  const r = (raw ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof r[k] === 'string' ? (r[k] as string).trim() : '');
  const chat = lang(s('chat'));
  const docs = lang(s('docs'));
  const mode = s('mode');
  const trivial = s('trivial');
  return {
    chat: langOk(chat) ? chat : '',
    docs: langOk(docs) ? docs : '',
    mode: mode === 'lite' || mode === 'strict' ? mode : '',
    trivial: trivial === '1' || trivial === '2' || trivial === '3' ? trivial : '',
  };
}

// `/bootstrap chat=tr docs=tr mode=lite trivial=1` — only the answers given, in the agent's form.
export function command(a: Answers, agent: Tool): string {
  const given = [a.chat && `chat=${a.chat}`, a.docs && `docs=${a.docs}`, a.mode && `mode=${a.mode}`, a.trivial && `trivial=${a.trivial}`].filter(Boolean);
  return forAgent(['/bootstrap', ...given].join(' '), agent);
}

// The recommendation for both languages: VS Code's display language (`tr`, `en-us` → `en`).
export function suggested(display: string): string {
  const base = display.toLowerCase().split(/[-_]/)[0];
  return langOk(base) ? base : 'en';
}

export const MODES: { id: Answers['mode']; label: string; hint: string; recommended?: boolean }[] = [
  { id: '', label: 'Decide in the interview', hint: 'bootstrap weighs team size and risk', recommended: true },
  { id: 'lite', label: 'lite', hint: '/new-feature chains the segments, asking at each gate' },
  { id: 'strict', label: 'strict', hint: 'one segment per role, one role per session' },
];

export const TRIVIAL: { id: Answers['trivial']; label: string; recommended?: boolean }[] = [
  { id: '1', label: '1 · a PR and one reviewer, no spec', recommended: true },
  { id: '2', label: '2 · a direct commit on a trivial branch' },
  { id: '3', label: '3 · a mini-spec for everything' },
  { id: '', label: 'Decide in the interview' },
];

// doctor's answer: its result line and its FAIL and WARN lines, with the state it ran on.
export interface Doctor {
  code: number;
  result: string; // '== result: 0 fail, 5 warn ==', or '' when doctor printed none
  fails: string[];
  warns: string[];
  state: string; // HEAD and `git status --porcelain` when it ran
}

export function readDoctor(code: number, out: string, state: string): Doctor {
  const lines = out.replace(/\r/g, '').split('\n');
  return {
    code,
    result: lines.find((l) => l.startsWith('== result:')) ?? '',
    fails: lines.filter((l) => l.startsWith('FAIL ')),
    warns: lines.filter((l) => l.startsWith('WARN ')),
    state,
  };
}

export const green = (d: Doctor) => d.code === 0 && d.result !== '' && d.fails.length === 0;

// What the screen knows, read again on each draw (spec 0014, Constraints).
export interface Facts {
  here: string; // AGENTS.md in the working tree
  branch: string | null; // AGENTS.md on chore/bootstrap; null: no such branch
  base: string | null; // AGENTS.md on the default branch; null: no default branch known
  defaultBranch: string; // '' when unknown
  current: string; // the branch checked out
  remote: string; // '' when the repository has none
  gh: boolean; // gh is signed in
  started: boolean; // /bootstrap was started from this screen
  checkConf: boolean;
  state: string; // HEAD and the working tree's contents now (a tree id); '' once merged
}

// The facts from git: AGENTS.md on chore/bootstrap and on the default branch (the remote's, else a
// local main or master), the branch checked out, the remote, the state doctor's answer is kept with.
export async function gather(o: { git: (args: string[], env?: Record<string, string>) => Promise<string | null>; gh: () => Promise<boolean>; here: string; started: boolean; checkConf: boolean; index: string; seed: (gitIndex: string, to: string) => void }): Promise<Facts> {
  const { git } = o;
  const has = async (ref: string) => (await git(['rev-parse', '--verify', '--quiet', ref])) !== null;
  const current = (await git(['rev-parse', '--abbrev-ref', 'HEAD']))?.trim() ?? '';
  const branch = (await has(`refs/heads/${BRANCH}`)) ? (await git(['show', `${BRANCH}:AGENTS.md`])) ?? '' : null;
  const remotes = ((await git(['remote'])) ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  const remote = remotes.includes('origin') ? 'origin' : remotes[0] ?? '';
  let defaultBranch = remote ? defaultOf(((await git(['symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`])) ?? '').trim(), remote) : '';
  for (const b of ['main', 'master']) if (!defaultBranch && (await has(`refs/heads/${b}`))) defaultBranch = b;
  const ref = defaultBranch && remote && (await has(`refs/remotes/${remote}/${defaultBranch}`)) ? `${remote}/${defaultBranch}` : defaultBranch;
  const base = ref ? (await git(['show', `${ref}:AGENTS.md`])) ?? '' : null;
  const f: Facts = { here: o.here, branch, base, defaultBranch, current, remote, gh: false, started: o.started, checkConf: o.checkConf, state: '' };
  // merged: nothing more to read — a bootstrapped project pays for no tree and no gh (L-3)
  if (phase(f, null) === 'merged') return f;
  // the contents, not the names: a temporary index of the whole working tree (review round 1, M-1),
  // seeded from the real one so only changed files are hashed (round 2, N-5); no line-ending
  // warnings, which could fill the output (N-1)
  const real = ((await git(['rev-parse', '--git-path', 'index'])) ?? '').trim();
  if (real) { try { o.seed(real, o.index); } catch { /* an empty index: every file is hashed */ } }
  const env = { GIT_INDEX_FILE: o.index };
  const tree = (await git(['-c', 'core.safecrlf=false', 'add', '--all'], env)) !== null ? ((await git(['write-tree'], env)) ?? '').trim() : '';
  // a tree not read is a state no doctor answer can match (N-1)
  f.state = tree ? `${((await git(['rev-parse', 'HEAD'])) ?? '').trim()} ${tree}` : `${UNREAD}${Date.now()}-${Math.random()}`;
  f.gh = branch !== null && remote !== '' && bootstrapped(branch) ? await o.gh() : false;
  return f;
}

// The prefix of a state whose contents could not be read: never verified.
export const UNREAD = 'unread:';

export type Phase = 'not started' | 'in the agent' | 'generated' | 'verified' | 'merged';
export const PHASES: Phase[] = ['not started', 'in the agent', 'generated', 'verified', 'merged'];

// Merged: the default branch holds a configured AGENTS.md — a squash-merged PR included (plan
// 0014, Risk 1). Without a known default branch: a configured working tree, chore/bootstrap not
// checked out (review round 1, L-8).
export function phase(f: Facts, doctor: Doctor | null): Phase {
  if (f.base !== null ? bootstrapped(f.base) : bootstrapped(f.here) && (f.branch === null || f.current !== BRANCH)) return 'merged';
  if (!bootstrapped(f.branch ?? f.here)) return f.started || f.branch !== null ? 'in the agent' : 'not started';
  return doctor && green(doctor) && doctor.state === f.state && !f.state.startsWith(UNREAD) && bootstrapped(f.here) ? 'verified' : 'generated';
}

// The merge step: Push and open PR from chore/bootstrap (Ship's rule), or the commands to copy;
// with no remote, the local merge to copy. Never run here (G-5).
export function mergeStep(f: Facts): { offered: boolean; why: string; commands: string[] } {
  if (!f.remote) {
    const into = f.defaultBranch || 'main';
    return { offered: false, why: 'no remote: merge it here when you have approved it', commands: [`git switch ${into}`, `git merge --no-ff ${BRANCH}`] };
  }
  if (f.current !== BRANCH) {
    return { offered: false, why: `${BRANCH} is not checked out (you are on ${f.current || 'no branch'}): git switch ${BRANCH}`, commands: [`git switch ${BRANCH}`, `git push -u ${f.remote} ${BRANCH}`, 'gh pr create --fill'] };
  }
  return prStep({ branch: f.current, defaultBranch: f.defaultBranch, remote: f.remote, gh: f.gh });
}

// The Mode and Language lines bootstrap wrote.
export function written(agents: string): { mode: string; language: string } {
  const line = (re: RegExp) => agents.replace(/\r/g, '').split('\n').find((l) => re.test(l))?.replace(/\*\*/g, '').trim() ?? '';
  return { mode: line(/Mode:/i), language: line(/Language:/i) };
}

// The state of the section in one string: a refresh redraws Start only when it changed (0011 M-1).
export function key(f: Facts, doctor: Doctor | null): string {
  return JSON.stringify([phase(f, doctor), f.branch !== null, f.current, f.remote, f.gh, f.checkConf, doctor ? doctor.state === f.state : null]);
}

// The command the screen offers, or null with what to do instead: bootstrap's output already waits
// on chore/bootstrap (L-1), or it is merged and this working tree is not pulled (M-3).
export function offered(v: { facts: Facts; answers: Answers; agent: Tool; doctor: Doctor | null }): { cmd: string | null; instead: string } {
  const p = phase(v.facts, v.doctor);
  if (p === 'not started' || p === 'in the agent') return { cmd: command(v.answers, v.agent), instead: '' };
  const d = v.facts.defaultBranch;
  const pull = d && v.facts.current !== d ? `git switch ${d} && git pull` : 'git pull'; // round 2, N-6
  if (p === 'merged') return { cmd: null, instead: bootstrapped(v.facts.here) ? '' : `bootstrap is merged on ${d || 'the default branch'}: ${pull} — this working tree still has the template's AGENTS.md` };
  return { cmd: null, instead: bootstrapped(v.facts.here) ? 'bootstrap has run: its output is in this working tree' : `bootstrap's output waits on ${BRANCH}: git switch ${BRANCH}` };
}

export interface BootView {
  facts: Facts;
  answers: Answers;
  typed: { chat: string; docs: string }; // as typed, kept on a redraw (L-2)
  suggested: string;
  agent: Tool;
  doctor: Doctor | null;
  doctoring: boolean;
  pushing: boolean;
  prOutput: string | null;
  shell: boolean;
}

const LINE: Record<Phase, string> = {
  'not started': 'Answer what you can below, then start /bootstrap: the agent asks the rest — product, domain, stack, boundaries, conventions, testing, security.',
  'in the agent': 'The interview is in the agent\'s chat. When it has written AGENTS.md and the docs on chore/bootstrap, this screen shows them.',
  generated: 'Bootstrap wrote its files. Run doctor on them, then open the PR of chore/bootstrap.',
  verified: 'doctor is green on these files. Open the PR of chore/bootstrap; the team merges it.',
  merged: 'Bootstrap is merged.',
};

// The bootstrap section of the Start screen; '' once merged and pulled.
export function section(v: BootView): string {
  const p = phase(v.facts, v.doctor);
  if (p === 'merged') {
    const o = offered(v);
    return o.instead ? `<section class="card boot" aria-label="Set up the project"><span class="label">Set up the project — bootstrap</span><p class="prose" role="status">${esc(o.instead.charAt(0).toUpperCase() + o.instead.slice(1))}.</p></section>` : '';
  }
  const at = PHASES.indexOf(p);
  const strip = `<ol class="strip" aria-label="Bootstrap">${PHASES.map((s, i) => `<li class="step${i < at ? ' done' : i === at ? ' now' : ''}"${i === at ? ' aria-current="step"' : ''}>${i < at ? '✓ ' : i === at ? '● ' : ''}${esc(s)}</li>`).join('')}</ol>`;
  const configured = bootstrapped(v.facts.branch ?? v.facts.here);
  const pick = (name: string, id: string, label: string, on: boolean, rec?: boolean) =>
    `<button id="boot-${name}-${id || 'ask'}" class="secondary small" data-keep="1" aria-pressed="${on}">${esc(label)}${rec ? ' <span class="rec">recommended</span>' : ''}</button>`;
  const ask = configured ? '' : `<div class="answers">
  <label class="field"><span class="label">Chat language</span><input name="chat" value="${esc(v.typed.chat)}" placeholder="${esc(v.suggested)} (recommended: your VS Code language); empty: asked"></label>
  <label class="field"><span class="label">Document language</span><input name="docs" value="${esc(v.typed.docs)}" placeholder="${esc(v.suggested)} (recommended: the chat language, unless the team is international); empty: asked"></label>
  <div><span class="label">Mode</span><div class="row" role="group" aria-label="Mode">${MODES.map((m) => pick('mode', m.id, m.label, v.answers.mode === m.id, m.recommended)).join('')}</div>
  <p class="muted small">${esc(MODES.map((m) => `${m.label}: ${m.hint}`).join(' · '))}</p></div>
  <div><span class="label">Trivial changes (labels, typos)</span><div class="row" role="group" aria-label="Trivial changes">${TRIVIAL.map((t) => pick('trivial', t.id, t.label, v.answers.trivial === t.id, t.recommended)).join('')}</div></div>
  ${(['chat', 'docs'] as const).filter((k) => v.typed[k].trim() && !v.answers[k]).map((k) => `<p class="missing small" role="note">“${esc(v.typed[k].trim())}” is not a language code: the ${k === 'chat' ? 'chat' : 'document'} language will be asked in the interview.</p>`).join('')}
  <p class="foot">Given answers ride on the command and are not asked again; codes like <code>tr</code>, <code>en</code>, <code>pt-BR</code>.</p>
  ${p === 'in the agent' && v.facts.branch === null && v.facts.started ? '<p class="muted small">Not running after all? <button id="boot-reset" class="link" data-keep="1">Start over</button> — the phase goes back to “not started”.</p>' : ''}
</div>`;
  const w = configured ? written(v.facts.branch ?? v.facts.here) : null;
  const made = w ? `<ul class="facts"><li>${esc(w.mode || 'no Mode line')}</li><li>${esc(w.language || 'no Language line')}</li><li>${v.facts.checkConf ? 'scripts/check.conf written' : 'no scripts/check.conf yet'}</li></ul>` : '';
  const d = v.doctor;
  const stale = d && d.state !== v.facts.state;
  const doctorBox = !configured ? '' : `<div class="row"><button id="boot-doctor" class="secondary"${v.shell && !v.doctoring && bootstrapped(v.facts.here) ? '' : ' disabled'}>${v.doctoring ? 'Running doctor…' : 'Run doctor'}</button>
  <span class="muted small">${esc(!bootstrapped(v.facts.here) ? `doctor reads the working tree: git switch ${BRANCH} first` : !v.shell ? 'No POSIX shell found: set anew.shell.' : stale ? 'The files changed since doctor ran: run it again.' : './scripts/doctor reads the files; it writes nothing.')}</span></div>
${d && !stale ? `<div class="result ${green(d) ? 'ok' : 'refused'}" role="${green(d) ? 'status' : 'alert'}"><strong>${esc(d.result || `doctor exited ${d.code} with no result line`)}</strong>${d.fails.length || d.warns.length ? `<pre class="out">${esc([...d.fails, ...d.warns].join('\n'))}</pre>` : ''}</div>` : ''}`;
  const m = configured && v.facts.branch !== null ? mergeStep(v.facts) : null;
  const merge = m === null ? '' : `<div><span class="label">The merge of ${esc(BRANCH)}</span>
  ${m.offered ? `<div class="row"><button id="boot-pr" class="primary"${v.pushing ? ' disabled' : ''}>${v.pushing ? 'Pushing…' : 'Push and open PR'}</button><span class="muted small">git push -u ${esc(v.facts.remote)} ${esc(BRANCH)}, then gh pr create --fill — after a confirmation. The merge stays with the team.</span></div>`
    : `<p class="muted small">${esc(m.why)}</p><pre class="out">${esc(m.commands.join('\n'))}</pre>`}
  ${v.prOutput !== null ? `<pre class="out" role="status">${esc(v.prOutput)}</pre>` : ''}
  <p class="foot">After the PR is merged, pull ${esc(v.facts.defaultBranch || 'the default branch')}: this section goes once its AGENTS.md is configured.</p></div>`;
  return `<section class="card boot" aria-label="Set up the project"><span class="label">Set up the project — bootstrap</span>
${strip}
<p class="prose">${esc(LINE[p])}</p>
${ask}${made}${doctorBox}${merge}
</section>`;
}

export const CSS = `.boot .answers { display: flex; flex-direction: column; gap: 12px; }
.boot ol.strip { list-style: none; margin: 0; padding: 0; }
.boot .rec { font-size: 11px; opacity: .8; }
.boot input { width: 100%; }`;
