// ANEW upgraded on the screen (spec 0015): the release to offer, the two releases fetched into
// .git/anew-upgrade/, scripts/upgrade's answer, /upgrade for the rest, the checks and the merge of
// chore/anew-<tag> — pushed and opened as a PR, never merged here. Pure: the VS Code layer gathers
// the facts.
import { esc } from './screens.ts';
import { forAgent, adapter } from './setup.ts';
import { canContinue, type Agent } from './next.ts';
import { has, branches, treeState, mergeStep as choreMerge, UNREAD, type Git } from './repo.ts';
import { readDoctor, green as doctorGreen, type Doctor } from './bootstrap.ts';

export const DIR = 'anew-upgrade'; // under the git directory: never committed (G-5)
export const branchFor = (tag: string) => `chore/anew-${tag}`;
export const LTS = 'v1.24.'; // the LTS line: it has no scripts/upgrade (review round 1, M-1)
export const FIRST = 'v1.32'; // the first release with scripts/upgrade

export const isTag = (s: string) => /^v\d+(\.\d+){1,2}$/.test(s);
const parts = (t: string) => t.slice(1).split('.').map(Number);
export function cmpTag(a: string, b: string): number {
  const x = parts(a), y = parts(b);
  for (let i = 0; i < 3; i++) if ((x[i] ?? 0) !== (y[i] ?? 0)) return (x[i] ?? 0) - (y[i] ?? 0);
  return 0;
}

// `git ls-remote --tags <url>`: the release tags, newest first.
export function tagsFrom(lsRemote: string): string[] {
  const t = lsRemote.replace(/\r/g, '').split('\n').map((l) => /\trefs\/tags\/(v[^\s^]+)$/.exec(l)?.[1] ?? '').filter(isTag);
  return [...new Set(t)].sort((a, b) => cmpTag(b, a));
}

export interface Offer { choices: string[]; why: string; note: string }

// What to offer from the project's base (G-2, G-3): the releases to move to, the recommended one
// first, or why nothing can be offered. No choices and no why: up to date. On the LTS line, which
// has no scripts/upgrade, the latest only as an explicit choice, with a note (M-1, L-1).
export function offer(o: { version: string; latest: string; tags: string[] }): Offer {
  const v = o.version.trim();
  if (!v) return { note: '', choices: [], why: '.anew-version is missing: write the ANEW version this project is based on (e.g. v1.31) — doctor warns about it too. Nothing is guessed.' };
  if (!isTag(v)) return { note: '', choices: [], why: `.anew-version says “${v}”, not a release tag (e.g. v1.31): write the version this project is based on.` };
  if (o.tags.length && !o.tags.includes(v)) return { note: '', choices: [], why: `no release ${v} in the template repository: the base cannot be fetched. Write the version this project is based on into .anew-version.` };
  const latest = isTag(o.latest) && cmpTag(o.latest, v) > 0 && cmpTag(o.latest, FIRST) >= 0 ? [o.latest] : [];
  if (v === LTS.slice(0, -1) || v.startsWith(LTS)) { // v1.24 itself too (N-7a)
    return latest.length ? { choices: latest, why: '', note: `This project is on the LTS line (${LTS}x), which has no scripts/upgrade: upgrade within the line by hand (CHANGELOG, "How to upgrade"). ${latest[0]} leaves the line — pick it only if you mean to.` } : { choices: [], why: '', note: '' };
  }
  return { choices: latest, why: '', note: '' };
}

// The CHANGELOG headings above the base, up to the new tag, oldest first (A-2: once it is fetched).
export function headings(changelog: string, base: string, to: string): string[] {
  return changelog.replace(/\r/g, '').split('\n')
    .map((l) => /^## (v\d+(?:\.\d+){1,2})\b.*$/.exec(l))
    .filter((m): m is RegExpExecArray => m !== null && cmpTag(m[1], base) > 0 && cmpTag(m[1], to) <= 0)
    .map((m) => m[0].slice(3))
    .reverse();
}

// scripts/upgrade's answer: the counts, the files to merge, its summary line.
export interface Script { code: number; replaced: number; added: number; removed: number; kept: number; merge: string[]; summary: string; out: string }
export function readScript(code: number, out: string): Script {
  const lines = out.replace(/\r/g, '').split('\n');
  const n = (w: string) => lines.filter((l) => l.startsWith(`${w} `)).length;
  return {
    code, replaced: n('replaced'), added: n('added'), removed: n('removed'), kept: n('kept'),
    merge: lines.filter((l) => l.startsWith('merge ')).map((l) => l.replace(/^merge\s+/, '').replace(/ \(changed by the project and by [^)]*\)$/, '')), // L-5
    summary: lines.find((l) => l.startsWith('Upgrade ')) ?? '', out,
  };
}

