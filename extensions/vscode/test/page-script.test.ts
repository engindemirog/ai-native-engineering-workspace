// The page script every screen shares (screens.ts), run over a small stand-in DOM: what reaches
// the extension when the human types, leaves a field, clicks and picks from a list (N-1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { page } from '../src/screens.ts';
import { parts } from '../src/triage.ts';

type Listener = (e?: unknown) => void;

class El {
  listeners: Record<string, Listener[]> = {};
  dataset: Record<string, string> = {};
  disabled = false;
  innerHTML = '';
  value = '';
  checked = false;
  tag: string;
  id: string;
  name: string;
  type: string;
  constructor(tag: string, id = '', name = '', type = '') { this.tag = tag; this.id = id; this.name = name; this.type = type; }
  addEventListener(t: string, f: Listener) { (this.listeners[t] ??= []).push(f); }
  fire(t: string) { for (const f of this.listeners[t] ?? []) f(); }
  focus() { doc.activeElement = this; }
}

let doc: { activeElement: El | null };

function load(els: El[]) {
  const posted: { type: string; form: Record<string, string> }[] = [];
  const timers: (() => void)[] = [];
  const winListeners: Listener[] = [];
  const body = new El('body');
  doc = { activeElement: body };
  const match = (e: El, sel: string) => sel.split(',').map((s) => s.trim()).some((s) => {
    const m = /^(\w+)?(?:\[(\w+)(?:="([^"]*)")?\])?$/.exec(s);
    if (!m) throw new Error(`selector not supported here: ${s}`);
    const [, tag, attr, val] = m;
    const has = attr === undefined || (val === undefined ? (e as unknown as Record<string, string>)[attr] !== '' : (e as unknown as Record<string, string>)[attr] === val);
    return (!tag || e.tag === tag) && has;
  });
  const document = {
    get activeElement() { return doc.activeElement; },
    querySelectorAll: (sel: string) => els.filter((e) => match(e, sel)),
    querySelector: (sel: string) => sel.startsWith('#') ? els.find((e) => e.id === sel.slice(1)) ?? null : els.find((e) => match(e, sel)) ?? null,
    getElementById: (id: string) => els.find((e) => e.id === id) ?? null,
  };
  let state: unknown;
  const vscode = { postMessage: (m: { type: string; form: Record<string, string> }) => posted.push(m), setState: (s: unknown) => { state = s; }, getState: () => state };
  const window = { addEventListener: (t: string, f: Listener) => { if (t === 'message') winListeners.push(f); } };
  const html = page({ title: 't', nonce: 'n', cspSource: 'c' }, '');
  const script = /<script nonce="n">([\s\S]*?)<\/script>/.exec(html)![1];
  let next = 0;
  const setTimeout = (f: () => void) => { timers[next] = f; return next++; };
  const clearTimeout = (i: number | undefined) => { if (i !== undefined) delete timers[i]; };
  new Function('acquireVsCodeApi', 'document', 'window', 'setTimeout', 'clearTimeout', script)(() => vscode, document, window, setTimeout, clearTimeout);
  const flush = () => { for (const [i, f] of timers.entries()) if (f) { delete timers[i]; f(); } };
  const message = (data: unknown) => { for (const f of winListeners) f({ data }); };
  return { posted, flush, message };
}

const screen = () => {
  const note = new El('input', '', 'note-0', 'text');
  const sev = new El('select', '', 'sev-0');
  const real = new El('button', 'v-0-real');
  const save = new El('button', 'save');
  const hint = new El('p', 'save-hint');
  const preview = new El('div', 'triage-preview');
  return { note, sev, real, save, hint, preview, all: [note, sev, real, save, hint, preview] };
};

test('N-1: leaving a text field sends nothing that redraws; the typing is sent once, after a pause', () => {
  const s = screen();
  const p = load(s.all);
  s.note.focus();
  s.note.value = 'why it is noise';
  s.note.fire('input');
  s.note.fire('change'); // Tab out, or the mousedown of a click elsewhere
  assert.equal(p.posted.length, 0);
  p.flush();
  assert.deepEqual(p.posted.map((m) => m.type), ['input']);
  assert.equal(p.posted[0].form['note-0'], 'why it is noise');
});

test('N-1: a click right after typing is sent with the typed text, and no typing message follows it', () => {
  const s = screen();
  const p = load(s.all);
  s.note.value = 'typed';
  s.note.fire('input');
  s.note.fire('change');
  s.real.focus();
  s.real.fire('click');
  p.flush();
  assert.deepEqual(p.posted.map((m) => m.type), ['v-0-real']);
  assert.equal(p.posted[0].form['note-0'], 'typed');
});

test('a choice in a list takes effect at once', () => {
  const s = screen();
  const p = load(s.all);
  s.sev.value = 'High';
  s.sev.fire('change');
  assert.deepEqual(p.posted.map((m) => [m.type, m.form['sev-0']]), [['sync', 'High']]);
});

test('N-1: the extension\'s update sets Save, its hint and the preview in place', () => {
  const s = screen();
  const p = load(s.all);
  s.save.disabled = true;
  const u = parts({ preview: { args: [], entries: [], preview: '| F-1 | <real> |' }, problems: [], shell: true, running: false });
  p.message({ type: 'update', ...u });
  assert.equal(s.save.disabled, false);
  assert.equal(s.hint.innerHTML, 'The table is written to the plan and committed.');
  assert.ok(s.preview.innerHTML.includes('| F-1 | &lt;real&gt; |'));
  p.message({ type: 'update', ...parts({ preview: null, problems: ['F-1: noise needs a note'], shell: true, running: false }) });
  assert.equal(s.save.disabled, true);
  assert.equal(s.preview.innerHTML, '');
  assert.match(s.hint.innerHTML, /Decide every finding first: F-1: noise needs a note\./);
});
