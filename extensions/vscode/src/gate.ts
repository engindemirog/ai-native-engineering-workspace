// The scripts/gate call for a write, and what to show of its answer (docs/commands.md,
// scripts/gate). The extension writes nothing itself: gate is the only writer.
import type { Write } from './status.ts';

export function gateArgs(write: NonNullable<Write>, spec: string): string[] {
  if (!/^[0-9]{4}$/.test(spec)) throw new Error(`not a spec number: ${spec}`);
  return [write, spec];
}

export interface Answer {
  written: boolean;
  code: number;
  text: string;
}

// gate prints its result line on stdout (exit 0) and its refusal on stderr (exit 1 or 2);
// both are shown as gate wrote them.
export function answer(code: number, stdout: string, stderr: string): Answer {
  const out = stdout.replace(/\s+$/, '');
  const err = stderr.replace(/\s+$/, '');
  return { written: code === 0, code, text: code === 0 ? out : err || out || `gate exited ${code}` };
}
