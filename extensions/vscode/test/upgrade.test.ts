import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

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
