import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADAPTERS, installed, installable, bootstrapped, initArgs, pick, forAgent, needs, type Exists } from '../src/setup.ts';

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
