// The approval panel's HTML, laid out as the approved mockup: the stage strip, the summary as
// cards, the decision box, gate's answer. No remote content; colours come from VS Code's theme, so
// it reads in dark, light and high contrast; a nonce'd script only posts the button pressed back.
import type { Section } from './summary.ts';
import type { Offer } from './panel-logic.ts';
import { steps } from './panel-logic.ts';
import type { Row } from './status.ts';
import { files, pairs, risks, criteria, plain } from './cards.ts';

export interface View {
  row: Row;
  file: string; // workspace-relative path of the file the decision is on
  sections: Section[];
  offer: Offer;
  result: { written: boolean; code: number; text: string; next: string } | null;
  nonce: string;
  cspSource: string;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export function html(v: View): string {
  const what = v.offer.write === 'approve-spec' ? 'spec' : 'plan';
  const kind = v.offer.write === 'approve-spec' ? 'Spec' : v.offer.write === 'approve-plan' ? 'Plan' : '';
  const title = kind ? `${kind} ${v.row.spec} — ${v.row.name}` : `${v.row.spec} — ${v.row.name}`;
  const base = v.file.split('/').pop() ?? v.file;
  const strip = steps(v.row).map((s) => {
    if (s.state === 'done') return `<span class="step done">✓ ${s.name}</span>`;
    if (s.state === 'todo') return `<span class="step">${s.name}</span>`;
    const who = v.row.who === 'human' ? 'waiting for you' : v.row.who;
    return `<span class="step now${v.row.who === 'human' ? ' you' : ''}">● ${s.name}${who ? ` · ${esc(who)}` : ''}</span>`;
  }).join('');
  const warnings = v.row.warnings.length ? `<div class="card warn" role="note"><span class="label">Warnings</span><ul>${v.row.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : '';
  const next = v.offer.write === null && v.row.next && !v.result?.written ? `<p class="muted">Next: ${esc(v.row.next)}</p>` : '';
  return page(title, v, `
<header>
  <span class="path">${esc(v.file)}</span>
  <h1>${esc(title)}</h1>
</header>
<nav class="strip" aria-label="Stage">${strip}</nav>
${warnings}
${cards(v.sections)}
${next}
${decide(v, what, base)}
${result(v, what)}`);
}

// A page without a row: the work list's own problem (no shell, scripts/status failing) or a row
// that left the list. The panel says what the list says.
export function notice(text: string, nonce: string, cspSource: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'nonce-${nonce}';">
<style nonce="${nonce}">${CSS}</style></head>
<body><main><div class="card warn" role="alert"><span class="label">ANEW</span><p class="prose">${esc(text)}</p></div></main></body></html>`;
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
      ? `<ul class="pairs">${p.map((x) => `<li><span class="id">${esc(x.criterion)}</span> → ${x.proof ? `<span class="mono">${esc(x.proof)}</span>` : '<span class="missing">no test yet</span>'}</li>`).join('')}</ul>`
      : raw(m)));
  }
  const intent = by.get('Intent');
  if (intent !== undefined) out.push(card('Intent', `<p class="prose">${esc(plain(intent))}</p>`));
  const a = by.get('Acceptance criteria');
  if (a !== undefined) {
    const c = criteria(a);
    out.push(card(`Acceptance criteria · ${c.length}`, c.length
      ? `<ul class="pairs">${c.map((x) => `<li><span class="id">${esc(x.id)}</span> ${esc(x.text)}</li>`).join('')}</ul>`
      : raw(a)));
  }
  if (grid.length) out.push(`<div class="grid">${grid.join('')}</div>`);
  const r = by.get('Risks & open questions');
  if (r !== undefined) {
    const list = risks(r);
    out.push(`<section aria-label="Risks"><span class="label">Risks · ${list.length}, each with a recommendation</span>${list.length
      ? list.map((x, i) => `<div class="card risk"><strong>${i + 1}. ${esc(x.title)}</strong>${x.advice ? `<span>${esc(x.advice)}</span>` : ''}</div>`).join('')
      : card('', raw(r))}</section>`);
  }
  out.push('<p class="muted">These cards are a summary; the decision is given on the full file.</p>');
  return out.join('\n');
}

const card = (label: string, body: string) => `<div class="card">${label ? `<span class="label">${esc(label)}</span>` : ''}${body}</div>`;
const raw = (body: string) => `<pre>${esc(body)}</pre>`;

function decide(v: View, what: string, base: string): string {
  const o = v.offer;
  if (v.result?.written) return ''; // gate's answer takes the decision box's place, as in the mockup
  if (o.write === null) {
    return `<div class="decide quiet"><div class="row"><button id="open" class="secondary">Open the file</button><span class="muted">${esc(o.hint)}</span></div></div>`;
  }
  const open = o.approve ? '' : `<button id="open" class="primary">Open the full ${what}</button>`;
  const approve = o.approve ? `<button id="approve" class="primary">Approve the ${what}</button>` : '';
  const changes = o.requestChanges ? '<button id="changes" class="secondary">Request changes…</button>' : '';
  const hint = o.hint.replace('The file', base);
  return `<div class="decide">
  <div class="row">${open}${approve}${changes}</div>
  <p class="hint">${esc(hint)}</p>
  <p class="foot">The approval is written by <code>./scripts/gate ${esc(o.write)} ${esc(v.row.spec)}</code>.</p>
</div>`;
}