// /upgrade <tag> in the agent's form.
export const command = (to: string, agent: Agent['agent']) => forAgent(`/upgrade ${to}`, agent);

export function confirm(o: { base: string; to: string; current: string; from: string }): { message: string; detail: string } {
  return {
    message: `Upgrade ANEW ${o.base} → ${o.to}?`,
    detail: `${o.base} and ${o.to} are cloned into .git/${DIR}/ (never committed), ${branchFor(o.to)} is created from ${o.current || 'HEAD'}, and ${o.to}'s scripts/upgrade replaces the ANEW files this project never changed. Nothing is committed; /upgrade does the rest.${o.from}`,
  };
}

// The checks an upgrade needs green (G-7): doctor and selftest, kept with the state they ran on.
export interface Checks { doctor: Doctor; selftest: { code: number; result: string; fails: string[] }; state: string }
export function readChecks(d: { code: number; out: string }, s: { code: number; out: string }, state: string): Checks {
  const lines = s.out.replace(/\r/g, '').split('\n');
  return {
    doctor: readDoctor(d.code, d.out, state),
    selftest: { code: s.code, result: lines.find((l) => l.startsWith('== selftest:')) ?? '', fails: lines.filter((l) => l.startsWith('FAIL ')) },
    state,
  };
}
export const green = (c: Checks) => doctorGreen(c.doctor) && c.selftest.code === 0 && / 0 failed ==$/.test(c.selftest.result);

// What the screen knows, read again on each draw.
export interface Facts {
  version: string; // .anew-version in the working tree
  to: string; // the release being moved to: picked or fetched; '' before
  branch: string | null; // .anew-version on chore/anew-<to>; null: no such branch
  base: string | null; // .anew-version on the default branch; null: no default branch known
  defaultBranch: string;
  current: string;
  remote: string;
  gh: boolean;
  fetched: boolean; // both releases are under .git/anew-upgrade/
  state: string;
}

const line1 = (s: string | null) => (s ?? '').replace(/\r/g, '').split('\n')[0].trim();

export async function gather(o: { git: Git; gh: () => Promise<boolean>; version: string; to: string; fetched: boolean; index: string; seed: (gitIndex: string, to: string) => void }): Promise<Facts> {
  const { git } = o;
  const { current, remote, defaultBranch, ref } = await branches(git);
  const b = o.to ? branchFor(o.to) : '';
  const branch = b && (await has(git, `refs/heads/${b}`)) ? line1(await git(['show', `${b}:.anew-version`])) : null;
  const base = ref ? line1(await git(['show', `${ref}:.anew-version`])) : null;
  const f: Facts = { version: line1(o.version), to: o.to, branch, base, defaultBranch, current, remote, gh: false, fetched: o.fetched, state: '' };
  if (!o.to || phase(f, null) === 'merged') return f;
  f.state = await treeState(git, o.index, o.seed);
  f.gh = branch !== null && remote !== '' ? await o.gh() : false;
  return f;
}

export type Phase = 'available' | 'in the agent' | 'upgraded' | 'verified' | 'merged';
export const PHASES: Phase[] = ['available', 'in the agent', 'upgraded', 'verified', 'merged'];

// Merged: the default branch says the new tag — a squash-merged PR included (as 0014). Without a
// known default branch: the working tree says it, chore/anew-<tag> not checked out.
export function phase(f: Facts, checks: Checks | null): Phase {
  if (!f.to) return 'available';
  if (f.base !== null ? f.base === f.to : f.version === f.to && (f.branch === null || f.current !== branchFor(f.to))) return 'merged';
  // the releases gone (Start over, a removed folder): Fetch again, the branch there or not (N-4)
  if (f.branch !== f.to) return f.fetched ? 'in the agent' : 'available';
  return checks && green(checks) && checks.state === f.state && !f.state.startsWith(UNREAD) && f.version === f.to ? 'verified' : 'upgraded';
}

export const mergeStep = (f: Facts) => choreMerge(branchFor(f.to), f);

// Merged and pulled: the releases under .git/anew-upgrade/ and the remembered tag go (Requirement 7).
export const cleanup = (f: Facts) => !!f.to && f.version === f.to && phase(f, null) === 'merged';

