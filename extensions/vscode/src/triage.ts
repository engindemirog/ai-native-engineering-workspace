// The triage screen (mockup "Triage paneli"): the findings split from a pasted report, one decision
// each — real · noise · defer · investigate, none chosen for the human — and the one
// `scripts/gate triage` call that writes them. A defer's backlog entry is the one line the
// extension writes itself; it is previewed with the table (spec 0010, Constraints).
import type { Finding, Severity } from './report.ts';
import type { Row } from './status.ts';
import { esc, page, strip, header, answerBox } from './screens.ts';

export type Verdict = 'real' | 'noise' | 'defer' | 'investigate';
export const VERDICTS: Verdict[] = ['real', 'noise', 'defer', 'investigate'];
export type Kind = 'review' | 'verify';

export interface Decision {
  finding: Finding;
  verdict: Verdict | null;
  note: string;
}

// gate refuses '|', tabs and line breaks in a finding or a note; the screen's text is one line.
export const oneLine = (s: string) => s.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();

// The finding as the table holds it. scripts/status reads a round's severity from the id (H-1,
// L-2, Info-3) or a severity word among the first two words; an id that says none (L-a, F-1)
// gets the severity in front, so the round stays readable.
export function text(f: Finding): string {
  const readable = /^(?:[CHMLI]|Info)-\d/i.test(f.id) || f.severity === '';
  return oneLine(readable ? `${f.id} ${f.title}` : `${f.severity} ${f.id} ${f.title}`).slice(0, 200);
}

// Why Save is not offered yet; empty when it is.
export function problems(ds: Decision[]): string[] {
  const out: string[] = [];
  for (const d of ds) {
    if (oneLine(d.finding.title) === '') out.push(`${d.finding.id}: the finding has no text`);
    if (d.verdict === null) out.push(`${d.finding.id}: no decision yet`);
    else if (d.verdict === 'noise' && oneLine(d.note) === '') out.push(`${d.finding.id}: noise needs its rationale`);
  }
  return out;
}

