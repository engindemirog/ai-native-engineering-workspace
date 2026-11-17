// The approval screen, laid out as the approved mockup: the stage strip, the summary as cards,
// the decision box, gate's answer. The frame (CSP, theme, script) is screens.ts.
import type { Section } from './summary.ts';
import type { Offer } from './panel-logic.ts';
import type { Row } from './status.ts';
import { files, pairs, risks, criteria, plain } from './cards.ts';
import { esc, page, strip, header, warnings, answerBox, card, raw } from './screens.ts';

export { notice } from './screens.ts';

export interface View {
  row: Row;
  file: string; // workspace-relative path of the file the screen reads
  sections: Section[];
  offer: Offer;
  result: { written: boolean; code: number; text: string; next: string; after?: string } | null;
  approver: string; // git user.name, which gate writes; '' when unset
  nonce: string;
  cspSource: string;
}

export function html(v: View): string {
  const what = v.offer.write === 'approve-spec' ? 'spec' : 'plan';
  const kind = v.offer.write === 'approve-spec' ? 'Spec' : v.offer.write === 'approve-plan' ? 'Plan' : '';
  const title = kind ? `${kind} ${v.row.spec} — ${v.row.name}` : `${v.row.spec} — ${v.row.name}`;
  const base = v.file.split('/').pop() ?? v.file;
  const next = v.offer.write === null && v.row.next && !v.result?.written ? `<p class="muted">Next: ${esc(v.row.next)}</p>` : '';
  // after the refresh the row has moved on; the answer's own write names what was approved
  const approved = (v.result?.after ? (v.result.after === 'PLAN' ? 'Spec' : 'Plan') : kind || 'Plan');
  return page({ title, nonce: v.nonce, cspSource: v.cspSource }, `
${header(v.file, title)}
${strip(v.row)}
${warnings(v.row)}
${cards(v.sections)}
${next}
${decide(v, what, base)}
${v.result ? answerBox(v.result, `${approved} approved — written and committed`) : ''}`);
}

function cards(sections: Section[]): string {
  if (sections.length === 0) return '<p class="muted">No summary in this file — open the file.</p>';
  const by = new Map(sections.map((s) => [s.title, s.body]));
  const out: string[] = [];
  const grid: string[] = [];
  const f = by.get('Files to change or add');
  if (f !== undefined) {
    const list = files(f);
    grid.push(card(`Files to change · ${list.length}`, list.length ? `<ul class="mono">${list.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : raw(f)));
  }
  const m = by.get('Criterion ↔ test map');
  if (m !== undefined) {
    const p = pairs(m);
    const mapped = p.filter((x) => x.proof !== '').length;
    grid.push(card(`Criterion ↔ test · ${mapped}/${p.length} mapped`, p.length
      ? `<ul class="pairs">${p.map((x) => `<li><span class="id">${esc(x.criterion)}</span> → ${x.proof ? `<span class="mono">${esc(x.proof)}</span>` : '<span class="missing">⚠ no test yet</span>'}</li>`).join('')}</ul>`
      : raw(m)));
  }
  const intent = by.get('Intent');
  if (intent !== undefined) out.push(card('Intent', `<p class="prose">${esc(plain(intent))}</p>`));
  const a = by.get('Acceptance criteria');
  if (a !== undefined) {
    const c = criteria(a);
    out.push(c && c.length
      ? card(`Acceptance criteria · ${c.length}`, `<ul class="pairs">${c.map((x) => `<li><span class="id">${esc(x.id)}</span> ${esc(x.text)}</li>`).join('')}</ul>`)
      : card('Acceptance criteria', raw(a)));
  }
  if (grid.length) out.push(`<div class="grid">${grid.join('')}</div>`);
  const r = by.get('Risks & open questions');
  if (r !== undefined) {
    const list = risks(r);
    out.push(`<section aria-label="Risks"><span class="label">Risks · ${list.length}</span>${list.length
      ? list.map((x, i) => `<div class="card risk"><strong>${i + 1}. ${esc(x.title)}</strong>${x.advice ? `<span>${esc(x.advice)}</span>` : ''}</div>`).join('')
      : card('', raw(r))}</section>`);
  }
  out.push('<p class="muted">These cards are a summary; the decision is given on the full file.</p>');
  return out.join('\n');
}

function decide(v: View, what: string, base: string): string {
  const o = v.offer;
  if (v.result?.written) return ''; // gate's answer takes the decision box's place, as in the mockup
  if (o.write === null) {
    return `<div class="decide quiet"><div class="row"><button id="open" class="secondary">Open the file</button><span class="muted">${esc(o.hint)}</span></div></div>`;
  }
  const open = o.open && !o.approve ? `<button id="open" class="primary">Open the full ${what}</button>` : '';
  const approve = o.approve ? `<button id="approve" class="primary">Approve the ${what}</button>` : '';
  const changes = o.requestChanges ? '<button id="changes" class="secondary">Request changes…</button>' : '';
  const hint = o.hint.replace('The file', base);
  const who = v.approver ? `The approver is taken from git user.name: ${v.approver}.` : 'git user.name is not set: gate will refuse until it is.';
  return `<div class="decide">
  <div class="row">${open}${approve}${changes}</div>
  <p class="hint">${esc(hint)}</p>
  <p class="foot">The approval is written by <code>./scripts/gate ${esc(o.write)} ${esc(v.row.spec)}</code>. ${esc(who)}</p>
</div>`;
}
