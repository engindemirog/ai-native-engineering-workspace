// Which buttons the approval panel offers, and why not when it doesn't. Pure: the panel and its
// tests share it.
import type { Row, Write } from './status.ts';
import { writeFor } from './status.ts';
import type { Answer } from './gate.ts';

export interface PanelState {
  row: Row;
  opened: boolean; // the full file was opened in an editor from this panel
  shell: boolean; // a POSIX shell was found
  running: boolean; // a gate call is under way
}

export interface Offer {
  write: Write;
  approve: boolean;
  requestChanges: boolean;
  hint: string;
}

export function offer(s: PanelState): Offer {
  const write = writeFor(s.row);
  if (write === null) {
    const hint = s.row.who === 'human'
      ? `${s.row.stage}: this decision's screen comes with spec 0010 — open the file, or use scripts/gate in a terminal.`
      : s.row.stage === 'shipped' ? 'Shipped.' : `${s.row.stage}: waiting for ${s.row.who || 'a decision status cannot read'}.`;
    return { write, approve: false, requestChanges: false, hint };
  }
  if (!s.shell) return { write, approve: false, requestChanges: true, hint: 'No POSIX shell found: set anew.shell (Git for Windows: bash.exe). Nothing can be written.' };
  if (s.running) return { write, approve: false, requestChanges: false, hint: 'running gate…' };
  if (!s.opened) return { write, approve: false, requestChanges: true, hint: 'Open the full file first: the approval is given on the file, not on this summary.' };
  return { write, approve: true, requestChanges: true, hint: `Approve runs ./scripts/gate ${write} ${s.row.spec}.` };
}

// The decision the panel is on: one spec, one write, one file. Opening the file belongs to it, so
// the plan approval that follows a spec approval starts closed even while the panel stays open.
export function decision(row: Row, file: string | null): string {
  return `${row.spec} ${writeFor(row) ?? row.stage} ${file ?? ''}`;
}

// gate's answer, with the decision it was given on and the step it leads to.
export interface Done extends Answer {
  decision: string;
  next: string;
}

export function done(a: Answer, decision: string, write: NonNullable<Write>): Done {
  const next = !a.written ? '' : write === 'approve-spec' ? '/plan in your agent' : '/build in your agent';
  return { ...a, decision, next };
}

// The answer stays on screen while the agent works on the row, and goes once a new decision is up.
export function shown(d: Done | null, decision: string, write: Write): Done | null {
  return d !== null && (d.decision === decision || write === null) ? d : null;
}
