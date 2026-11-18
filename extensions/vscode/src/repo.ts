// What bootstrap (spec 0014) and upgrade (spec 0015) read from git the same way: the branches, the
// working tree's state a check's answer is kept with, and the merge step of a chore branch. Pure:
// the VS Code layer passes `git`.
import { prStep, defaultBranch as defaultOf } from './ship.ts';

export type Git = (args: string[], env?: Record<string, string>) => Promise<string | null>;

// The prefix of a state whose contents could not be read: never verified.
export const UNREAD = 'unread:';

export const has = async (git: Git, ref: string) => (await git(['rev-parse', '--verify', '--quiet', ref])) !== null;

// The branch checked out, the remote (origin first), the default branch (the remote's, else a local
// main or master) and the ref to read it from (the remote's copy when there is one).
export async function branches(git: Git): Promise<{ current: string; remote: string; defaultBranch: string; ref: string }> {
  const current = (await git(['rev-parse', '--abbrev-ref', 'HEAD']))?.trim() ?? '';
  const remotes = ((await git(['remote'])) ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  const remote = remotes.includes('origin') ? 'origin' : remotes[0] ?? '';
  let defaultBranch = remote ? defaultOf(((await git(['symbolic-ref', '--short', `refs/remotes/${remote}/HEAD`])) ?? '').trim(), remote) : '';
  for (const b of ['main', 'master']) if (!defaultBranch && (await has(git, `refs/heads/${b}`))) defaultBranch = b;
  const ref = defaultBranch && remote && (await has(git, `refs/remotes/${remote}/${defaultBranch}`)) ? `${remote}/${defaultBranch}` : defaultBranch;
  return { current, remote, defaultBranch, ref };
}

// HEAD and the working tree's contents, not the names: a temporary index of the whole working tree
// (0014 review round 1, M-1), seeded from the real one so only changed files are hashed (round 2,
// N-5); no line-ending warnings, which could fill the output (N-1). A tree not read is a state no
// check's answer can match.
export async function treeState(git: Git, index: string, seed: (gitIndex: string, to: string) => void): Promise<string> {
  const real = ((await git(['rev-parse', '--git-path', 'index'])) ?? '').trim();
  if (real) { try { seed(real, index); } catch { /* an empty index: every file is hashed */ } }
  const env = { GIT_INDEX_FILE: index };
  const tree = (await git(['-c', 'core.safecrlf=false', 'add', '--all'], env)) !== null ? ((await git(['write-tree'], env)) ?? '').trim() : '';
  return tree ? `${((await git(['rev-parse', 'HEAD'])) ?? '').trim()} ${tree}` : `${UNREAD}${Date.now()}-${Math.random()}`;
}

// The merge step of a chore branch: Push and open PR (Ship's rule), or the commands to copy; with
// no remote, the local merge to copy. Never run here (0014 G-5, 0015 G-6).
export function mergeStep(branch: string, f: { remote: string; defaultBranch: string; current: string; gh: boolean }): { offered: boolean; why: string; commands: string[] } {
  if (!f.remote) {
    const into = f.defaultBranch || 'main';
    return { offered: false, why: 'no remote: merge it here when you have approved it', commands: [`git switch ${into}`, `git merge --no-ff ${branch}`] };
  }
  if (f.current !== branch) {
    return { offered: false, why: `${branch} is not checked out (you are on ${f.current || 'no branch'}): git switch ${branch}`, commands: [`git switch ${branch}`, `git push -u ${f.remote} ${branch}`, 'gh pr create --fill'] };
  }
  return prStep({ branch: f.current, defaultBranch: f.defaultBranch, remote: f.remote, gh: f.gh });
}
