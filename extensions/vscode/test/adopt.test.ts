import { test } from 'node:test';
import assert from 'node:assert/strict';
import { repository, latestUrl, cloneUrl, latestTag, cloneArgs, adoptArgs, addConfirm, newConfirm, nameProblem, newSteps, summary, NO_ADOPT, DEFAULT_REPOSITORY } from '../src/adopt.ts';

test('the template repository: the setting as owner/name or its GitHub URL; empty is the official one', () => {
  assert.deepEqual(repository(''), { owner: 'engindemirog', name: 'ai-native-engineering-workspace' });
  assert.equal(DEFAULT_REPOSITORY, 'engindemirog/ai-native-engineering-workspace');
  assert.deepEqual(repository('acme/anew-fork'), { owner: 'acme', name: 'anew-fork' });
  assert.deepEqual(repository('https://github.com/acme/anew-fork.git'), { owner: 'acme', name: 'anew-fork' });
  assert.equal(repository('acme'), null);
  assert.equal(repository('https://evil.example/acme/x'), null);
  assert.equal(repository('acme/x; rm -rf /'), null);
  const r = repository('acme/anew-fork')!;
  assert.equal(latestUrl(r), 'https://api.github.com/repos/acme/anew-fork/releases/latest');
  assert.equal(cloneUrl(r), 'https://github.com/acme/anew-fork.git');
});

test('AC-3: the tag read from a releases/latest answer; anything else refused with what came', () => {
  assert.equal(latestTag(JSON.stringify({ tag_name: 'v1.30', name: 'v1.30 — x', assets: [] })), 'v1.30');
  assert.equal(latestTag(JSON.stringify({ tag_name: 'v1.29.1' })), 'v1.29.1');
  assert.throws(() => latestTag(JSON.stringify({ message: 'Not Found' })), /GitHub: Not Found/);
  assert.throws(() => latestTag('<html>'), /not JSON/);
  assert.throws(() => latestTag(JSON.stringify({ tag_name: '--upload-pack=x' })), /names no release tag/);
  assert.throws(() => latestTag('null'), /names no release tag/);
});

test('AC-3: the clone and adopt arguments — the tag only, one commit deep, the target as one argument', () => {
  assert.deepEqual(cloneArgs('https://github.com/a/b.git', 'v1.30', 'C:\\Temp\\anew x'), ['clone', '--quiet', '--depth', '1', '--branch', 'v1.30', '--', 'https://github.com/a/b.git', 'C:\\Temp\\anew x']);
  assert.deepEqual(adoptArgs('C:\\My Project'), ['C:\\My Project']);
  assert.equal(NO_ADOPT('v1.29.1'), 'the release v1.29.1 has no scripts/adopt (needs v1.30 or later)');
});

test('AC-3: the confirmations name the folder, the version, what is kept and what is committed', () => {
  const add = addConfirm('C:\\work\\shop', 'v1.30');
  assert.ok(add.startsWith('Add ANEW v1.30 to C:\\work\\shop?'));
  assert.ok(add.includes('Files that exist are kept; nothing is committed.'));
  const n = newConfirm('C:\\work\\new-shop', 'v1.30');
  assert.ok(n.startsWith('Create C:\\work\\new-shop with ANEW v1.30?'));
  assert.ok(n.includes('one commit "chore: ANEW v1.30"'));
});

test('a new project\'s name is one folder name', () => {
  assert.equal(nameProblem('shop'), '');
  assert.equal(nameProblem('my shop'), '');
  assert.notEqual(nameProblem(''), '');
  assert.notEqual(nameProblem(' shop'), '');
  for (const bad of ['a/b', 'a\\b', 'c:', 'a*b', '..', '.']) assert.notEqual(nameProblem(bad), '', bad);
});

test('G-5: the new project\'s git steps — the scripts executable in the index, one commit', () => {
  const steps = newSteps('v1.30', ['AGENTS.md', 'scripts/status', 'scripts/check.conf.example', 'scripts/adopt', 'docs/x.md']);
  assert.deepEqual(steps, [
    ['init', '--quiet'],
    ['add', '--all'],
    ['add', '--chmod=+x', '--', 'scripts/adopt', 'scripts/status'],
    ['commit', '--quiet', '-m', 'chore: ANEW v1.30'],
  ]);
});

test('adopt\'s summary line for the notification', () => {
  assert.equal(summary('kept   README.md (exists)\nAdopted ANEW v1.30 into /p: 150 written, 1 kept.\nNothing is committed.'), 'Adopted ANEW v1.30 into /p: 150 written, 1 kept.');
  assert.equal(summary(''), 'scripts/adopt gave no summary — see its output.');
});
