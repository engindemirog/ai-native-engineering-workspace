// A pasted review or VERIFY report split into its findings (spec 0010, G-1): reports live in the
// chat, so the triage screen reads the text the human pastes. A finding opens with a bold id
// (`**H-1 …**`, `**L-a (Low)**`, `**F-1 Low …**`) or a bold severity (`**Low: …**`), as a line, a
// list item or a heading. A line that says an earlier finding is resolved is not a finding. What
// reads as no finding gives none — the screen then offers hand entry, never a guessed finding.

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info' | '';

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  detail: string; // the finding's own lines after its title, clipped
  recommendation: string; // the reviewer's "Recommendation:" / "Fix:", when the finding has one
}

// A finding id: one or two capitals or "Info", a dash, a number or a letter (H-1, CB-2, L-a,
// Info-3). Longer words with a number ("Fix-2", "Step-1") are not ids.
const ID = String.raw`(?:[A-Z]{1,2}|Info)-(?:\d+|[a-z])`;
const SEV = String.raw`Critical|High|Medium|Low|Info`;
const START = new RegExp(String.raw`^(\s*)(?:[-*+]\s+|\d+[.)]\s+|#{2,4}\s+)?\*\*(.+?)\*\*(.*)$`);
const BY_LETTER: Record<string, Severity> = { C: 'Critical', H: 'High', M: 'Medium', L: 'Low', I: 'Info', Info: 'Info' };

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const flat = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\s+/g, ' ').trim();

interface Open {
  indent: number;
  item: boolean; // opened as a list item: a sibling item ends it (under a bold line, items are its body)
  id: string; // '' until assigned (a severity-only finding)
  severity: Severity;
  title: string;
  lines: string[];
}

export function split(report: string): Finding[] {
  const open: Open[] = [];
  let cur: Open | null = null;
  let fence = false;
  let past = false; // under a heading about earlier findings (triaged, resolved, regressions)
  for (const raw of report.replace(/\r\n?/g, '\n').split('\n')) {
    if (/^\s*(```|~~~)/.test(raw)) { fence = !fence; continue; }
    if (fence) continue; // a code block is quoted material, not a finding or its text
    if (/^#{1,4}\s/.test(raw)) past = /triaged|resolved|regression|previous|earlier/i.test(raw);
    const f = past ? null : start(raw);
    if (f) { cur = f; open.push(f); continue; }
    if (cur === null) continue;
    const indent = /^\s*/.exec(raw)?.[0].length ?? 0;
    const ends = /^#{1,4}\s/.test(raw) || (cur.item && /^\s*(?:[-*+]|\d+[.)])\s/.test(raw) && indent <= cur.indent) || /^\s*\|/.test(raw);
    if (ends) { cur = null; continue; }
    if (raw.trim() !== '') cur.lines.push(raw.trim().replace(/^(?:[-*+]|\d+[.)])\s+/, ''));
  }
  // ids: the report's own, then a free one from the severity's letter for a finding without one
  const used = new Set(open.map((o) => o.id).filter(Boolean));
  for (const o of open) {
    if (o.id) continue;
    const letter = o.severity === 'Info' ? 'Info' : (o.severity || 'X')[0];
    let n = 1;
    while (used.has(`${letter}-${n}`)) n++;
    o.id = `${letter}-${n}`;
    used.add(o.id);
  }
  return open.map((o) => {
    const body = o.lines.join(' ');
    const title = o.title || clip(flat(body), 160);
    const rec = /\b(?:Recommendation|Recommended fix|Suggested fix|Fix|Öneri)\s*:\s*(.+)/i.exec(`${o.title} ${body}`);
    return { id: o.id, severity: o.severity, title: clip(title, 200), detail: clip(flat(o.title ? body : ''), 500), recommendation: rec ? clip(flat(rec[1]), 260) : '' };
  });
}

// A finding's first line, or null. `bold` is the text inside the first ** **, `rest` what follows.
function start(line: string): Open | null {
  // a heading names its finding without bold: "### M-1 (Medium) — title"
  const h = new RegExp(String.raw`^#{2,4}\s+(${ID}\b.*)$`).exec(line);
  const m = START.exec(line) ?? (h ? [line, '', h[1], ''] : null);
  if (!m) return null;
  const [, lead, bold, rest] = m;
  const item = /^\s*(?:[-*+]|\d+[.)])\s/.test(line);
  const byId = new RegExp(String.raw`^(${ID})\b\s*(.*)$`).exec(bold);
  const bySev = new RegExp(String.raw`^(${SEV})\b\s*[:.(—-]?\s*(.*)$`).exec(bold);
  if (!byId && !bySev) return null;
  let id = '';
  let after: string;
  let severity: Severity = '';
  if (byId) {
    id = byId[1];
    after = byId[2];
    severity = BY_LETTER[id.split('-')[0]] ?? '';
  } else {
    severity = bySev![1] as Severity;
    after = bySev![2];
  }
  // an explicit severity next to the id: "(Low)", "(Low, test gap)", "Low (new …)", "(High) —"
  const word = new RegExp(String.raw`^[\s(]*(${SEV})\b`).exec(after);
  if (word) severity = word[1] as Severity;
  const text = `${after} ${rest}`;
  if (/^[\s:.(]*(?:\([^)]*\)\s*[:.]?\s*)?(resolved|unchanged|fixed|still holds?)\b/i.test(text.replace(/^[\s/]*[A-Z]-\d+\s*:?/, ''))) return null;
  // the title: the bold's text after the id and its severity mark, else the rest of the line
  const own = after.replace(new RegExp(String.raw`^[\s(]*(?:${SEV})(?:[^)]*\))?\s*`), '').replace(/^\(([^)]*)\)\s*/, '$1 ').replace(/^[\s:.—-]+/, '').replace(/[\s:.]+$/, '');
  // a title that opens with its location (`file:line` and `:n`: …) starts after it
  const tail = rest.replace(/^[\s:.—-]+/, '');
  const loc = /^((?:`[^`]*`|and|,|\s)+)[:.]\s+(.+)$/.exec(tail);
  const title = flat(own || (loc ? loc[2] : tail));
  return { indent: lead.length, item, id, severity, title: title === '' ? '' : title, lines: own ? [rest.trim()].filter(Boolean) : [] };
}
