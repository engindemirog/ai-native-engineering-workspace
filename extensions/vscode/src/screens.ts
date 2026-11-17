// The frame every ANEW screen shares (approval, start, triage, ship, the sidebar): escaping, the
// CSP, the mockup's shapes over VS Code's theme colours, the stage strip and gate's answer. No
// remote content; a nonce'd script posts the pressed button (and a screen's form values) back.
import type { Row } from './status.ts';
import { steps } from './panel-logic.ts';

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

export interface Frame {
  title: string;
  nonce: string;
  cspSource: string;
}

// A page: the body, and the script that sends every `button[id]` press to the extension as
// { type: id, form } — form holds the page's named inputs, for the screens that have them.
export function page(f: Frame, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${f.cspSource} 'nonce-${f.nonce}'; script-src 'nonce-${f.nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(f.title)}</title>
<style nonce="${f.nonce}">${CSS}</style>
</head>
<body>
<main>${body}
</main>
<script nonce="${f.nonce}">
const vscode = acquireVsCodeApi();
const form = () => Object.fromEntries([...document.querySelectorAll('[name]')].map((e) => [e.name, e.type === 'radio' ? (e.checked ? e.value : undefined) : e.value]).filter((x) => x[1] !== undefined));
// the page is drawn again after every decision: the element that had focus gets it back
const key = (e) => (e && e.id ? '#' + e.id : e && e.name ? '[name="' + e.name + '"]' : '');
const keep = () => vscode.setState({ focus: key(document.activeElement) });
const back = (vscode.getState() || {}).focus;
if (back) { const el = document.querySelector(back); if (el) el.focus(); vscode.setState({}); }
let typing;
const send = (type) => { clearTimeout(typing); keep(); vscode.postMessage({ type, form: form() }); };
for (const b of document.querySelectorAll('button[id]')) {
  b.addEventListener('click', () => { if (!b.dataset.keep) b.disabled = true; send(b.id); });
}
// a choice in a list takes effect at once (a severity can unlock Save)
for (const s of document.querySelectorAll('select[name]')) {
  s.addEventListener('change', () => send('sync'));
}
// typing is kept by the extension as it goes, so a redraw or a hidden tab loses nothing. A text
// field never redraws the page (a redraw would take the focus and a click on the way): the
// extension answers with an update of the parts that follow the text, in place.
for (const s of document.querySelectorAll('input[name], textarea[name]')) {
  s.addEventListener('input', () => { clearTimeout(typing); typing = setTimeout(() => vscode.postMessage({ type: 'input', form: form() }), 300); });
}
window.addEventListener('message', (e) => {
  const m = e.data;
  if (!m || m.type !== 'update') return;
  for (const [id, h] of Object.entries(m.html || {})) { const el = document.getElementById(id); if (el) el.innerHTML = h; }
  for (const [id, d] of Object.entries(m.disabled || {})) { const el = document.getElementById(id); if (el) el.disabled = d; }
});
</script>
</body>
</html>`;
}

// A page without a row: the work list's own problem (no shell, scripts/status failing) or a row
// that left the list. No script.
export function notice(text: string, nonce: string, cspSource: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'nonce-${nonce}';">
<style nonce="${nonce}">${CSS}</style></head>
<body><main><div class="card warn" role="alert"><span class="label">ANEW</span><p class="prose">${esc(text)}</p></div></main></body></html>`;
}

// The stage strip: done in green, the row's stage named with who has it (orange when it is the
// human's), the rest outlined.
export function strip(row: Row): string {
  return `<nav class="strip" aria-label="Stage">${steps(row).map((s) => {
    if (s.state === 'done') return `<span class="step done">✓ ${s.name}</span>`;
    if (s.state === 'todo') return `<span class="step">${s.name}</span>`;
    const who = row.who === 'human' ? 'waiting for you' : row.who;
    return `<span class="step now${row.who === 'human' ? ' you' : ''}">● ${s.name}${who ? ` · ${esc(who)}` : ''}</span>`;
  }).join('')}</nav>`;
}

export function header(path: string, title: string): string {
  return `<header>
  <span class="path">${esc(path)}</span>
  <h1>${esc(title)}</h1>
</header>`;
}

export function warnings(row: Row): string {
  return row.warnings.length ? `<div class="card warn" role="note"><span class="label">Warnings</span><ul>${row.warnings.map((w) => `<li>${esc(w)}</li>`).join('')}</ul></div>` : '';
}

// gate's answer as it is: written (with the next command and Copy) or refused (exit code named).
export function answerBox(r: { written: boolean; code: number; text: string; next: string }, headline: string): string {
  if (!r.written) {
    return `<div class="result refused" role="alert"><strong>Refused (exit ${r.code}) — nothing was written.</strong><pre class="out">${esc(r.text)}</pre></div>`;
  }
  return `<div class="result ok" role="status">
  <strong>✓ ${esc(headline)}</strong>
  <pre class="out">${esc(r.text)}</pre>
  ${r.next ? `<div class="row"><span>Next step — run in your agent:</span><code class="cmd">${esc(r.next)}</code><button id="copy" class="secondary" data-keep="1">Copy</button></div>` : ''}
</div>`;
}

export const card = (label: string, body: string) => `<div class="card">${label ? `<span class="label">${esc(label)}</span>` : ''}${body}</div>`;
export const raw = (body: string) => `<pre>${esc(body)}</pre>`;

// The mockup's shapes over the theme's colours: cards are the foreground at a few percent over the
// editor background, "your turn" is the theme's orange (with dark text, AA in every theme), done
// is its green.
export const CSS = `
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
.step.done { border-color: transparent; background: color-mix(in srgb, var(--done) 18%, transparent); color: var(--fg); }
.step.now { border-color: var(--accent); color: var(--fg); font-weight: 600; }
.step.now.you { border-color: transparent; background: var(--you); color: #1b1c20; }
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
.missing { font-weight: 600; }
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
button[aria-pressed="true"] { background: var(--accent); color: var(--vscode-button-foreground); border-color: var(--accent); }
button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--vscode-focusBorder); outline-offset: 2px; }
button:disabled { opacity: .45; cursor: not-allowed; }
input, textarea { font: inherit; color: var(--vscode-input-foreground, var(--fg)); background: var(--vscode-input-background, var(--card)); border: 1px solid var(--vscode-input-border, var(--line)); border-radius: 6px; padding: 8px 10px; }
textarea { min-height: 96px; resize: vertical; font-family: var(--mono); font-size: 12.5px; }
.result { padding: 18px 20px; border-radius: 10px; display: flex; flex-direction: column; gap: 12px; }
.result.ok { background: color-mix(in srgb, var(--done) 10%, var(--bg)); border: 1px solid color-mix(in srgb, var(--done) 55%, transparent); }
.result.ok strong { color: var(--fg); }
.result.refused { background: color-mix(in srgb, var(--bad) 8%, var(--bg)); border: 1px solid var(--bad); }
.out { padding: 12px 14px; border-radius: 6px; background: color-mix(in srgb, var(--fg) 6%, var(--bg)); line-height: 1.7; }
.cmd { padding: 6px 10px; border-radius: 4px; background: color-mix(in srgb, var(--fg) 8%, var(--bg)); font-size: 13px; }
`;
