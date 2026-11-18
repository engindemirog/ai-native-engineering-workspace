import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { answers, command, suggested, phase, readDoctor, green, mergeStep, written, section, key, lang, offered, NO_ANSWERS, type Facts, type BootView } from '../src/bootstrap.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const template = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
const configured = '# AGENTS.md — Project Rules\n\n**Mode: lite** — every workflow honors its gates.\n**Language: chat=tr · docs=tr** — protocol fields stay English.\n';
const facts = (over: Partial<Facts> = {}): Facts => ({
  here: template, branch: null, base: template, defaultBranch: 'main', current: 'main', remote: 'origin', gh: true, started: false, checkConf: false, state: 'abc\n', ...over,
});
const ok = readDoctor(0, 'ok    core structure complete\nWARN  scripts/check.conf: no steps\n== result: 0 fail, 1 warn ==\n', 'abc\n');

test('AC-2: the command carries exactly the answers given, in the agent\'s form', () => {
  assert.equal(command(NO_ANSWERS, 'claude-code'), '/bootstrap');
  assert.equal(command({ chat: 'tr', docs: 'en', mode: 'lite', trivial: '1' }, 'claude-code'), '/bootstrap chat=tr docs=en mode=lite trivial=1');
  assert.equal(command({ ...NO_ANSWERS, mode: 'strict' }, 'codex'), '$bootstrap mode=strict');
  assert.equal(command({ ...NO_ANSWERS, docs: 'pt-BR' }, 'cursor'), '/bootstrap docs=pt-BR');
  // anything that is not an answer is not given
  assert.deepEqual(answers({ chat: 'tr; rm -rf /', docs: ' en ', mode: 'medium', trivial: '4' }), { chat: '', docs: 'en', mode: '', trivial: '' });
  assert.deepEqual(answers(undefined), NO_ANSWERS);
  assert.equal(suggested('tr'), 'tr');
  assert.equal(suggested('en-us'), 'en');
  assert.equal(suggested('zh-cn'), 'zh');
});

test('AC-1: the phase from the files and git — not started, in the agent, generated, verified, merged', () => {
  assert.equal(phase(facts(), null), 'not started');
  assert.equal(phase(facts({ started: true }), null), 'in the agent');
  assert.equal(phase(facts({ branch: template, current: 'chore/bootstrap' }), null), 'in the agent');
  const gen = facts({ branch: configured, here: configured, current: 'chore/bootstrap' });
  assert.equal(phase(gen, null), 'generated');
  assert.equal(phase(gen, ok), 'verified');
  assert.equal(phase({ ...gen, state: 'abc\n M docs/x.md\n' }, ok), 'generated'); // doctor ran on other files
  assert.equal(phase(gen, readDoctor(1, 'FAIL  x\n== result: 1 fail, 0 warn ==', 'abc\n')), 'generated');
  // on the default branch while chore/bootstrap holds the output: generated, never verified
  assert.equal(phase(facts({ branch: configured }), ok), 'generated');
  // merged: the default branch's AGENTS.md is configured — a squash merge included
  assert.equal(phase(facts({ branch: configured, base: configured, here: configured }), null), 'merged');
  // no default branch known: no chore/bootstrap and a configured working tree
  assert.equal(phase(facts({ base: null, defaultBranch: '', here: configured }), null), 'merged');
  assert.equal(phase(facts({ base: null, defaultBranch: '', here: configured, branch: configured, current: 'chore/bootstrap' }), null), 'generated');
});

test('AC-4: doctor\'s output read into its result line, its FAIL and WARN lines', () => {
  assert.equal(ok.result, '== result: 0 fail, 1 warn ==');
  assert.deepEqual(ok.fails, []);
  assert.deepEqual(ok.warns, ['WARN  scripts/check.conf: no steps']);
  assert.equal(green(ok), true);
  const bad = readDoctor(1, 'FAIL  AGENTS.md invariant rules block MISSING\r\n== result: 1 fail, 0 warn ==\r\n', 's');
  assert.deepEqual(bad.fails, ['FAIL  AGENTS.md invariant rules block MISSING']);
  assert.equal(green(bad), false);
  assert.equal(green(readDoctor(0, 'no result line', 's')), false);
});

test('AC-5: the merge step — Push and open PR from chore/bootstrap, or the commands; never a merge run', () => {
  const on = facts({ branch: configured, here: configured, current: 'chore/bootstrap' });
  assert.equal(mergeStep(on).offered, true);
  assert.deepEqual(mergeStep(on).commands, ['git push -u origin chore/bootstrap', 'gh pr create --fill']);
  assert.equal(mergeStep({ ...on, gh: false }).offered, false);
  const elsewhere = mergeStep({ ...on, current: 'main' });
  assert.equal(elsewhere.offered, false);
  assert.match(elsewhere.why, /git switch chore\/bootstrap/);
  const local = mergeStep({ ...on, remote: '' });
  assert.equal(local.offered, false);
  assert.deepEqual(local.commands, ['git switch main', 'git merge --no-ff chore/bootstrap']);
  // the screen shows the step; a merge is only ever text to copy
  const v: BootView = { facts: on, answers: NO_ANSWERS, typed: { chat: '', docs: '' }, suggested: 'tr', agent: 'claude-code', doctor: ok, doctoring: false, pushing: false, prOutput: null, shell: true };
  assert.ok(section(v).includes('<button id="boot-pr" class="primary">Push and open PR</button>'));
  assert.ok(section({ ...v, facts: { ...on, remote: '' } }).includes('git merge --no-ff chore/bootstrap'));
  assert.ok(!section({ ...v, facts: { ...on, remote: '' } }).includes('id="boot-pr"'));
});

