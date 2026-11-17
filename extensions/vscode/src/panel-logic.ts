// Which buttons the approval panel offers, and why not when it doesn't. Pure: the panel and its
// tests share it.
import type { Row, Write } from './status.ts';
import { writeFor } from './status.ts';
import type { Answer } from './gate.ts';

export interface PanelState {
  row: Row;
  opened: boolean; // the full file was opened in an editor from this panel
  shell: boolean; // a POSIX shell was found
  running: string | null; // the spec a gate call is under way for
}

export interface Offer {
  write: Write;
  open: boolean; // "Open the file" is offered (not while gate runs)
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
    return { write, open: true, approve: false, requestChanges: false, hint };
  }
  if (!s.shell) return { write, open: true, approve: false, requestChanges: true, hint: 'No POSIX shell found: set anew.shell (Git for Windows: bash.exe). Nothing can be written.' };
  if (s.running !== null) {
    const hint = s.running === s.row.spec ? `Running ./scripts/gate ${write} ${s.row.spec}…` : `gate is running for ${s.running}; wait for its answer.`;
    return { write, open: false, approve: false, requestChanges: false, hint };
  }
  if (!s.opened) return { write, open: true, approve: false, requestChanges: true, hint: 'The file opens in the editor. The approve button appears here once it is open: the approval is given on the file, not on this summary.' };
  return { write, open: true, approve: true, requestChanges: true, hint: 'The file is open beside this panel. Approve it, or request changes.' };
}

// The file a row's screen reads: the plan once the row is past PLAN (its build, review and VERIFY
// follow the plan) or when the plan is the decision; the spec otherwise.
const PAST_PLAN = ['BUILD', 'REVIEW', 'FIX ROUND', 'VERIFY'];

export function fileFor(row: Row, specFile: string | null, exists: (rel: string) => boolean): string | null {
  const plan = `specs/plans/${row.spec}-plan.md`;
  if (writeFor(row) === 'approve-plan' || (PAST_PLAN.includes(row.stage) && exists(plan))) return plan;
  return specFile;
}

// The decision the panel is on: one spec, one write, one file. Opening the file belongs to it, so
// the plan approval that follows a spec approval starts closed even while the panel stays open.
export function decision(row: Row, file: string | null): string {
  return `${row.spec} ${writeFor(row) ?? row.stage} ${file ?? ''}`;
}

// gate's answer, with the decision it was given on and the step it leads to.
export interface Done extends Answer {
  decision: string;
  spec: string;
  next: string; // the command to run in the agent, e.g. /plan 0004; '' after a refusal
  after: string; // the stage a written answer leads to: PLAN for approve-spec, BUILD for approve-plan
}

export function done(a: Answer, row: Row, file: string | null, write: NonNullable<Write>): Done {
  const next = !a.written ? '' : `${write === 'approve-spec' ? '/plan' : '/build'} ${row.spec}`;
  return { ...a, decision: decision(row, file), spec: row.spec, next, after: write === 'approve-spec' ? 'PLAN' : 'BUILD' };
}

// The answer stays on its own decision, and on the stage a write leads to while the agent works
// there; on any other row or stage it goes.
export function shown(d: Done | null, row: Row, file: string | null): Done | null {
  if (d === null) return null;
  if (d.decision === decision(row, file)) return d;
  return d.written && d.spec === row.spec && row.stage === d.after && writeFor(row) === null ? d : null;
}

// The stage strip: where the row is on the way from spec to ship.
export interface Step {
  name: string;
  state: 'done' | 'now' | 'todo';
}

const STEPS = ['Spec', 'Plan', 'Build', 'Review', 'Verify', 'Ship'];
const AT: Record<string, number> = { ANALYZE: 0, PLAN: 1, BUILD: 2, REVIEW: 3, 'FIX ROUND': 3, VERIFY: 4, SHIP: 5 };

export function steps(row: Row): Step[] {
  const at = row.stage === 'shipped' ? STEPS.length : AT[row.stage] ?? -1;
  return STEPS.map((name, i) => ({ name, state: at < 0 ? 'todo' : i < at ? 'done' : i === at ? 'now' : 'todo' }));
}
