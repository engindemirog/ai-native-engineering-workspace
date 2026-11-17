// The approval panel's HTML. No remote content; VS Code's theme variables; a nonce'd script that
// only posts the button pressed back to the extension.
import type { Section } from './summary.ts';
import type { Offer } from './panel-logic.ts';
import type { Row } from './status.ts';

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
  const title = v.offer.write ? `${v.row.spec} · ${v.row.name} — ${what} approval` : `${v.row.spec} · ${v.row.name}`;
  const summary = v.sections.length
    ? v.sections.map((s) => `<section><h2>${esc(s.title)}</h2><pre>${esc(s.body)}</pre></section>`).join('\n')
    : '<p class="muted">No summary in this file — open the file.</p>';
  const warnings = v.row.warnings.map((w) => `<li>${esc(w)}</li>`).join('');
  const result = v.result === null ? '' : v.result.written
    ? `<div class="result ok" role="status"><strong>Written.</strong><pre>${esc(v.result.text)}</pre><p>Next: ${esc(v.result.next)}</p></div>`
    : `<div class="result refused" role="alert"><strong>Refused (exit ${v.result.code}) — nothing was written.</strong><pre>${esc(v.result.text)}</pre></div>`;
  const approve = v.offer.approve ? `<button id="approve" class="primary">Approve the ${what}</button>` : '';
  const changes = v.offer.requestChanges ? '<button id="changes" class="secondary">Request changes…</button>' : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${v.cspSource} 'nonce-${v.nonce}'; script-src 'nonce-${v.nonce}';">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style nonce="${v.nonce}">
body { font-family: var(--vscode-font-family); font-size: var(--vscode-font-size); color: var(--vscode-foreground); background: var(--vscode-editor-background); padding: 16px 24px; max-width: 980px; }
h1 { font-size: 1.6em; margin: 4px 0 8px; }
h2 { font-size: 0.85em; letter-spacing: .06em; text-transform: uppercase; color: var(--vscode-descriptionForeground); margin: 0 0 6px; }
.path, .muted { color: var(--vscode-descriptionForeground); }
.path { font-family: var(--vscode-editor-font-family); font-size: .9em; }
.stage { display: inline-block; margin: 4px 0 16px; padding: 2px 10px; border-radius: 10px; border: 1px solid var(--vscode-focusBorder); }
section { margin: 0 0 14px; padding: 12px 14px; border: 1px solid var(--vscode-panel-border, var(--vscode-widget-border, transparent)); border-radius: 6px; }
pre { margin: 0; white-space: pre-wrap; font-family: var(--vscode-editor-font-family); font-size: var(--vscode-editor-font-size); }
.warn { color: var(--vscode-editorWarning-foreground); }
.decide { margin-top: 18px; padding: 14px 16px; border-radius: 6px; border: 1px solid var(--vscode-focusBorder); }
.row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 10px; }
button { min-height: 32px; padding: 0 16px; border-radius: 2px; border: 1px solid var(--vscode-button-border, transparent); font: inherit; cursor: pointer; }
button.primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
button.primary:hover { background: var(--vscode-button-hoverBackground); }
button.secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
button:focus-visible { outline: 1px solid var(--vscode-focusBorder); outline-offset: 2px; }
.result { margin-top: 14px; padding: 12px 14px; border-radius: 6px; }
.result.ok { border: 1px solid var(--vscode-testing-iconPassed, var(--vscode-focusBorder)); }
.result.refused { border: 1px solid var(--vscode-errorForeground); }
</style>
</head>
<body>
<div class="path">${esc(v.file)}</div>
<h1>${esc(title)}</h1>
<div class="stage">${esc(v.row.stage)}${v.row.who ? ` · ${esc(v.row.who)}` : ''}</div>
${warnings ? `<ul class="warn">${warnings}</ul>` : ''}
${v.row.next ? `<p class="muted">Next: ${esc(v.row.next)}</p>` : ''}
${summary}
<p class="muted">This is a summary; the decision is on the full file.</p>
<div class="decide">
  <div class="row">
    <button id="open" class="${v.offer.approve ? 'secondary' : 'primary'}">Open the full file</button>
    ${approve}
    ${changes}
  </div>
  <p class="muted">${esc(v.offer.hint)}</p>
  ${result}
</div>
<script nonce="${v.nonce}">
const vscode = acquireVsCodeApi();
for (const id of ['open', 'approve', 'changes']) {
  const b = document.getElementById(id);
  if (b) b.addEventListener('click', () => { b.disabled = true; vscode.postMessage({ type: id }); });
}
</script>
</body>
</html>`;
}
