import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as os from 'node:os';
import { ADAPTERS, existsIn, installed, installable, bootstrapped, initArgs, pick, forAgent, needs, whyNot, key, type Exists, type Tool } from '../src/setup.ts';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const has = (...paths: string[]): Exists => (rel) => paths.includes(rel);
const configured = ['# AGENTS.md — Project Rules', '', '## Operating mode', '', '**Mode: lite** — every workflow honors its gates.', ''].join('\n');

test('installed or not, for none, one and all four adapters', () => {
  assert.deepEqual(installed(has()), []);
  assert.deepEqual(installed(has('.cursor/rules/')), ['cursor']);
  assert.deepEqual(installed(has('CLAUDE.md', '.github/copilot-instructions.md', '.cursor/rules/', '.agents/skills/analyze/SKILL.md')), ['claude-code', 'github-copilot', 'cursor', 'codex']);
  // a folder without the marker is not an install
  assert.deepEqual(installed(has('.claude/', '.agents/skills/')), []);
});

test('the markers are the ones scripts/doctor checks', () => {
  const doctor = fs.readFileSync(path.join(repo, 'scripts', 'doctor'), 'utf8');
  const line = doctor.split('\n').find((l) => l.includes('# --- adapter presence ---'));
  assert.ok(line);
  const check = doctor.split('\n')[doctor.split('\n').indexOf(line) + 1];
  for (const a of ADAPTERS) {
    const m = a.marker.replace(/\/$/, '');
    assert.ok(check.includes(`"$ROOT/${m}"`), `${a.id}: ${m} not in doctor's check`);
    assert.ok(check.includes(`${a.marker.endsWith('/') ? '-d' : '-f'} "$ROOT/${m}"`), `${a.id}: file or folder as doctor checks it`);
  }
});

test('Install is offered only when init and the adapter\'s folder are there; never --force', () => {
  assert.equal(installable('codex', has('scripts/init', 'adapters/codex/')), true);
  assert.equal(installable('codex', has('scripts/init')), false);
  assert.equal(installable('codex', has('adapters/codex/')), false);
  for (const a of ADAPTERS) {
    assert.deepEqual(initArgs(a.id), [a.id]);
    assert.ok(!initArgs(a.id).includes('--force'));
  }
});

test('bootstrap: the template\'s own AGENTS.md is not set up; a configured one is', () => {
  const template = fs.readFileSync(path.join(repo, 'AGENTS.md'), 'utf8');
  assert.equal(bootstrapped(template), false);
  assert.equal(bootstrapped(configured), true);
  assert.equal(bootstrapped(configured.replace('lite', 'strict')), true);
  assert.equal(bootstrapped(configured.replace('**Mode: lite**', '**Mode: unset**')), false);
  assert.equal(bootstrapped(''), false);
});

test('the agent picked: the stored pick, else Claude Code when found, else the first installed', () => {
  assert.equal(pick('codex', true, []), 'codex');
  assert.equal(pick('nonsense', true, ['cursor']), 'claude-code');
  assert.equal(pick(undefined, false, ['cursor', 'codex']), 'cursor');
  assert.equal(pick(undefined, false, []), 'claude-code');
});

test('the command form follows the agent: $ for Codex, / for the others', () => {
  assert.equal(forAgent('/new-feature export a month', 'codex'), '$new-feature export a month');
  assert.equal(forAgent('/bootstrap', 'codex'), '$bootstrap');
  for (const id of ['claude-code', 'github-copilot', 'cursor'] as const) assert.equal(forAgent('/fix-bug a/b', id), '/fix-bug a/b');
});

test('the sidebar\'s setup card: what is missing, nothing when set up', () => {
  assert.equal(needs([], '').length, 2);
  assert.deepEqual(needs(['cursor'], ''), ['The project is not set up yet (bootstrap has not run).']);
  assert.deepEqual(needs([], configured), ['No AI tool adapter is installed.']);
  assert.deepEqual(needs(['codex'], configured), []);
});

test('M-2: bootstrapped exactly as doctor reads it — any form of a set mode counts, a "Mode: unset" anywhere does not', () => {
  assert.equal(bootstrapped('# AGENTS.md\n\n**Mode:** lite — set\n'), true);
  assert.equal(bootstrapped('# AGENTS.md\n\nMode: strict\n'), true);
  assert.equal(bootstrapped('# AGENTS.md\n\n**Mode: lite**\n\nOld text: Mode: unset until bootstrap.\n'), false);
  assert.equal(bootstrapped('# AGENTS.md\n\nmode: UNSET\n'), false);
  assert.equal(bootstrapped('> **STATUS: NOT CONFIGURED.**\n**Mode: lite**\n'), false);
});

test('L-3: why Install is not offered names what is missing', () => {
  assert.equal(whyNot('cursor', has('adapters/cursor/')), 'no scripts/init here');
  assert.equal(whyNot('cursor', has('scripts/init')), 'no adapters/cursor/ here');
  assert.equal(whyNot('cursor', has('scripts/init', 'adapters/cursor/')), '');
});

test('M-1: the start screen\'s refresh key changes with the setup it shows, and only with it', () => {
  const s = { have: ['cursor'] as Tool[], installable: ['codex'] as Tool[], bootstrapped: false, mode: 'unset', why: {}, shell: true, claude: true };
  const k = key(s);
  assert.equal(key({ ...s }), k);
  for (const changed of [{ have: [] as Tool[] }, { installable: [] as Tool[] }, { bootstrapped: true }, { mode: 'lite' }, { why: { cursor: 'no scripts/init here' } }, { shell: false }, { claude: false }]) {
    assert.notEqual(key({ ...s, ...changed }), k, JSON.stringify(changed));
  }
});

test('R2-5: existsIn tells a file from a folder as doctor\'s -f and -d do', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anew-exists-'));
  try {
    fs.writeFileSync(path.join(dir, 'CLAUDE.md'), 'x');
    fs.mkdirSync(path.join(dir, '.cursor', 'rules'), { recursive: true });
    // a folder named as a file marker, a file named as a folder marker
    fs.mkdirSync(path.join(dir, '.agents', 'skills', 'analyze', 'SKILL.md'), { recursive: true });
    fs.mkdirSync(path.join(dir, '.github'));
    fs.writeFileSync(path.join(dir, '.github', 'copilot-instructions.md'), 'x');
    const exists = existsIn(dir);
    assert.equal(exists('CLAUDE.md'), true);
    assert.equal(exists('CLAUDE.md/'), false);
    assert.equal(exists('.cursor/rules/'), true);
    assert.equal(exists('.cursor/rules'), false);
    assert.equal(exists('.agents/skills/analyze/SKILL.md'), false);
    assert.equal(exists('nothing'), false);
    assert.deepEqual(installed(exists), ['claude-code', 'github-copilot', 'cursor']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