function result(v: View, what: string): string {
  const r = v.result;
  if (r === null) return '';
  if (!r.written) {
    return `<div class="result refused" role="alert"><strong>Refused (exit ${r.code}) — nothing was written.</strong><pre class="out">${esc(r.text)}</pre></div>`;
  }
  return `<div class="result ok" role="status">
  <strong>✓ ${what === 'spec' ? 'Spec' : 'Plan'} approved — written and committed</strong>
  <pre class="out">${esc(r.text)}</pre>
  ${r.next ? `<div class="row"><span>Next step — run in your agent:</span><code class="cmd">${esc(r.next)}</code><button id="copy" class="secondary">Copy</button></div>` : ''}
</div>`;
}

function page(title: string, v: View, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${v.cspSource} 'nonce-${v.nonce}'; script-src 'nonce-${v.nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style nonce="${v.nonce}">${CSS}</style>
</head>
<body>
<main>${body}
</main>
<script nonce="${v.nonce}">
const vscode = acquireVsCodeApi();
for (const id of ['open', 'approve', 'changes', 'copy']) {
  const b = document.getElementById(id);
  if (b) b.addEventListener('click', () => { if (id !== 'copy') b.disabled = true; vscode.postMessage({ type: id }); });
}
</script>
</body>
</html>`;
}

// The mockup's shapes over the theme's colours: cards are the foreground at a few percent over the
// editor background, "your turn" is the theme's orange, done is its green.
const CSS = `
:root {
  --fg: var(--vscode-foreground); --bg: var(--vscode-editor-background);
  --muted: var(--vscode-descriptionForeground);
  --card: color-mix(in srgb, var(--fg) 4%, var(--bg)); --line: color-mix(in srgb, var(--fg) 13%, transparent);
  --you: var(--vscode-charts-orange, #f0a050); --done: var(--vscode-charts-green, #8fe0b0);
  --accent: var(--vscode-button-background); --bad: var(--vscode-errorForeground);
  --mono: var(--vscode-editor-font-family, monospace);
}
body { margin: 0; background: var(--bg); color: var(--fg); font-family: var(--vscode-font-family); font-size: 14px; line-height: 1.45; }
main { max-width: 980px; padding: 28px 36px 36px; display: flex; flex-direction: column; gap: 20px; }
header { display: flex; flex-direction: column; gap: 6px; }
h1 { margin: 0; font-size: 26px; font-weight: 700; }
.path, .mono, code, pre { font-family: var(--mono); }
.path { font-size: 12px; color: var(--muted); }
.muted, .hint, .foot { color: var(--muted); margin: 0; }
.foot { font-size: 12px; }
.strip { display: flex; flex-wrap: wrap; gap: 6px; font-size: 12px; }
.step { padding: 5px 12px; border-radius: 14px; border: 1px solid var(--line); color: var(--muted); }
.step.done { border-color: transparent; background: color-mix(in srgb, var(--done) 18%, transparent); color: var(--done); }
.step.now { border-color: var(--accent); color: var(--fg); font-weight: 600; }
.step.now.you { border-color: transparent; background: var(--you); color: var(--vscode-editor-background); }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
.card { padding: 16px 18px; border-radius: 8px; background: var(--card); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.label { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
section { display: flex; flex-direction: column; gap: 10px; }
.risk { gap: 4px; padding: 14px 16px; }
.risk span { color: var(--muted); font-size: 13px; }
ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 3px; }
ul.mono { font-size: 12.5px; line-height: 1.7; }
.warn ul { list-style: disc; padding-left: 18px; }
.warn { border-color: var(--vscode-editorWarning-foreground); }
.pairs { font-size: 13px; line-height: 1.6; }
.id { font-weight: 600; }
.missing { color: var(--you); }
.prose { margin: 0; }
pre { margin: 0; white-space: pre-wrap; font-size: 12.5px; }
.decide { padding: 18px 20px; border-radius: 10px; background: var(--card); border: 1px solid color-mix(in srgb, var(--accent) 60%, transparent); display: flex; flex-direction: column; gap: 12px; }
.decide.quiet { border-color: var(--line); }
.row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
button { min-height: 40px; padding: 0 20px; border-radius: 6px; font: inherit; font-weight: 600; cursor: pointer; border: 1px solid var(--vscode-button-border, transparent); }
button.primary { background: var(--accent); color: var(--vscode-button-foreground); }
button.primary:hover { background: var(--vscode-button-hoverBackground); }
button.secondary { background: transparent; color: var(--fg); border-color: var(--line); font-weight: 500; }
button.secondary:hover { background: var(--card); }
button:focus-visible { outline: 2px solid var(--vscode-focusBorder); outline-offset: 2px; }
button:disabled { opacity: .45; cursor: not-allowed; }
.result { padding: 18px 20px; border-radius: 10px; display: flex; flex-direction: column; gap: 12px; }
.result.ok { background: color-mix(in srgb, var(--done) 10%, var(--bg)); border: 1px solid color-mix(in srgb, var(--done) 55%, transparent); }
.result.ok strong { color: var(--done); }
.result.refused { background: color-mix(in srgb, var(--bad) 8%, var(--bg)); border: 1px solid var(--bad); }
.out { padding: 12px 14px; border-radius: 6px; background: color-mix(in srgb, var(--fg) 6%, var(--bg)); line-height: 1.7; }
.cmd { padding: 6px 10px; border-radius: 4px; background: color-mix(in srgb, var(--fg) 8%, var(--bg)); font-size: 13px; }
`;
