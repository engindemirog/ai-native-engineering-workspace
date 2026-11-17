// The ship screen (mockup "Ship"): what the files say before the human ships — each criterion with
// its proof from the plan, the Definition of Done, the build evidence, the triage rounds — and one
// `scripts/gate ship NNNN`. After it, the push and the PR, only with the human's confirmation; the
// merge stays on GitHub (spec 0010, G-3). Criteria carry no tick boxes: shown with their proof,
// shipped with one button (G-5).
import type { Row } from './status.ts';
import { sections } from './summary.ts';
import { criteria, pairs, items, plain } from './cards.ts';
import { esc, page, strip, header, warnings, answerBox, card } from './screens.ts';

export interface Proved {
  id: string;
  text: string;
  proof: string; // the plan's criterion ↔ test map; '' when it names none
  moved: boolean; // struck through, moved out at ship (R-08)
}

export interface Model {
  criteria: Proved[] | null; // null: the criteria section could not be read — the file is shown instead
  dod: { text: string; done: boolean }[];
  evidence: string | null; // the newest CHECK GREEN line of ## Build evidence
  rounds: string[]; // the ### headings under ## Triage, oldest first
}

export function model(spec: string, plan: string): Model {
  const s = Object.fromEntries(sections(spec, ['Acceptance criteria', 'Definition of Done']).map((x) => [x.title, x.body]));
  const p = Object.fromEntries(sections(plan, ['Criterion ↔ test map', 'Build evidence']).map((x) => [x.title, x.body]));
  const proof = new Map(pairs(p['Criterion ↔ test map'] ?? '').map((x) => [x.criterion, x.proof]));
  const raw = s['Acceptance criteria'] ?? '';
  const cs = criteria(raw);
  const struck = new Set([...raw.matchAll(/~~((?:AC|CB|PB)-\d+)/g)].map((m) => m[1]));
  const dod = items(s['Definition of Done'] ?? '').map((i) => /^\[( |x|X)\]\s+(.*)$/s.exec(i.replace(/\s*\n\s*/g, ' '))).filter((m): m is RegExpExecArray => m !== null)
    .map((m) => ({ text: plain(m[2]), done: m[1] !== ' ' }));
  const evidence = (p['Build evidence'] ?? '').split('\n').filter((l) => l.includes('CHECK GREEN (full,')).pop()?.replace(/^[-*]\s+/, '').trim() ?? null;
  return {
    criteria: cs === null ? null : cs.map((c) => ({ id: c.id, text: c.text, proof: proof.get(c.id) ?? '', moved: struck.has(c.id) })),
    dod,
    evidence,
    rounds: triageRounds(plan),
  };
}

export function triageRounds(plan: string): string[] {
  let inside = false;
  const out: string[] = [];
  for (const line of plan.replace(/\r/g, '').split('\n')) {
    if (line.startsWith('## ')) { inside = line.startsWith('## Triage'); continue; }
    if (inside && line.startsWith('### ')) out.push(line.slice(4).trim());
  }
  return out;
}

// Ship is offered at SHIP, the human's, with no status warning (gate refuses one).
export function offered(row: Row): { ok: boolean; why: string } {
  if (row.stage !== 'SHIP' || row.who !== 'human') return { ok: false, why: `${row.stage}: ship comes after a clean VERIFY round.` };
  if (row.warnings.length) return { ok: false, why: 'status has a warning on this row: gate refuses to ship until it is resolved.' };
  return { ok: true, why: '' };
}

// A git probe's answer: its first stdout line on exit 0, '' otherwise — an error message is never
// a branch name.
export function probed(r: { code: number; stdout: string }): string {
  return r.code === 0 ? r.stdout.trim().split('\n')[0].trim() : '';
}

// The default branch from `git symbolic-ref --short refs/remotes/<remote>/HEAD`; '' when the remote
// has no HEAD (common) — unknown, never guessed: the push is then not offered.
export function defaultBranch(head: string, remote: string): string {
  return head.startsWith(`${remote}/`) ? head.slice(remote.length + 1) : head;
}

// After a written ship: the push and the PR. Offered when gh is signed in and the branch is not the
// default one; otherwise the commands to copy.
export function prStep(o: { branch: string; defaultBranch: string; remote: string; gh: boolean }): { offered: boolean; why: string; commands: string[] } {
  const commands = [`git push -u ${o.remote} ${o.branch}`, 'gh pr create --fill'];
  if (!o.branch || o.branch === 'HEAD') return { offered: false, why: 'no branch is checked out', commands };
  if (!o.defaultBranch) return { offered: false, why: `${o.remote} names no default branch (no ${o.remote}/HEAD; git remote set-head ${o.remote} --auto sets it): run the commands yourself`, commands };
  if (o.branch === o.defaultBranch) return { offered: false, why: `you are on ${o.branch}, the default branch: ship work from a feature branch (docs/git.md)`, commands };
  if (!o.gh) return { offered: false, why: 'gh is not signed in (gh auth status): run the commands yourself', commands };
  return { offered: true, why: '', commands };
}