// The round gate will write: the plan's `### Review round` (or `### VERIFY round`) headings under
// `## Triage`, plus one — read the way scripts/gate reads them.
export function round(plan: string, kind: Kind): number {
  let inside = false;
  let n = 0;
  for (const line of plan.replace(/\r/g, '').split('\n')) {
    if (line.startsWith('## ')) { inside = line.startsWith('## Triage'); continue; }
    if (inside && /^### /.test(line) && new RegExp(`^### +${kind}( |$)`, 'i').test(line)) n++;
  }
  return n + 1;
}

export function nextB(backlog: string): number {
  const ns = [...backlog.matchAll(/\*\*B-(\d+)\*\*/g)].map((m) => Number(m[1]));
  return (ns.length ? Math.max(...ns) : 0) + 1;
}

export interface Context {
  kind: Kind;
  spec: string;
  plan: string; // the plan's text
  backlog: string; // specs/backlog.md's text
  name: string; // git user.name
  today: string; // YYYY-MM-DD
}

export interface Write {
  args: string[]; // scripts/gate's arguments
  entries: string[]; // backlog lines to append before the call, one per defer
  preview: string; // what lands in the plan
}

const SEVERITY = (s: Severity) => s || 'unstated';

// The gate call, the backlog entries and the preview, from complete decisions.
export function write(ds: Decision[], c: Context): Write {
  let b = nextB(c.backlog);
  const k = round(c.plan, c.kind);
  const label = c.kind === 'review' ? 'Review' : 'VERIFY';
  const entries: string[] = [];
  const args = ['triage', c.spec, c.kind === 'review' ? '--review' : '--verify'];
  const rows: string[] = [];
  for (const d of ds) {
    if (d.verdict === null) throw new Error(`${d.finding.id}: no decision yet`);
    let note = oneLine(d.note);
    if (d.verdict === 'defer' && !/\bB-\d+\b/.test(note)) {
      const id = `B-${b++}`;
      entries.push(`- **${id}** — ${oneLine(d.finding.title)} — Source: spec ${c.spec}, ${c.kind === 'review' ? 'review' : 'VERIFY'} round ${k} (${d.finding.id}) — Severity: ${SEVERITY(d.finding.severity)} — Recommendation: ${oneLine(d.finding.recommendation) || 'see the finding'} — Deferred by: ${c.name}, ${c.today}, ${note || 'deferred at triage'}`);
      note = note ? `${id} — ${note}` : id;
    }
    args.push('--finding', text(d.finding), d.verdict, note);
    rows.push(`| ${text(d.finding)} | ${d.verdict} | ${note} |`);
  }
  const head = `### ${label} round ${k} — ${c.name}, ${c.today}`;
  const preview = rows.length
    ? `${head}\n| Finding | Verdict (real / noise / defer / investigate) | Note (fix commit, rationale, B-<n>, A-<n>) |\n|---|---|---|\n${rows.join('\n')}`
    : head;
  return { args, entries, preview };
}

export interface TriageView {
  row: Row;
  plan: string; // workspace-relative plan path
  kind: Kind;
  kinds: Kind[]; // the kinds the row's stage allows (both at "unclear: investigate open")
  report: string;
  decisions: Decision[] | null; // null until a report was split (or a clean round chosen)
  preview: Write | null;
  problems: string[];
  shell: boolean;
  running: boolean;
  result: { written: boolean; code: number; text: string; next: string } | null;
  nonce: string;
  cspSource: string;
}

const SEV_CLASS: Record<string, string> = { Critical: 'hi', High: 'hi', Medium: 'mid', Low: 'low', Info: 'info', '': 'info' };

export function html(v: TriageView): string {
  const label = v.kind === 'review' ? 'Review' : 'VERIFY';
  const title = `${v.row.spec} · ${v.row.name} — ${label} findings`;
  const kinds = v.kinds.length > 1 ? `<div class="row">${v.kinds.map((k) => `<button id="kind-${k}" class="secondary" data-keep="1" aria-pressed="${k === v.kind}">${k === 'review' ? 'Review round' : 'VERIFY round'}</button>`).join('')}</div>` : '';
  const paste = `<section aria-label="Report"><span class="label">The ${label} report</span>
<p class="muted">Paste the report as the reviewer returned it. The screen splits it into findings; you decide each one.</p>
<textarea name="report" placeholder="Paste the ${esc(label)} report here">${esc(v.report)}</textarea>
<div class="row"><button id="split" class="primary">Split into findings</button><button id="clean" class="secondary">Clean round — no findings</button><button id="add" class="secondary">Add a finding by hand</button></div></section>`;
  const ds = v.decisions;
  const decided = ds ? ds.filter((d) => d.verdict !== null).length : 0;
  const cards = ds === null ? '' : ds.length === 0
    ? '<p class="muted" role="status">A clean round: no findings. Save writes the round with no table.</p>'
    : `<p class="muted" role="status">${ds.length} finding(s) read from the report · ${decided} / ${ds.length} decided. The reviewer's recommendation is shown; no decision is chosen for you. A missed finding: add it by hand.</p>` + ds.map((d, i) => `
<div class="card finding">
  <div class="row"><span class="tag">${esc(d.finding.id)}</span><span class="sev ${SEV_CLASS[d.finding.severity]}">${esc(d.finding.severity || 'severity?')}</span>
  <input name="title-${i}" aria-label="${esc(d.finding.id)} text" value="${esc(d.finding.title)}" class="grow"><button id="rm-${i}" class="secondary small" aria-label="Remove ${esc(d.finding.id)}">Remove</button></div>
  ${d.finding.detail ? `<p class="muted small">${esc(d.finding.detail)}</p>` : ''}
  ${d.finding.recommendation ? `<p class="small"><strong>Recommendation:</strong> ${esc(d.finding.recommendation)}</p>` : ''}
  <div class="row" role="group" aria-label="${esc(d.finding.id)} decision">${VERDICTS.map((x) => `<button id="v-${i}-${x}" class="secondary" data-keep="1" aria-pressed="${d.verdict === x}">${x}</button>`).join('')}</div>
  <input name="note-${i}" aria-label="${esc(d.finding.id)} note" placeholder="${d.verdict === 'noise' ? 'why it is noise (required)' : d.verdict === 'defer' ? 'why later (a B-<n> entry is written for it)' : d.verdict === 'real' ? 'note (the fix round names its commit later)' : 'note'}" value="${esc(d.note)}">
</div>`).join('');
  const preview = v.preview ? `<div class="card"><span class="label">Written to the plan</span><pre class="out">${esc(v.preview.preview)}</pre>${v.preview.entries.length ? `<span class="label">Appended to specs/backlog.md first</span><pre class="out">${esc(v.preview.entries.join('\n'))}</pre>` : ''}</div>` : '';
  const save = ds === null || v.result?.written ? '' : `<div class="decide">
  <div class="row"><button id="save" class="primary"${v.problems.length || !v.shell || v.running ? ' disabled' : ''}>Save triage</button></div>
  <p class="hint">${esc(!v.shell ? 'No POSIX shell found: set anew.shell. Nothing can be written.' : v.running ? 'Running ./scripts/gate triage…' : v.problems.length ? `Decide every finding first: ${v.problems.join('; ')}.` : 'The table is written to the plan and committed.')}</p>
  <p class="foot">Written by <code>./scripts/gate triage ${esc(v.row.spec)} --${v.kind}</code>.</p>
</div>`;
  return page({ title, nonce: v.nonce, cspSource: v.cspSource }, `
${header(`${v.plan} · ## Triage`, title)}
${strip(v.row)}
${kinds}
${v.result?.written ? '' : paste}
${cards}
${preview}
${save}
${v.result ? answerBox(v.result, 'Triage saved — written and committed') : ''}
<style nonce="${v.nonce}">
.finding { gap: 10px; }
.tag { font-weight: 700; font-family: var(--mono); }
.sev { font-size: 11px; padding: 1px 8px; border-radius: 10px; border: 1px solid var(--line); }
.sev.hi { background: var(--bad); color: var(--vscode-editor-background); border-color: transparent; }
.sev.mid { background: var(--you); color: #1b1c20; border-color: transparent; }
.grow { flex: 1 1 260px; min-width: 0; }
.small { font-size: 12.5px; margin: 0; }
button.small { min-height: 30px; padding: 0 10px; }
</style>`);
}
