// ANEW into a project (spec 0013): the latest release of the template repository, cloned into a
// temporary folder, whose own `scripts/adopt` copies the core — into the folder open in VS Code
// (Add), or into a new folder that then gets its repository and first commit (New). Pure: the
// VS Code layer and the tests share it; nothing here touches the network or the disk.

export const DEFAULT_REPOSITORY = 'engindemirog/ai-native-engineering-workspace';

export interface Repository {
  owner: string;
  name: string;
}

// The setting `anew.templateRepository`: `owner/name` or its GitHub URL; '' is the official one.
export function repository(setting: string): Repository | null {
  const s = setting.trim() || DEFAULT_REPOSITORY;
  const m = /^(?:https:\/\/github\.com\/)?([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?$/.exec(s);
  return m ? { owner: m[1], name: m[2] } : null;
}

export const latestUrl = (r: Repository) => `https://api.github.com/repos/${r.owner}/${r.name}/releases/latest`;
export const cloneUrl = (r: Repository) => `https://github.com/${r.owner}/${r.name}.git`;

// The tag of GitHub's `releases/latest` answer; an Error naming what came instead.
export function latestTag(body: string): string {
  let doc: unknown;
  try { doc = JSON.parse(body); } catch { throw new Error('the releases/latest answer is not JSON'); }
  const tag = (doc as { tag_name?: unknown } | null)?.tag_name;
  if (typeof tag !== 'string' || !/^v\d+(\.\d+)*$/.test(tag)) {
    const msg = (doc as { message?: unknown } | null)?.message;
    throw new Error(typeof msg === 'string' ? `GitHub: ${msg}` : 'the releases/latest answer names no release tag');
  }
  return tag;
}

// git's arguments for the release: one commit deep, the tag only.
export function cloneArgs(url: string, tag: string, dir: string): string[] {
  return ['clone', '--quiet', '--depth', '1', '--branch', tag, '--', url, dir];
}

// The release's own `scripts/adopt`, with the target as one argument.
export const adoptArgs = (target: string): string[] => [target];

// v1.30 is the first release with scripts/adopt (plan 0013, Risk 4).
export const NO_ADOPT = (tag: string) => `the release ${tag} has no scripts/adopt (needs v1.30 or later)`;

export function addConfirm(folder: string, tag: string): string {
  return `Add ANEW ${tag} to ${folder}?\n\nThe ANEW core (AGENTS.md, docs/, workflows/, prompts/, scripts/, adapters/, specs/, .github/workflows/check.yml, …) is copied by the release's scripts/adopt. Files that exist are kept; nothing is committed.`;
}

export function newConfirm(folder: string, tag: string): string {
  return `Create ${folder} with ANEW ${tag}?\n\nA new git repository, the ANEW core copied by the release's scripts/adopt, and one commit "chore: ANEW ${tag}". The folder then opens here.`;
}

// A new project's folder name: one path segment a file system takes; '' when it is fine.
export function nameProblem(name: string): string {
  if (name.trim() === '') return 'Give the project a name.';
  if (name !== name.trim()) return 'No spaces at the start or the end.';
  if (/[\\/:*?"<>|]/.test(name) || name === '.' || name === '..') return 'A folder name: no / \\ : * ? " < > |.';
  return '';
}

// The new project's repository: init, everything adopt wrote, the scripts executable in the index
// (git on Windows records no executable bit — spec 0013, G-5), one commit.
export function newSteps(tag: string, files: string[]): string[][] {
  const execs = files.filter((f) => /^scripts\/[^/.]+$/.test(f)).sort();
  return [
    ['init', '--quiet'],
    ['add', '--all'],
    ...(execs.length ? [['add', '--chmod=+x', '--', ...execs]] : []),
    ['commit', '--quiet', '-m', `chore: ANEW ${tag}`],
  ];
}

// adopt's closing line, for the notification; the full output goes to the output channel.
export function summary(stdout: string): string {
  return stdout.split(/\r?\n/).find((l) => l.startsWith('Adopted ANEW ')) ?? 'scripts/adopt gave no summary — see its output.';
}