// The script's answer, as it kept it in the git directory (H-1).
export const outFile = (to: string) => `upgrade-${to}.out`;

export function key(f: Facts, checks: Checks | null): string {
  return JSON.stringify([phase(f, checks), f.to, f.branch, f.current, f.remote, f.gh, f.fetched, f.version, checks ? checks.state === f.state : null]);
}

export interface View {
  facts: Facts;
  offer: Offer; // from the project's base
  base: string; // the release the upgrade started from: the working tree's until the agent writes the new one (L-7)
  pick: string; // the choice before Fetch ('' = the recommended one; none on the LTS line)
  compare: (base: string, to: string) => string; // the release diff link
  changelog: string[]; // the headings, once the new release is fetched (A-2)
  script: Script | null; // its last answer on this screen
  agent: Agent;
  checks: Checks | null;
  busy: '' | 'fetching' | 'checking' | 'pushing';
  prOutput: string | null;
  shell: boolean;
}

const LINE: Record<Phase, string> = {
  available: 'Fetch prepares the upgrade: both releases cloned, a branch, the unchanged ANEW files replaced. Nothing is committed.',
  'in the agent': 'The files this project changed are the agent\'s: run /upgrade. It merges them, writes .anew-version last and commits.',
  upgraded: '.anew-version says the new release. Run the checks on these files, then open the PR.',
  verified: 'doctor and selftest are green on these files. Open the PR; the team merges it.',
  merged: 'The upgrade is merged.',
};

