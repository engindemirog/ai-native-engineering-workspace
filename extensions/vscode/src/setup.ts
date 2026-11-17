// A project's setup (spec 0011): which AI tool adapters `scripts/init` has installed, whether
// bootstrap has run, and the command form each agent takes. Installed or not is read from the
// files `scripts/doctor`'s adapter check names, so the screen and doctor never disagree (G-6).
// The extension writes none of these files: `./scripts/init <tool>` does, never with --force (G-2).

export type Tool = 'claude-code' | 'github-copilot' | 'cursor' | 'codex';

export interface Adapter {
  id: Tool;
  label: string;
  marker: string; // the file or folder doctor checks (a trailing / is a folder)
  writes: string[]; // what `scripts/init <id>` writes, for the confirmation
  prefix: '/' | '$'; // how the agent runs an ANEW command (Codex: skills, `$bootstrap`)
}

export const ADAPTERS: Adapter[] = [
  { id: 'claude-code', label: 'Claude Code', marker: 'CLAUDE.md', writes: ['CLAUDE.md', '.claude/'], prefix: '/' },
  { id: 'github-copilot', label: 'GitHub Copilot', marker: '.github/copilot-instructions.md', writes: ['.github/copilot-instructions.md', '.github/prompts/', '.github/agents/', '.github/instructions/'], prefix: '/' },
  { id: 'cursor', label: 'Cursor', marker: '.cursor/rules/', writes: ['.cursor/rules/', '.cursor/commands/'], prefix: '/' },
  { id: 'codex', label: 'Codex', marker: '.agents/skills/analyze/SKILL.md', writes: ['.agents/skills/'], prefix: '$' },
];

export const adapter = (id: Tool): Adapter => ADAPTERS.find((a) => a.id === id) as Adapter;
export const isTool = (s: string): s is Tool => ADAPTERS.some((a) => a.id === s);

// `exists` takes a workspace-relative path; a trailing / asks for a folder.
export type Exists = (rel: string) => boolean;

export function installed(exists: Exists): Tool[] {
  return ADAPTERS.filter((a) => exists(a.marker)).map((a) => a.id);
}

// Install is offered when init has something to copy: the adapter's folder under adapters/.
export function installable(id: Tool, exists: Exists): boolean {
  return exists('scripts/init') && exists(`adapters/${id}/`);
}

// Bootstrap has run when AGENTS.md is configured and names a mode — the lines doctor warns about.
export function bootstrapped(agents: string): boolean {
  return !agents.includes('STATUS: NOT CONFIGURED') && /\*\*Mode:\s*(lite|strict)\*\*/i.test(agents);
}

// scripts/init's arguments: the tool alone, never --force.
export function initArgs(id: Tool): string[] {
  return [id];
}

// The agent the command is built for: the human's pick when it is still a known tool, else
// Claude Code when `claude` is found, else the first installed adapter, else Claude Code (G-3).
export function pick(stored: string | undefined, claude: boolean, have: Tool[]): Tool {
  if (stored && isTool(stored)) return stored;
  if (claude) return 'claude-code';
  return have[0] ?? 'claude-code';
}

// An ANEW command (`/new-feature …`) in the form the agent runs it.
export function forAgent(cmd: string, id: Tool): string {
  return adapter(id).prefix === '$' ? cmd.replace(/^\//, '$') : cmd;
}

// What the sidebar's setup card says is missing; empty when nothing is.
export function needs(have: Tool[], agents: string): string[] {
  const out: string[] = [];
  if (!have.length) out.push('No AI tool adapter is installed.');
  if (!bootstrapped(agents)) out.push('The project is not set up yet (bootstrap has not run).');
  return out;
}