test('the section: answers before the output, what bootstrap wrote after it, gone once merged', () => {
  const v: BootView = { facts: facts(), answers: { ...NO_ANSWERS, trivial: '1' }, typed: { chat: '', docs: '' }, suggested: 'tr', agent: 'claude-code', doctor: null, doctoring: false, pushing: false, prOutput: null, shell: true };
  const first = section(v);
  assert.ok(first.includes('<li class="step now" aria-current="step">● not started</li>'));
  assert.ok(first.includes('<input name="chat" value=""'));
  assert.ok(first.includes('id="boot-mode-ask" class="secondary small" data-keep="1" aria-pressed="true">Decide in the interview <span class="rec">recommended</span>'));
  assert.ok(first.includes('id="boot-trivial-1" class="secondary small" data-keep="1" aria-pressed="true">1 · a PR and one reviewer, no spec <span class="rec">recommended</span>'));
  assert.ok(!first.includes('id="boot-doctor"'));
  const gen = section({ ...v, facts: facts({ branch: configured, here: configured, current: 'chore/bootstrap' }) });
  assert.ok(gen.includes('<li class="step done">✓ in the agent</li><li class="step now" aria-current="step">● generated</li>'));
  assert.ok(!gen.includes('name="chat"'));
  assert.ok(gen.includes('<li>Mode: lite — every workflow honors its gates.</li>'));
  assert.ok(gen.includes('<button id="boot-doctor" class="secondary">Run doctor</button>'));
  assert.equal(section({ ...v, facts: facts({ base: configured, here: configured }) }), '');
  assert.deepEqual(written(configured), { mode: 'Mode: lite — every workflow honors its gates.', language: 'Language: chat=tr · docs=tr — protocol fields stay English.' });
  // escaped
  assert.ok(!section({ ...v, typed: { chat: '"><script>', docs: '' } }).includes('"><script>'));
  assert.notEqual(key(facts(), null), key(facts({ started: true }), null));
});

test('AC-3: prompts/bootstrap.md and every adapter\'s bootstrap command hold the given-answers rule', () => {
  const prompt = fs.readFileSync(path.join(repo, 'prompts', 'bootstrap.md'), 'utf8');
  assert.ok(prompt.includes('ANSWERS GIVEN WITH THE COMMAND'));
  for (const k of ['chat=', 'docs=', 'mode=', 'trivial=']) assert.ok(prompt.includes(k), k);
  assert.ok(prompt.includes('do not ask them again'));
  for (const f of ['adapters/claude-code/.claude/commands/bootstrap.md', 'adapters/github-copilot/prompts/bootstrap.prompt.md', 'adapters/cursor/commands/bootstrap.md', 'adapters/codex/skills/bootstrap/SKILL.md']) {
    const t = fs.readFileSync(path.join(repo, f), 'utf8');
    assert.ok(t.includes('follow prompts/bootstrap.md, "ANSWERS GIVEN WITH THE COMMAND"'), f);
  }
  assert.ok(fs.readFileSync(path.join(repo, 'adapters/claude-code/.claude/commands/bootstrap.md'), 'utf8').includes('$ARGUMENTS'));
});

test('review round 1: what the screen offers in each phase, the codes as typed, the merged-unpulled card', () => {
  // L-2: the language part lowercased; anything else is no code, named on the screen, kept as typed
  assert.equal(lang('TR'), 'tr');
  assert.equal(lang('en_US'), 'en-US');
  assert.equal(lang('Turkish'), '');
  assert.deepEqual(answers({ chat: 'TR', docs: 'Turkish' }), { chat: 'tr', docs: '', mode: '', trivial: '' });
  const v: BootView = { facts: facts(), answers: answers({ chat: 'TR', docs: 'Turkish' }), typed: { chat: 'TR', docs: 'Turkish' }, suggested: 'tr', agent: 'claude-code', doctor: null, doctoring: false, pushing: false, prOutput: null, shell: true };
  const h = section(v);
  assert.ok(h.includes('<input name="chat" value="TR"'));
  assert.ok(h.includes('“Turkish” is not a language code: the document language will be asked in the interview.'));
  assert.ok(!h.includes('“TR” is not'));
  assert.equal(offered(v).cmd, '/bootstrap chat=tr');
  // L-1: the output waits on chore/bootstrap, the human on main: no /bootstrap, the switch instead
  const waits = offered({ ...v, facts: facts({ branch: configured }) });
  assert.equal(waits.cmd, null);
  assert.equal(waits.instead, "bootstrap's output waits on chore/bootstrap: git switch chore/bootstrap");
  // M-3: merged on the default branch, this working tree not pulled
  const unpulled = { ...v, facts: facts({ branch: configured, base: configured }) };
  assert.equal(phase(unpulled.facts, null), 'merged');
  assert.equal(offered(unpulled).cmd, null);
  assert.match(offered(unpulled).instead, /^bootstrap is merged on main: git pull/);
  assert.ok(section(unpulled).includes('Bootstrap is merged on main: git pull'));
  assert.equal(section({ ...unpulled, facts: { ...unpulled.facts, here: configured } }), '');
  // L-8: no default branch, chore/bootstrap kept after the merge, not checked out
  assert.equal(phase(facts({ base: null, defaultBranch: '', here: configured, branch: configured, current: 'develop' }), null), 'merged');
  // L-5: Start over while started and no branch yet
  assert.ok(section({ ...v, facts: facts({ started: true }) }).includes('<button id="boot-reset" class="link" data-keep="1">Start over</button>'));
  assert.ok(!section(v).includes('id="boot-reset"'));
});