// The upgrade section of the Start screen; '' when there is nothing to offer and nothing under way.
export function section(v: View): string {
  const f = v.facts;
  const card = (body: string) => `<section class="card up" aria-label="Upgrade ANEW"><span class="label">Upgrade ANEW</span>${body}</section>`;
  if (!f.to && v.offer.why) return card(`<p class="prose" role="note">${esc(v.offer.why)}</p>`);
  if (!f.to && !v.offer.choices.length) return '';
  const p = phase(f, v.checks);
  if (p === 'merged') {
    const d = f.defaultBranch;
    const pull = d && f.current !== d ? `git switch ${d}, then git pull` : 'git pull';
    return f.version === f.to ? '' : card(`<p class="prose" role="status">The upgrade to ${esc(f.to)} is merged on ${esc(d || 'the default branch')}: ${esc(pull)}.</p>`);
  }
  const to = f.to || (v.offer.choices.includes(v.pick) ? v.pick : v.offer.note ? '' : v.offer.choices[0]);
  const base = v.base || f.version;
  const at = PHASES.indexOf(p);
  const strip = `<ol class="strip" aria-label="Upgrade">${PHASES.map((s, i) => `<li class="step${i < at ? ' done' : i === at ? ' now' : ''}"${i === at ? ' aria-current="step"' : ''}>${i < at ? '✓ ' : i === at ? '● ' : ''}${esc(s)}</li>`).join('')}</ol>`;
  const head = to ? `<p class="prose"><strong>ANEW ${esc(base)} → ${esc(to)}</strong> · <a href="${esc(v.compare(base, to))}">what changed</a></p>` : '';
  const note = !f.to && v.offer.note ? `<p class="missing small" role="note">${esc(v.offer.note)}</p>` : '';
  const picks = !f.to && (v.offer.choices.length > 1 || v.offer.note) ? `<div class="row" role="group" aria-label="Release">${v.offer.choices.map((t) => `<button id="up-pick-${esc(t)}" class="secondary small" data-keep="1" aria-pressed="${t === to}">${esc(t)}${v.offer.note ? ' (leaves the LTS line)' : ''}</button>`).join('')}</div>` : '';
  const fetch = p === 'available' ? `<div class="row"><button id="up-fetch" class="primary"${v.shell && !v.busy && to ? '' : ' disabled'}>${v.busy === 'fetching' ? 'Fetching…' : 'Fetch and prepare'}</button><span class="muted small">${esc(v.shell ? 'after a confirmation: clones into .git/anew-upgrade/, a branch, scripts/upgrade' : 'No POSIX shell found: set anew.shell.')}</span></div>` : '';
  const s = v.script;
  const scriptBox = s === null ? '' : `<div class="result ${s.code === 0 ? 'ok' : 'refused'}" role="${s.code === 0 ? 'status' : 'alert'}"><strong>${esc(s.code === 0 ? s.summary || 'scripts/upgrade ran' : `scripts/upgrade exited ${s.code}`)}</strong>${s.code === 0 ? (s.merge.length ? `<p class="small">For /upgrade — changed by the project and by ${esc(to)}:</p><pre class="out">${esc(s.merge.join('\n'))}</pre>` : '') : `<pre class="out">${esc(s.out.trim())}</pre>`}</div>`;
  const log = v.changelog.length ? `<details><summary class="small">CHANGELOG, ${esc(base)} → ${esc(to)} (${v.changelog.length})</summary><ul class="facts">${v.changelog.map((h) => `<li>${esc(h)}</li>`).join('')}</ul></details>` : '';
  const cmd = command(to, v.agent.agent);
  const agentBox = p === 'in the agent' ? `<div class="row"><span>Run in your agent:</span><code class="cmd">${esc(cmd)}</code><button id="up-copy" class="secondary" data-keep="1">Copy</button>${canContinue(v.agent) ? '<button id="up-continue" class="primary" data-keep="1">Continue in Claude Code</button>' : ''}</div>
  <p class="muted small">${esc(canContinue(v.agent) ? 'Continue opens a fresh session with the command.' : v.agent.agent !== 'claude-code' ? `Copy it into ${adapter(v.agent.agent).label}'s chat.` : 'Copy the command into your agent.')}</p>` : '';
  // a start that went nowhere, or one to begin again: the releases and the tag forgotten; the branch kept (M-2)
  const reset = f.to && !v.busy && (p === 'available' || p === 'in the agent') ? `<p class="muted small">Not going on, or starting again? <button id="up-reset" class="link" data-keep="1">Start over</button> — the fetched releases and the remembered tag are removed; ${esc(branchFor(f.to))} and the script's changes in the working tree are kept: discard or stash them before you fetch again.</p>` : '';
  const c = v.checks;
  const stale = c && c.state !== f.state;
  const onBranch = f.current === branchFor(to);
  const checksBox = p !== 'upgraded' && p !== 'verified' ? '' : `<div class="row"><button id="up-checks" class="secondary"${v.shell && !v.busy && onBranch ? '' : ' disabled'}>${v.busy === 'checking' ? 'Running doctor and selftest…' : 'Run checks'}</button>
  <span class="muted small">${esc(!onBranch ? `the checks read the working tree: git switch ${branchFor(to)} first` : !v.shell ? 'No POSIX shell found: set anew.shell.' : f.state.startsWith(UNREAD) ? 'The working tree could not be read: no check can be matched to these files.' : stale ? 'The files changed since the checks ran: run them again.' : './scripts/doctor, then ./scripts/selftest — read-only; selftest takes minutes.')}</span></div>
${c && !stale ? `<div class="result ${green(c) ? 'ok' : 'refused'}" role="${green(c) ? 'status' : 'alert'}"><strong>${esc(c.doctor.result || `doctor exited ${c.doctor.code}`)} · ${esc(c.selftest.result || `selftest exited ${c.selftest.code}`)}</strong>${c.doctor.fails.length || c.selftest.fails.length ? `<pre class="out">${esc([...c.doctor.fails, ...c.selftest.fails].join('\n'))}</pre>` : ''}</div>` : ''}`;
  const m = (p === 'upgraded' || p === 'verified') ? mergeStep(f) : null;
  const merge = m === null ? '' : `<div><span class="label">The merge of ${esc(branchFor(to))}</span>
  ${m.offered ? `<div class="row"><button id="up-pr" class="primary"${v.busy ? ' disabled' : ''}>${v.busy === 'pushing' ? 'Pushing…' : 'Push and open PR'}</button><span class="muted small">git push -u ${esc(f.remote)} ${esc(branchFor(to))}, then gh pr create --fill — after a confirmation. The merge stays with the team.</span></div>`
    : `<p class="muted small">${esc(m.why)}</p><pre class="out">${esc(m.commands.join('\n'))}</pre>`}
  ${v.prOutput !== null ? `<pre class="out" role="status">${esc(v.prOutput)}</pre>` : ''}
  <p class="foot">After the PR is merged, pull ${esc(f.defaultBranch || 'the default branch')}: this section goes once its .anew-version says ${esc(to)}.</p></div>`;
  return card(`
${strip}
${head}
<p class="prose">${esc(LINE[p])}</p>
${note}${picks}${fetch}${scriptBox}${log}${agentBox}${reset}${checksBox}${merge}`);
}

export const CSS = `.up ol.strip { list-style: none; margin: 0; padding: 0; }
.up .rec { font-size: 11px; opacity: .8; }
.up details summary { cursor: pointer; }`;