export interface ShipView {
  row: Row;
  file: string; // the spec, workspace-relative
  model: Model;
  approver: string;
  shell: boolean;
  running: boolean;
  result: { written: boolean; code: number; text: string; next: string } | null;
  pr: { offered: boolean; why: string; commands: string[] } | null;
  prOutput: string | null;
  pushing: boolean; // git push and gh pr create are running
  nonce: string;
  cspSource: string;
}

export function html(v: ShipView): string {
  const title = `${v.row.spec} · ${v.row.name} — ship`;
  const m = v.model;
  const o = offered(v.row);
  const dod = card('Definition of Done · read from the spec', `<ul class="pairs">${m.dod.map((d) => `<li>${d.done ? '✓' : '○'} ${esc(d.text)}</li>`).join('')}${m.evidence ? `<li>✓ ${esc(m.evidence)}</li>` : '<li><span class="missing">⚠ no CHECK GREEN (full, …) line in the plan\'s Build evidence</span></li>'}</ul>`);
  const rounds = card(`Triage · ${m.rounds.length} round(s)`, m.rounds.length ? `<ul class="pairs">${m.rounds.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : '<p class="muted">No round recorded.</p>');
  const cs = m.criteria === null
    ? card('Criteria', '<p class="missing">⚠ The criteria could not be read: open the spec and check them there.</p>')
    : card(`Criteria ↔ proof · ${m.criteria.filter((c) => c.proof !== '' || c.moved).length} / ${m.criteria.length} with proof`, `<ul class="pairs">${m.criteria.map((c) => `<li><span class="id">${esc(c.id)}</span> ${esc(c.text)}<br><span class="muted small">${c.moved ? 'moved out (R-08)' : c.proof ? `proof: ${esc(c.proof)}` : '<span class="missing">⚠ no proof named in the plan</span>'}</span></li>`).join('')}</ul>`);
  const written = v.result?.written;
  const decide = written ? '' : `<div class="decide">
  <p class="prose">Ship ticks every criterion and the Definition of Done, writes <code>Status: Shipped</code>, moves the spec to <code>specs/done/</code> and commits. The scorecard, the PR and the merge stay with you.</p>
  <div class="row"><button id="open" class="secondary">Open the spec</button><button id="ship" class="primary"${o.ok && v.shell && !v.running ? '' : ' disabled'}>Ship</button></div>
  <p class="hint" role="status">${esc(!o.ok ? o.why : !v.shell ? 'No POSIX shell found: set anew.shell. Nothing can be written.' : v.running ? `Running ./scripts/gate ship ${v.row.spec}…` : 'Read the criteria with their proof above; Ship is one decision on all of them.')}</p>
  <p class="foot">Written by <code>./scripts/gate ship ${esc(v.row.spec)}</code>. ${esc(v.approver ? `The commit carries git user.name: ${v.approver}.` : 'git user.name is not set: gate will refuse until it is.')}</p>
</div>`;
  const pr = written && v.pr ? `<div class="card"><span class="label">Then: the PR</span>
  ${v.pr.offered
    ? `<div class="row"><button id="pr" class="primary"${v.pushing ? ' disabled' : ''}>Push and open PR…</button></div><p class="hint" role="status">${v.pushing ? 'Pushing and opening the PR…' : 'Asks first, naming the branch and the remote. Merging stays on GitHub.'}</p>`
    : `<p class="hint">${esc(v.pr.why)}.</p><div class="row"><button id="copy-cmds" class="secondary" data-keep="1">Copy the commands</button></div>`}
  <pre class="out">${esc(v.pr.commands.join('\n'))}</pre>
  ${v.prOutput !== null ? `<pre class="out" role="status">${esc(v.prOutput)}</pre>` : ''}
</div>` : '';
  return page({ title, nonce: v.nonce, cspSource: v.cspSource }, `
${header(v.file, title)}
${strip(v.row)}
${warnings(v.row)}
<div class="grid">${dod}${rounds}</div>
${cs}
${decide}
${v.result ? answerBox(v.result, 'Shipped — written and committed') : ''}
${pr}
<style nonce="${v.nonce}">.small { font-size: 12.5px; }</style>`);
}
