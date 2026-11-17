// Reads `scripts/status --json` (docs/commands.md, scripts/status): the rows, grouped the way the
// work list shows them, and the one write a row offers. Nothing here knows VS Code.

export interface Row {
  spec: string;
  name: string;
  spec_status: string;
  plan_status: string;
  stage: string;
  who: string;
  next: string;
  warnings: string[];
  notes: string[];
}

export interface Status {
  rows: Row[];
  notes: string[];
}

export type Group = 'your turn' | 'in progress' | 'shipped';

// The approval a row's stage decides (the approval panel); triage and ship have their own screens.
export type Write = 'approve-spec' | 'approve-plan' | null;

const KEYS: (keyof Row)[] = ['spec', 'name', 'spec_status', 'plan_status', 'stage', 'who', 'next'];

export function parseStatus(text: string): Status {
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    throw new Error('scripts/status --json printed no JSON document');
  }
  const d = doc as { anew_status?: unknown; rows?: unknown; notes?: unknown };
  if (d === null || typeof d !== 'object' || d.anew_status !== 1 || !Array.isArray(d.rows)) {
    throw new Error('scripts/status --json: not an anew_status 1 document');
  }
  const rows = d.rows.map((r: unknown, i: number) => {
    const o = (r ?? {}) as Record<string, unknown>;
    for (const k of KEYS) {
      if (typeof o[k] !== 'string') throw new Error(`scripts/status --json: row ${i + 1} has no string "${k}"`);
    }
    return {
      spec: o.spec as string,
      name: o.name as string,
      spec_status: o.spec_status as string,
      plan_status: o.plan_status as string,
      stage: o.stage as string,
      who: o.who as string,
      next: o.next as string,
      warnings: strings(o.warnings),
      notes: strings(o.notes),
    };
  });
  return { rows, notes: strings(d.notes) };
}

function strings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

export function groupOf(row: Row): Group {
  if (row.stage === 'shipped') return 'shipped';
  if (row.who === 'human' || row.stage.startsWith('unclear')) return 'your turn';
  return 'in progress';
}

export function grouped(status: Status): Record<Group, Row[]> {
  const g: Record<Group, Row[]> = { 'your turn': [], 'in progress': [], shipped: [] };
  for (const r of status.rows) g[groupOf(r)].push(r);
  return g;
}

export function waiting(status: Status): number {
  return status.rows.filter((r) => groupOf(r) === 'your turn').length;
}

export function writeFor(row: Row): Write {
  if (row.who !== 'human') return null;
  if (row.stage === 'ANALYZE') return 'approve-spec';
  if (row.stage === 'PLAN') return 'approve-plan';
  return null;
}
