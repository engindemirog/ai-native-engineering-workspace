import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { offer, tagsFrom, cmpTag, headings, readScript, readChecks, green, phase, mergeStep, section, command, confirm, branchFor, key, type Facts, type View } from '../src/upgrade.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const read = (f: string) => fs.readFileSync(path.join(repo, f), 'utf8');

test('AC-3: prompts/upgrade.md, workflows/upgrade.md and every adapter\'s /upgrade agree', () => {
  const prompt = read('prompts/upgrade.md');
  for (const k of ['.git/anew-upgrade/', 'chore/anew-', '"merge"', 'oldest first', 'never a\n   plain copy', 'ANEW-*', '.anew-version', './scripts/selftest', 'Never push or\nmerge']) assert.ok(prompt.includes(k), k);
  const flow = read('workflows/upgrade.md');
  for (const k of ['prompts/upgrade.md', 'scripts/upgrade', '/upgrade <new tag>', '[GATE: human]', 'never the merge']) assert.ok(flow.includes(k), k);
  for (const f of ['adapters/claude-code/.claude/commands/upgrade.md', 'adapters/github-copilot/prompts/upgrade.prompt.md', 'adapters/cursor/commands/upgrade.md', 'adapters/codex/skills/upgrade/SKILL.md']) {
    const t = read(f);
    assert.ok(t.includes('execute workflows/upgrade.md using the prompt in prompts/upgrade.md'), f);
    assert.ok(t.includes('never push or merge'), f);
  }
  assert.ok(read('adapters/claude-code/.claude/commands/upgrade.md').includes('$ARGUMENTS'));
  assert.ok(read('adapters/codex/skills/upgrade/agents/openai.yaml').includes('allow_implicit_invocation: false'));
});

test('AC-2: the release offered from the base, the LTS line, the base never guessed', () => {
  const tags = tagsFrom('a1\trefs/tags/v1.31\na2\trefs/tags/v1.31^{}\na3\trefs/tags/v1.24.1\na4\trefs/tags/v1.32\na5\trefs/tags/v1.24.2\na6\trefs/tags/v1.30\na7\trefs/tags/v1.9\nx\trefs/tags/nightly\n');
  assert.deepEqual(tags, ['v1.32', 'v1.31', 'v1.30', 'v1.24.2', 'v1.24.1', 'v1.9']);
  assert.ok(cmpTag('v1.10', 'v1.9') > 0 && cmpTag('v1.24.1', 'v1.24') > 0 && cmpTag('v1.31', 'v1.31') === 0);
  assert.deepEqual(offer({ version: 'v1.31', latest: 'v1.32', tags }), { choices: ['v1.32'], why: '' });
  assert.deepEqual(offer({ version: 'v1.32\r\n', latest: 'v1.32', tags }), { choices: [], why: '' }); // up to date
  // G-3: on the LTS line, its newest first, the latest as the other choice
  assert.deepEqual(offer({ version: 'v1.24.1', latest: 'v1.32', tags }).choices, ['v1.24.2', 'v1.32']);
  assert.deepEqual(offer({ version: 'v1.24.2', latest: 'v1.32', tags }).choices, ['v1.32']);
  // G-2: missing, not a tag, no such release → why, no choice
  for (const version of ['', 'main', 'v1.29']) {
    const o = offer({ version, latest: 'v1.32', tags });
    assert.deepEqual(o.choices, []);
    assert.ok(o.why.includes('.anew-version'), version);
  }
  assert.deepEqual(offer({ version: 'v1.29', latest: 'v1.32', tags: [] }).choices, ['v1.32']); // tags unknown: the clone refuses later
  // A-2: the headings between, oldest first
  const log = '# Changelog\n\n## How to upgrade\n\n## v1.32 — Upgrade on the screen\n\n## v1.31 — Bootstrap on the screen\n\n## v1.30 — Adopt\n\n### Upgrading\n';
  assert.deepEqual(headings(log, 'v1.30', 'v1.32'), ['v1.31 — Bootstrap on the screen', 'v1.32 — Upgrade on the screen']);
  assert.deepEqual(headings(log, 'v1.31', 'v1.31'), []);
});

test("the script's answer and the checks read as they are", () => {
  const s = readScript(0, "replaced scripts/doctor\nadded    workflows/x.md\nkept     docs/a.md (the project's change; v1.32 left it as v1.31 had it)\nmerge    docs/domain.md (changed by the project and by v1.32)\nmerge    AGENTS.md (changed by the project and by v1.32)\nUpgrade v1.31 → v1.32 in /p: 1 replaced, 1 added, 0 removed, 1 kept, 2 to merge.\n");
  assert.deepEqual([s.replaced, s.added, s.removed, s.kept], [1, 1, 0, 1]);
  assert.deepEqual(s.merge, ['docs/domain.md', 'AGENTS.md']);
  assert.match(s.summary, /^Upgrade v1.31 → v1.32/);
  const c = readChecks({ code: 0, out: '== result: 0 fail, 2 warn ==\n' }, { code: 0, out: 'ok    x\n== selftest: 558 passed, 0 failed ==\n' }, 's');
  assert.ok(green(c));
  assert.ok(!green(readChecks({ code: 0, out: '== result: 0 fail, 2 warn ==\n' }, { code: 1, out: 'FAIL  y\n== selftest: 557 passed, 1 failed ==\n' }, 's')));
  assert.ok(!green(readChecks({ code: 0, out: '== result: 0 fail, 2 warn ==\n' }, { code: 0, out: 'killed\n' }, 's')), 'no result line is not green');
  assert.equal(command('v1.32', 'codex'), '$upgrade v1.32');
  const k = confirm({ base: 'v1.31', to: 'v1.32', current: 'main', from: '' });
  assert.ok(k.message.includes('v1.31 → v1.32') && k.detail.includes('.git/anew-upgrade/') && k.detail.includes('chore/anew-v1.32') && k.detail.includes('Nothing is committed'));
});

