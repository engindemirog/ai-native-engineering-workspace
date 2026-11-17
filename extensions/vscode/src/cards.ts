// The summary's sections read as cards, the way the mockup shows them: the files a plan touches,
// its criterion ↔ test pairs, each risk with its recommendation, and a spec's intent and criteria.
// Pure: what a file does not say is left out, never guessed; the full file is one click away.

export interface Risk {
  title: string;
  advice: string;
}

export interface Pair {
  criterion: string;
  proof: string; // '' when the map has no test for it yet
}

export interface Criterion {
  id: string;
  text: string;
  done: boolean;
}

// Markdown's inline marks dropped: the card shows text, not source.
export function plain(s: string): string {
  return s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]*)`/g, '$1').replace(/\s+/g, ' ').trim();
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

// The top-level list items ("- " or "1. " at the start of a line), each with its continuation lines.
export function items(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split('\n')) {
    const m = /^(?:[-*]|\d+[.)])\s+(.*)$/.exec(line);
    if (m) out.push(m[1]);
    else if (out.length > 0 && line.trim() !== '') out[out.length - 1] += `\n${line.trim()}`;
  }
  return out;
}

// A plan's files: each item's path and its "(new)", without the description after ": " or " — ".
export function files(body: string): string[] {
  return items(body).map((i) => {
    const first = i.split('\n')[0];
    const cut = first.search(/:\s|\s—\s/);
    return clip(plain(cut < 0 ? first : first.slice(0, cut)), 90);
  });
}

// The criterion ↔ test table's rows, header and separator left out.
export function pairs(body: string): Pair[] {
  const out: Pair[] = [];
  for (const line of body.split('\n')) {
    if (!/^\s*\|/.test(line) || /^\s*\|[\s|:-]*\|\s*$/.test(line)) continue;
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => plain(c));
    if (cells[0] === '' || /^acceptance criterion$/i.test(cells[0])) continue;
    out.push({ criterion: cells[0], proof: cells[1] ?? '' });
  }
  return out;
}

// Each risk: its bold lead or first sentence as the title, its recommendation (or the rest) below.
export function risks(body: string): Risk[] {
  return items(body).map((raw) => {
    const i = raw.replace(/\s*\n\s*/g, ' ');
    const bold = /^\*\*(.+?)\*\*\s*(.*)$/.exec(i);
    const [title, rest] = bold ? [bold[1], bold[2]] : splitSentence(i);
    const rec = /\b(Recommendation|Öneri)\s*:/i.exec(rest);
    return { title: clip(plain(title).replace(/[.:]$/, ''), 120), advice: clip(plain(rec ? rest.slice(rec.index) : rest), 260) };
  });
}

function splitSentence(s: string): [string, string] {
  const m = /^(.+?[.!?])\s+(.*)$/.exec(s);
  return m ? [m[1], m[2]] : [s, ''];
}

// A spec's criteria: "- [ ] AC-n — text"; a line in another shape is not a criterion.
export function criteria(body: string): Criterion[] {
  const out: Criterion[] = [];
  for (const line of body.split('\n')) {
    const m = /^- \[( |x|X)\]\s+(?:~~)?(AC-\d+)\s*[—-]\s*(.*)$/.exec(line);
    if (m) out.push({ id: m[2], text: clip(plain(m[3].replace(/~~/g, '')), 200), done: m[1] !== ' ' });
  }
  return out;
}
