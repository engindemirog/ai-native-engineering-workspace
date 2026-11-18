// The agent's next step (spec 0012): the command that takes a row one step further while it waits
// for the agent, and whether Claude Code can be started with it. Read from the row's stage and who
// — never from status's text, which is written for a human (G-1).
import type { Row } from './status.ts';
import type { Tool } from './setup.ts';

// scripts/status's stage and who for each row that waits for the agent, and its segment.
export const SEGMENTS: { stage: string; who: string; segment: string }[] = [
  { stage: 'PLAN', who: 'Developer', segment: '/plan' },
  { stage: 'BUILD', who: 'Developer', segment: '/build' },
  { stage: 'FIX ROUND', who: 'Developer', segment: '/build' }, // /build runs the fix rounds (G-3)
  { stage: 'REVIEW', who: 'fresh session / read-only reviewer', segment: '/review' },
  { stage: 'VERIFY', who: 'QA', segment: '/verify' },
];

// The command for the row, `/build 0003`; null for the human's, shipped and unclear rows.
export function nextFor(row: Row): string | null {
  const s = SEGMENTS.find((x) => x.stage === row.stage && x.who === row.who);
  return s ? `${s.segment} ${row.spec}` : null;
}

// The agent the command is for, as the Start screen reads it (spec 0011).
export interface Agent {
  agent: Tool;
  claude: boolean; // `claude` was found
  have: Tool[]; // the adapters installed
}

// Continue in Claude Code: 0011's rule for Start — `claude` found, Claude Code picked, its adapter
// installed.
export function canContinue(a: Agent): boolean {
  return a.claude && a.agent === 'claude-code' && a.have.includes('claude-code');
}

// REVIEW and VERIFY run in a session of their own: the producer never verifies its own work.
export const fresh = (cmd: string) => /^\/(review|verify)( |$)/.test(cmd);