const facts = (over: Partial<Facts> = {}): Facts => ({ version: 'v1.31', to: 'v1.32', branch: null, base: 'v1.31', defaultBranch: 'main', current: 'main', remote: 'origin', gh: true, fetched: false, state: 'h t', ...over });
const ok = readChecks({ code: 0, out: '== result: 0 fail, 0 warn ==' }, { code: 0, out: '== selftest: 1 passed, 0 failed ==' }, 'h t');

test('AC-4: the phases — available, in the agent, upgraded, verified, merged (a squash merge too)', () => {
  assert.equal(phase(facts({ to: '' }), null), 'available');
  assert.equal(phase(facts(), null), 'available');
  assert.equal(phase(facts({ fetched: true, branch: 'v1.31', current: 'chore/anew-v1.32' }), null), 'in the agent');
  const up = facts({ fetched: true, branch: 'v1.32', current: 'chore/anew-v1.32', version: 'v1.32' });
  assert.equal(phase(up, null), 'upgraded');
  assert.equal(phase(up, ok), 'verified');
  assert.equal(phase({ ...up, state: 'h t2' }, ok), 'upgraded', 'a change after the checks: their answer no longer counts');
  assert.equal(phase({ ...up, state: 'unread:1' }, { ...ok, state: 'unread:1' }), 'upgraded', 'an unread tree never verifies');
  assert.equal(phase({ ...up, base: 'v1.32' }, null), 'merged', 'the default branch says the new tag: merged, squash or not');
  assert.equal(phase(facts({ base: null, version: 'v1.32', branch: 'v1.32', current: 'main' }), null), 'merged', 'no default branch: the working tree, off the chore branch');
  assert.equal(phase(facts({ base: null, version: 'v1.32', branch: 'v1.32', current: 'chore/anew-v1.32' }), null), 'upgraded');
  assert.notEqual(key(up, null), key(up, ok));
});

test('AC-5: the merge step only for chore/anew-<tag>; never a merge; the section as it is', () => {
  assert.equal(branchFor('v1.32'), 'chore/anew-v1.32');
  const up = facts({ fetched: true, branch: 'v1.32', current: 'chore/anew-v1.32', version: 'v1.32' });
  assert.equal(mergeStep(up).offered, true);
  assert.deepEqual(mergeStep({ ...up, current: 'main' }).commands, ['git switch chore/anew-v1.32', 'git push -u origin chore/anew-v1.32', 'gh pr create --fill']);
  assert.deepEqual(mergeStep({ ...up, remote: '' }).commands, ['git switch main', 'git merge --no-ff chore/anew-v1.32']);
  const view = (f: Facts, over: Partial<View> = {}): View => ({ facts: f, offer: { choices: ['v1.32'], why: '' }, pick: '', compare: (a, b) => `https://github.com/o/r/compare/${a}...${b}`, changelog: [], script: null, agent: { agent: 'claude-code', claude: true, have: ['claude-code'] }, checks: null, busy: '', prOutput: null, shell: true, ...over });
  const all = [facts(), facts({ fetched: true, branch: 'v1.31', current: 'chore/anew-v1.32' }), up, { ...up, base: 'v1.32', version: 'v1.31' }].map((f) => section(view(f))).join('\n');
  assert.ok(!all.includes('gh pr merge') && !/<button[^>]*>[^<]*[Mm]erge/.test(all), 'no merge is ever offered as a button or run');
  const avail = section(view(facts()));
  assert.ok(avail.includes('id="up-fetch"') && avail.includes('ANEW v1.31 → v1.32') && avail.includes('compare/v1.31...v1.32'));
  assert.ok(!avail.includes('up-copy'), 'no /upgrade before the releases are fetched');
  const agent = section(view(facts({ fetched: true, branch: 'v1.31', current: 'chore/anew-v1.32' }), { script: readScript(0, 'merge    docs/<x>.md (changed by the project and by v1.32)\nUpgrade v1.31 → v1.32 in /p: 0 replaced, 0 added, 0 removed, 0 kept, 1 to merge.\n'), changelog: ['v1.32 — <b>'] }));
  assert.ok(agent.includes('/upgrade v1.32') && agent.includes('id="up-continue"') && agent.includes('docs/&lt;x&gt;.md') && agent.includes('v1.32 — &lt;b&gt;'));
  assert.ok(section(view(up)).includes('id="up-checks"') && section(view(up)).includes('id="up-pr"'));
  assert.ok(section(view({ ...up, current: 'main' })).includes('git switch chore/anew-v1.32 first'));
  // merged and pulled: gone; merged, not pulled: the pull in two steps (0014 round 3, L-D)
  assert.equal(section(view({ ...up, base: 'v1.32', current: 'main' })), '');
  assert.ok(section(view({ ...up, base: 'v1.32', version: 'v1.31', current: 'feat/x' })).includes('git switch main, then git pull'));
  // the LTS pick, the recommended one first; nothing to offer: no section; a base not read: why
  const lts = section(view(facts({ version: 'v1.24.1', to: '' }), { offer: { choices: ['v1.24.2', 'v1.32'], why: '' } }));
  assert.ok(lts.includes('id="up-pick-v1.24.2"') && lts.includes('aria-pressed="true"') && lts.includes('recommended'));
  assert.equal(section(view(facts({ to: '', version: 'v1.32' }), { offer: { choices: [], why: '' } })), '');
  assert.ok(section(view(facts({ to: '' }), { offer: { choices: [], why: '.anew-version is missing' } })).includes('role="note"'));
});
