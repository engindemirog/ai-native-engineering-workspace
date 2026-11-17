// The sidebar as the mockup's card list: + New work on top, then your turn · in progress ·
// shipped, each row a card naming the decision it waits for. Every value comes from
// `scripts/status --json`; the view model and its HTML are pure, the VS Code layer only hosts them.
import type { Row, Status, Group } from './status.ts';
import { grouped, waiting, writeFor } from './status.ts';
import { esc, page } from './screens.ts';

export interface Card {
  spec: string;
  name: string;
  badge: string; // the decision (Spec approval, Plan approval, Triage, Ship) or the stage
  tone: 'you' | 'agent' | 'done' | 'warn';
  line: string; // the first warning, else status's next step
}

export interface Model {
  groups: { group: Group; cards: Card[] }[];
  waiting: number;
  message: string | null; // a problem, "reading…", or the empty workspace
  meta: string; // mode · version, as the mockup's header
}

// What a row waits for, in the list's words.
export function badge(r: Row): string {
  const w = writeFor(r);
  if (w === 'approve-spec') return 'Spec approval';
  if (w === 'approve-plan') return 'Plan approval';
  if (r.stage.startsWith('unclear')) return 'Unclear';
  if (r.stage === 'shipped') return 'Shipped';
  if (r.who === 'human') return r.stage === 'SHIP' ? 'Ship' : r.stage === 'REVIEW' || r.stage === 'VERIFY' ? 'Triage' : r.stage;
  return r.stage;
}

export function card(r: Row): Card {
  const tone = r.warnings.length ? 'warn' : r.stage === 'shipped' ? 'done' : r.who === 'human' || r.stage.startsWith('unclear') ? 'you' : 'agent';
  const line = r.warnings.length ? `⚠ ${r.warnings[0]}` : r.stage.startsWith('unclear') ? r.stage : r.next || (r.who ? `${r.who} has it` : '');
  return { spec: r.spec, name: r.name, badge: badge(r), tone, line };
}

export function model(status: Status | null, problem: string | null, meta: string): Model {
  if (problem !== null) return { groups: [], waiting: 0, message: problem, meta };
  if (status === null) return { groups: [], waiting: 0, message: 'reading scripts/status…', meta };
  const g = grouped(status);
  const groups = (['your turn', 'in progress', 'shipped'] as Group[]).filter((k) => g[k].length > 0).map((group) => ({ group, cards: g[group].map(card) }));
  return { groups, waiting: waiting(status), message: status.rows.length === 0 ? 'No work yet — start with + New work.' : null, meta };
}

const LABEL: Record<Group, string> = { 'your turn': 'Your turn', 'in progress': 'In progress', shipped: 'Shipped' };

export function html(m: Model, nonce: string, cspSource: string): string {
  const cards = (cs: Card[], group: Group) => cs.map((c) => {
    const who = group === 'your turn' ? 'your turn' : group === 'shipped' ? 'shipped' : 'in progress';
    return `<button id="row-${esc(c.spec)}" data-keep="1" class="item ${c.tone}" aria-label="${esc(`${c.spec} ${c.name}: ${c.badge}, ${who}`)}">
  <span class="top"><span class="name">${esc(c.spec)} · ${esc(c.name)}</span><span class="badge ${c.tone}">${esc(c.badge)}</span></span>
  ${c.line ? `<span class="sub">${esc(c.line)}</span>` : ''}
</button>`;
  }).join('\n');
  const groups = m.groups.map(({ group, cards: cs }) => group === 'shipped'
    ? `<details><summary class="glabel shipped">${LABEL[group]} · ${cs.length}</summary>${cards(cs, group)}</details>`
    : `<section aria-label="${LABEL[group]}"><h2 class="glabel ${group === 'your turn' ? 'you' : 'agent'}">${LABEL[group]} · ${cs.length}</h2>${cards(cs, group)}</section>`).join('\n');
  return page({ title: 'ANEW', nonce, cspSource }, `
<div class="side">
<div class="head"><span class="glabel">ANEW</span><span class="meta">${esc(m.meta)}</span></div>
<button id="new" data-keep="1" class="primary wide">+ New work</button>
${m.message ? `<p class="msg" role="status">${esc(m.message)}</p>` : ''}
${groups}
<p class="note">This list is <code>scripts/status --json</code>. The extension keeps no record of its own.</p>
<style nonce="${nonce}">${SIDE}</style>
</div>`);
}

const SIDE = `
main { padding: 10px 8px 16px; gap: 0; max-width: none; }
.side { display: flex; flex-direction: column; gap: 6px; }
.head { display: flex; justify-content: space-between; align-items: center; padding: 4px 8px 6px; }
.meta { font-family: var(--mono); font-size: 11px; color: var(--muted); }
.wide { width: 100%; margin-bottom: 6px; }
.glabel { margin: 10px 8px 4px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--muted); }
.glabel.you { color: var(--fg); }
.glabel.you::before { content: '● '; color: var(--you); }
details > summary { cursor: pointer; list-style: revert; }
.item { display: flex; flex-direction: column; gap: 5px; width: 100%; text-align: left; margin: 2px 0; padding: 9px 10px; min-height: 0; border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--fg); font-weight: 400; }
.item:hover { background: var(--card); border-color: var(--line); }
.item.you { background: var(--card); border-color: color-mix(in srgb, var(--you) 45%, transparent); }
.top { display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%; }
.name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge { flex: none; font-size: 11px; padding: 1px 8px; border-radius: 10px; border: 1px solid var(--line); color: var(--fg); }
.badge.you { background: var(--you); border-color: transparent; color: #1b1c20; font-weight: 600; }
.badge.agent { border-color: color-mix(in srgb, var(--accent) 70%, transparent); }
.badge.done { border-color: transparent; background: color-mix(in srgb, var(--done) 18%, transparent); }
.badge.warn { border-color: var(--vscode-editorWarning-foreground); }
.sub { font-size: 12px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
.item.done .name { font-weight: 400; color: var(--muted); }
.msg { margin: 8px; color: var(--muted); }
.note { margin: 14px 4px 0; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--line); font-size: 12px; color: var(--muted); }
`;
