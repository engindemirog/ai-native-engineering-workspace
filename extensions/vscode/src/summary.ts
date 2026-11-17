// The sections the approval panel summarizes, read by the templates' `## ` headings
// (specs/TEMPLATE.md, specs/plans/TEMPLATE.md). Like scripts/status, records are read outside
// HTML comments, and a heading inside a fenced block is not a heading.

export const SPEC_SECTIONS = ['Intent', 'Acceptance criteria'];
export const PLAN_SECTIONS = ['Files to change or add', 'Criterion ↔ test map', 'Risks & open questions'];

export interface Section {
  title: string;
  body: string;
}

// The named sections in the file's order, each with its text; a section that holds nothing but
// comments is left out. An empty list means: show "open the file" only.
export function sections(text: string, names: string[]): Section[] {
  const bodies = new Map<string, string[]>();
  let current: string | null = null;
  let fence: string | null = null;
  let comment = false;
  for (const raw of text.replace(/\r\n?/g, '\n').split('\n')) {
    let line = raw;
    if (fence === null) {
      line = stripComments(line, comment);
      comment = opensComment(raw, comment);
      const f = /^\s*(`{3,}|~{3,})/.exec(line);
      if (f) fence = f[1];
      else {
        const h = /^## (.+?)\s*$/.exec(line);
        if (h) {
          current = names.includes(h[1]) ? h[1] : null;
          if (current !== null && !bodies.has(current)) bodies.set(current, []);
          continue;
        }
        if (/^# /.test(line)) { current = null; continue; }
        if (line.trim() === '' && raw.trim() !== '') continue; // a line that was only a comment
      }
    } else if (new RegExp(`^\\s*${fence[0]}{${fence.length},}\\s*$`).test(line)) {
      fence = null;
    }
    if (current !== null) bodies.get(current)!.push(line);
  }
  const out: Section[] = [];
  for (const [title, lines] of bodies) {
    const body = lines.join('\n').trim();
    if (body !== '') out.push({ title, body });
  }
  return out;
}

// The line's text outside comments, given whether a comment was open when the line began.
function stripComments(line: string, open: boolean): string {
  let s = line;
  if (open) {
    const end = s.indexOf('-->');
    if (end < 0) return '';
    s = s.slice(end + 3);
  }
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  const start = s.indexOf('<!--');
  return start < 0 ? s : s.slice(0, start);
}

// Whether a comment is still open at the end of the line.
function opensComment(line: string, open: boolean): boolean {
  let s = line;
  let o = open;
  for (;;) {
    if (o) {
      const end = s.indexOf('-->');
      if (end < 0) return true;
      s = s.slice(end + 3);
      o = false;
    } else {
      const start = s.indexOf('<!--');
      if (start < 0) return false;
      s = s.slice(start + 4);
      o = true;
    }
  }
}
