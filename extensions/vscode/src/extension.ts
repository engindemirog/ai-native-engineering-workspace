// The VS Code layer: activation, the sidebar, the status bar item and the screens. The logic lives
// in the modules it imports; this file only wires them to VS Code.
import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { findShell, runScript } from './shell.ts';
import { parseStatus, waiting, type Row, type Status } from './status.ts';
import { gateArgs, shipArgs, answer } from './gate.ts';
import { sections, SPEC_SECTIONS, PLAN_SECTIONS } from './summary.ts';
import { offer, decision, done, shown, fileFor, type Done } from './panel-logic.ts';
import { html, notice } from './panel.ts';
import * as sidebar from './sidebar.ts';
import * as start from './start.ts';
import * as triage from './triage.ts';
import { split, type Finding } from './report.ts';
import * as ship from './ship.ts';

export function activate(ctx: vscode.ExtensionContext): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  const root = folder?.uri.fsPath;
  if (!root || !fs.existsSync(path.join(root, 'scripts', 'status')) || !fs.existsSync(path.join(root, 'AGENTS.md'))) return;
  void vscode.commands.executeCommand('setContext', 'anew.active', true);

  const shellOf = () => findShell({ setting: vscode.workspace.getConfiguration('anew').get<string>('shell') ?? '', platform: process.platform, pathEnv: process.env.PATH ?? '' });
  const read = (rel: string) => { try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return ''; } };
  // The mockup's header: the mode from AGENTS.md and the base version from .anew-version.
  const meta = () => [/\*\*Mode:\s*([a-z]+)\*\*/i.exec(read('AGENTS.md'))?.[1], read('.anew-version').trim()].filter(Boolean).join(' · ');
  let status: Status | null = null;
  let problem: string | null = null;

  let side: vscode.WebviewView | null = null;
  const drawSide = () => {
    if (side === null) return;
    const m = sidebar.model(status, problem, meta());
    side.webview.html = sidebar.html(m, randomBytes(16).toString('hex'), side.webview.cspSource);
    side.badge = m.waiting ? { value: m.waiting, tooltip: `${m.waiting} decision(s) wait for you` } : undefined;
  };
  ctx.subscriptions.push(vscode.window.registerWebviewViewProvider('anew.work', {
    resolveWebviewView(v: vscode.WebviewView) {
      side = v;
      v.webview.options = { enableScripts: true, localResourceRoots: [] };
      v.webview.onDidReceiveMessage((m: { type: string }) => {
        if (m.type === 'new') void vscode.commands.executeCommand('anew.newWork');
        else if (m.type.startsWith('row-')) void vscode.commands.executeCommand('anew.open', m.type.slice(4));
      });
      v.onDidDispose(() => { side = null; });
      drawSide();
    },
  }, { webviewOptions: { retainContextWhenHidden: false } }));

  const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
  bar.command = 'workbench.view.extension.anew';
  ctx.subscriptions.push(bar);

  async function refresh(): Promise<void> {
    const shell = shellOf();
    if (shell === null) {
      status = null;
      problem = 'No POSIX shell found — set anew.shell (Git for Windows: bash.exe)';
    } else {
      const r = await runScript(shell, root as string, 'status', ['--json']);
      try {
        if (r.code !== 0) throw new Error(r.stderr.trim() || `scripts/status exited ${r.code}`);
        status = parseStatus(r.stdout);
        problem = null;
      } catch (e) {
        status = null;
        problem = (e as Error).message;
      }
    }
    const n = status ? waiting(status) : 0;
    bar.text = problem ? '$(warning) ANEW' : n ? `$(bell-dot) ANEW: ${n} waiting for you` : '$(check) ANEW';
    bar.tooltip = problem ?? (n ? `${n} decision(s) wait for you` : 'nothing waits for you');
    bar.show();
    drawSide();
    panel?.render();
    triager?.render();
    shipper?.render();
  }

  let timer: NodeJS.Timeout | undefined;
  const soon = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 300); };
  const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, 'specs/**'));
  watcher.onDidChange(soon); watcher.onDidCreate(soon); watcher.onDidDelete(soon);
  ctx.subscriptions.push(watcher, vscode.workspace.onDidChangeConfiguration((e) => { if (e.affectsConfiguration('anew.shell')) soon(); }));

  let panel: Approval | null = null;
  let starter: Start | null = null;
  let triager: Triage | null = null;
  let shipper: Ship | null = null;
  ctx.subscriptions.push(
    vscode.commands.registerCommand('anew.refresh', () => refresh()),
    vscode.commands.registerCommand('anew.newWork', () => {
      if (starter === null || starter.disposed) starter = new Start(root as string, read);
      starter.show();
    }),
    vscode.commands.registerCommand('anew.open', (spec: string) => {
      const row = status?.rows.find((r) => r.spec === spec);
      if (row && row.stage === 'SHIP') {
        if (shipper === null || shipper.disposed) shipper = new Ship(root as string, () => status, shellOf, refresh);
        shipper.show(spec);
        return;
      }
      if (row && triageKinds(row).length) {
        if (triager === null || triager.disposed) triager = new Triage(root as string, () => status, shellOf, refresh);
        triager.show(spec);
        return;
      }
      if (panel === null || panel.disposed) panel = new Approval(root as string, () => status, () => problem, shellOf, refresh);
      panel.show(spec);
    }),
  );
  void refresh();
}

export function deactivate(): void {}

// One panel, reused for whichever row was opened last.
class Approval {
  private readonly web: vscode.WebviewPanel;
  private spec = '';
  private opened: string | null = null; // the decision whose file was opened from this panel
  private running: string | null = null; // the spec a gate call runs for
  private result: Done | null = null;
  private approver = ''; // git user.name, the name gate writes
  disposed = false;
  private readonly root: string;
  private readonly status: () => Status | null;
  private readonly problem: () => string | null;
  private readonly shell: () => string | null;
  private readonly refresh: () => Promise<void>;

  constructor(root: string, status: () => Status | null, problem: () => string | null, shell: () => string | null, refresh: () => Promise<void>) {
    this.root = root;
    this.status = status;
    this.problem = problem;
    this.shell = shell;
    this.refresh = refresh;
    this.web = vscode.window.createWebviewPanel('anew.approval', 'ANEW', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [] });
    this.web.onDidDispose(() => { this.disposed = true; });
    execFile('git', ['config', 'user.name'], { cwd: root }, (_e, out) => { this.approver = String(out ?? '').trim(); this.render(); });
    this.web.webview.onDidReceiveMessage((m: { type: string }) => this.on(m.type).catch((e: Error) => {
      this.running = null;
      void vscode.window.showErrorMessage(`ANEW: ${e.message}`);
      this.render();
    }));
  }

  show(spec: string): void {
    if (spec !== this.spec) { this.spec = spec; this.opened = null; this.result = null; }
    this.render();
    this.web.reveal();
  }

  private row(): Row | undefined {
    return this.status()?.rows.find((r) => r.spec === this.spec);
  }

  // The file the screen reads (panel-logic.ts, fileFor): the plan for a plan approval and past
  // PLAN, the spec otherwise.
  private file(row: Row): string | null {
    let spec: string | null = null;
    for (const dir of ['specs/active', 'specs/done']) {
      const abs = path.join(this.root, dir);
      const hit = fs.existsSync(abs) ? fs.readdirSync(abs).find((f) => f.startsWith(`${row.spec}-`) && f.endsWith('.md')) : undefined;
      if (hit) { spec = `${dir}/${hit}`; break; }
    }
    return fileFor(row, spec, (rel) => fs.existsSync(path.join(this.root, rel)));
  }

  render(): void {
    if (this.disposed) return;
    const row = this.row();
    if (!row) {
      const text = this.problem() ?? (this.status() === null ? 'reading scripts/status…' : `${this.spec} is no longer in scripts/status.`);
      this.web.webview.html = notice(text, randomBytes(16).toString('hex'), this.web.webview.cspSource);
      return;
    }
    const file = this.file(row);
    const text = file && fs.existsSync(path.join(this.root, file)) ? fs.readFileSync(path.join(this.root, file), 'utf8') : '';
    const names = file?.startsWith('specs/plans/') ? PLAN_SECTIONS : SPEC_SECTIONS;
    const d = decision(row, file);
    this.web.title = `ANEW · ${row.spec}`;
    this.web.webview.html = html({
      row, file: file ?? '(file not found)', sections: sections(text, names),
      offer: offer({ row, opened: this.opened === d, shell: this.shell() !== null, running: this.running }),
      result: shown(this.result, row, file), approver: this.approver, nonce: randomBytes(16).toString('hex'), cspSource: this.web.webview.cspSource,
    });
  }

  private async on(type: string): Promise<void> {
    const row = this.row();
    const file = row && this.file(row);
    if (!row || !file) return this.render();
    if (type === 'open' || type === 'changes') {
      await vscode.window.showTextDocument(vscode.Uri.file(path.join(this.root, file)), { viewColumn: vscode.ViewColumn.Beside, preview: false });
      if (type === 'open') this.opened = decision(row, file);
      return this.render();
    }
    if (type === 'copy') {
      if (this.result?.next) {
        await vscode.env.clipboard.writeText(this.result.next);
        void vscode.window.showInformationMessage(`Copied: ${this.result.next}`);
      }
      return;
    }
    if (type !== 'approve') return;
    const d = decision(row, file);
    const o = offer({ row, opened: this.opened === d, shell: this.shell() !== null, running: this.running });
    const shell = this.shell();
    if (!o.approve || o.write === null || shell === null) return this.render();
    this.running = row.spec;
    this.render();
    const r = await runScript(shell, this.root, 'gate', gateArgs(o.write, row.spec));
    this.running = null;
    // the panel may have moved to another row while gate ran; the answer stays with its own spec
    if (this.spec === row.spec) this.result = done(answer(r.code, r.stdout, r.stderr), row, file, o.write);
    await this.refresh();
  }
}

// The start screen: it builds the command and opens a fresh agent session with it, or hands the
// command over; it writes no file and answers no gate (spec 0010, G-2).
class Start {
  private readonly web: vscode.WebviewPanel;
  private kind: start.Kind = 'feature';
  private description = '';
  private started: string | null = null;
  disposed = false;
  private readonly root: string;
  private readonly read: (rel: string) => string;

  constructor(root: string, read: (rel: string) => string) {
    this.root = root;
    this.read = read;
    this.web = vscode.window.createWebviewPanel('anew.start', 'ANEW · new work', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [] });
    this.web.onDidDispose(() => { this.disposed = true; });
    this.web.webview.onDidReceiveMessage((m: { type: string; form?: Record<string, string> }) => this.on(m.type, m.form ?? {}).catch((e: Error) => {
      void vscode.window.showErrorMessage(`ANEW: ${e.message}`);
      this.render();
    }));
  }

  show(): void {
    this.render();
    this.web.reveal();
  }

  private claude(): string | null {
    return start.findClaude({ platform: process.platform, pathEnv: process.env.PATH ?? '', exists: (p) => fs.existsSync(p), read: (p) => fs.readFileSync(p, 'utf8') });
  }

  private render(): void {
    if (this.disposed) return;
    const names = ['specs/active', 'specs/done', 'specs/plans'].flatMap((d) => { try { return fs.readdirSync(path.join(this.root, d)); } catch { return []; } });
    this.web.webview.html = start.html({
      kind: this.kind, description: this.description, mode: start.mode(this.read('AGENTS.md')), number: start.nextNumber(names),
      claude: this.claude() !== null, started: this.started, nonce: randomBytes(16).toString('hex'), cspSource: this.web.webview.cspSource,
    });
  }

  private async on(type: string, form: Record<string, string>): Promise<void> {
    this.description = form.description ?? this.description;
    if (type.startsWith('kind-')) {
      const k = start.KINDS.find((x) => x.id === type.slice(5)); // only a known kind
      if (k) this.kind = k.id;
      return this.render();
    }
    const cmd = start.command(this.kind, this.description, start.mode(this.read('AGENTS.md')));
    if (cmd === null) return this.render();
    if (type === 'copy') {
      await vscode.env.clipboard.writeText(cmd);
      void vscode.window.showInformationMessage(`Copied: ${cmd}`);
      return;
    }
    if (type !== 'start') return;
    const exe = this.claude();
    if (exe === null) return this.render();
    const t = vscode.window.createTerminal({ name: 'ANEW · new work', shellPath: exe, shellArgs: [cmd], cwd: this.root });
    t.show();
    this.started = cmd;
    this.render();
  }
}

// The rounds a row can be triaged in: REVIEW → a review round, VERIFY → a VERIFY round, an open
// investigate → either (scripts/gate triage).
function triageKinds(row: Row): triage.Kind[] {
  if (row.stage === 'REVIEW') return ['review'];
  if (row.stage === 'VERIFY') return ['verify'];
  if (row.stage.startsWith('unclear: investigate open')) return ['review', 'verify'];
  return [];
}

const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// The triage screen: the pasted report split into findings, the human's decisions, one gate call.
// The report lives only in this screen.
class Triage {
  private readonly web: vscode.WebviewPanel;
  private spec = '';
  private kind: triage.Kind = 'review';
  private report = '';
  private decisions: triage.Decision[] | null = null;
  private running = false;
  private result: { written: boolean; code: number; text: string; next: string } | null = null;
  private name = '';
  disposed = false;
  private readonly root: string;
  private readonly status: () => Status | null;
  private readonly shell: () => string | null;
  private readonly refresh: () => Promise<void>;

  constructor(root: string, status: () => Status | null, shell: () => string | null, refresh: () => Promise<void>) {
    this.root = root;
    this.status = status;
    this.shell = shell;
    this.refresh = refresh;
    this.web = vscode.window.createWebviewPanel('anew.triage', 'ANEW · triage', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [] });
    this.web.onDidDispose(() => { this.disposed = true; });
    execFile('git', ['config', 'user.name'], { cwd: root }, (_e, out) => { this.name = String(out ?? '').trim(); });
    this.web.webview.onDidReceiveMessage((m: { type: string; form?: Record<string, string> }) => this.on(m.type, m.form ?? {}).catch((e: Error) => {
      this.running = false;
      void vscode.window.showErrorMessage(`ANEW: ${e.message}`);
      this.render();
    }));
  }

  show(spec: string): void {
    if (spec !== this.spec) { this.spec = spec; this.report = ''; this.decisions = null; this.result = null; }
    const row = this.row();
    if (row && triageKinds(row).length && !triageKinds(row).includes(this.kind)) this.kind = triageKinds(row)[0];
    this.render();
    this.web.reveal();
  }

  private row(): Row | undefined {
    return this.status()?.rows.find((r) => r.spec === this.spec);
  }

  private read(rel: string): string {
    try { return fs.readFileSync(path.join(this.root, rel), 'utf8'); } catch { return ''; }
  }

  private context(): triage.Context {
    return { kind: this.kind, spec: this.spec, plan: this.read(`specs/plans/${this.spec}-plan.md`), backlog: this.read('specs/backlog.md'), name: this.name, today: today() };
  }

  render(): void {
    if (this.disposed) return;
    const row = this.row();
    if (!row) {
      this.web.webview.html = notice(`${this.spec} is not in scripts/status now.`, randomBytes(16).toString('hex'), this.web.webview.cspSource);
      return;
    }
    const problems = this.decisions ? triage.problems(this.decisions) : [];
    const kinds = triageKinds(row);
    this.web.title = `ANEW · ${row.spec} triage`;
    this.web.webview.html = triage.html({
      row, plan: `specs/plans/${row.spec}-plan.md`, kind: this.kind, kinds: kinds.length ? kinds : [this.kind],
      report: this.report, decisions: this.decisions, preview: this.decisions && !problems.length ? triage.write(this.decisions, this.context()) : null,
      problems, shell: this.shell() !== null, running: this.running, result: this.result, nonce: randomBytes(16).toString('hex'), cspSource: this.web.webview.cspSource,
    });
  }

  private async on(type: string, form: Record<string, string>): Promise<void> {
    // the page's fields first: the pasted report, each finding's text and note
    if (form.report !== undefined) this.report = form.report;
    this.decisions?.forEach((d, i) => {
      if (form[`title-${i}`] !== undefined) d.finding.title = form[`title-${i}`];
      if (form[`note-${i}`] !== undefined) d.note = form[`note-${i}`];
      const sev = form[`sev-${i}`];
      if (sev !== undefined && ['', 'Critical', 'High', 'Medium', 'Low', 'Info'].includes(sev)) d.finding.severity = sev as Finding['severity'];
    });
    const row = this.row();
    const v = /^v-(\d+)-(real|noise|defer|investigate)$/.exec(type);
    const rm = /^rm-(\d+)$/.exec(type);
    if (type === 'kind-review' || type === 'kind-verify') {
      // only a round the row's stage allows (gate would refuse the other)
      if (row && triageKinds(row).includes(type.slice(5) as triage.Kind)) this.kind = type.slice(5) as triage.Kind;
    }
    else if (type === 'split') this.decisions = split(this.report).map((finding) => ({ finding, verdict: null, note: '' }));
    else if (type === 'clean') this.decisions = [];
    else if (type === 'add') {
      const ds = this.decisions ?? [];
      let n = 1;
      while (ds.some((d) => d.finding.id === `X-${n}`)) n++;
      ds.push({ finding: { id: `X-${n}`, severity: '', title: '', detail: '', recommendation: '' }, verdict: null, note: '' });
      this.decisions = ds;
    } else if (v && this.decisions?.[Number(v[1])]) this.decisions[Number(v[1])].verdict = v[2] as triage.Verdict;
    else if (rm && this.decisions) this.decisions.splice(Number(rm[1]), 1);
    else if (type === 'copy') {
      if (this.result?.next) await vscode.env.clipboard.writeText(this.result.next);
      return;
    } else if (type === 'save') return this.save();
    this.render();
  }

  // The backlog entries for the defers first (the one file the extension writes itself), then the
  // gate call. A refusal leaves the entries and says so.
  private async save(): Promise<void> {
    const shell = this.shell();
    const ds = this.decisions;
    if (shell === null || ds === null || this.running || triage.problems(ds).length) return this.render();
    const w = triage.write(ds, this.context());
    const file = path.join(this.root, 'specs', 'backlog.md');
    const existed = fs.existsSync(file);
    const before = this.read('specs/backlog.md');
    // put the backlog back as it was: a refusal (or a failed call) writes nothing
    const restore = () => { if (!w.entries.length) return; if (existed) fs.writeFileSync(file, before); else fs.rmSync(file, { force: true }); };
    if (w.entries.length) fs.writeFileSync(file, triage.appended(before, w.entries));
    this.running = true;
    this.render();
    const spec = this.spec;
    let r: Awaited<ReturnType<typeof runScript>>;
    try {
      r = await runScript(shell, this.root, 'gate', w.args);
    } catch (e) {
      restore();
      throw e;
    }
    this.running = false;
    const a = answer(r.code, r.stdout, r.stderr);
    if (!a.written) restore();
    const real = ds.some((d) => d.verdict === 'real');
    const next = !a.written ? '' : real ? `/build ${spec}` : this.kind === 'review' || ds.some((d) => d.verdict === 'investigate') ? `/verify ${spec}` : '';
    if (this.spec === spec) this.result = { ...a, next };
    if (w.entries.length && a.written) {
      const ids = w.entries.map((e) => /\*\*(B-\d+)\*\*/.exec(e)?.[1]).join(', ');
      void vscode.window.showInformationMessage(`specs/backlog.md: ${ids} appended, not committed — commit it with the fix round or the PR.`);
    }
    await this.refresh();
  }
}

// A program's exit code, its stdout, and stdout with stderr (for showing), never through a shell
// string.
function run(cmd: string, args: string[], cwd: string): Promise<{ code: number; stdout: string; out: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd }, (e, stdout, stderr) => {
      const code = e ? (typeof (e as { code?: unknown }).code === 'number' ? (e as { code: number }).code : 1) : 0;
      resolve({ code, stdout: String(stdout ?? ''), out: `${String(stdout ?? '')}${String(stderr ?? '')}`.trim() });
    });
  });
}

// The ship screen: what the files say, one gate call, then the push and the PR on the human's
// confirmation. It never merges.
class Ship {
  private readonly web: vscode.WebviewPanel;
  private spec = '';
  private file = ''; // the spec, workspace-relative, as it was when the screen opened
  private running = false;
  private result: { written: boolean; code: number; text: string; next: string } | null = null;
  private pr: { offered: boolean; why: string; commands: string[] } | null = null;
  private prOutput: string | null = null;
  private pushing = false;
  private branch = '';
  private remote = 'origin';
  private approver = '';
  disposed = false;
  private readonly root: string;
  private readonly status: () => Status | null;
  private readonly shell: () => string | null;
  private readonly refresh: () => Promise<void>;

  constructor(root: string, status: () => Status | null, shell: () => string | null, refresh: () => Promise<void>) {
    this.root = root;
    this.status = status;
    this.shell = shell;
    this.refresh = refresh;
    this.web = vscode.window.createWebviewPanel('anew.ship', 'ANEW · ship', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [] });
    this.web.onDidDispose(() => { this.disposed = true; });
    void run('git', ['config', 'user.name'], root).then((r) => { this.approver = ship.probed(r); this.render(); });
    this.web.webview.onDidReceiveMessage((m: { type: string }) => this.on(m.type).catch((e: Error) => {
      this.running = false;
      this.pushing = false;
      void vscode.window.showErrorMessage(`ANEW: ${e.message}`);
      this.render();
    }));
  }

  show(spec: string): void {
    if (spec !== this.spec) { this.spec = spec; this.result = null; this.pr = null; this.prOutput = null; this.file = this.find(); }
    this.render();
    this.web.reveal();
  }

  private find(): string {
    for (const dir of ['specs/active', 'specs/done']) {
      try {
        const hit = fs.readdirSync(path.join(this.root, dir)).find((f) => f.startsWith(`${this.spec}-`) && f.endsWith('.md'));
        if (hit) return `${dir}/${hit}`;
      } catch { /* no such folder */ }
    }
    return '';
  }

  private read(rel: string): string {
    try { return fs.readFileSync(path.join(this.root, rel), 'utf8'); } catch { return ''; }
  }

  render(): void {
    if (this.disposed) return;
    const row = this.status()?.rows.find((r) => r.spec === this.spec);
    if (!row) {
      this.web.webview.html = notice(`${this.spec} is not in scripts/status now.`, randomBytes(16).toString('hex'), this.web.webview.cspSource);
      return;
    }
    if (!fs.existsSync(path.join(this.root, this.file))) this.file = this.find();
    this.web.title = `ANEW · ${row.spec} ship`;
    this.web.webview.html = ship.html({
      row, file: this.file, model: ship.model(this.read(this.file), this.read(`specs/plans/${row.spec}-plan.md`)), approver: this.approver,
      shell: this.shell() !== null, running: this.running, result: this.result, pr: this.pr, prOutput: this.prOutput, pushing: this.pushing,
      nonce: randomBytes(16).toString('hex'), cspSource: this.web.webview.cspSource,
    });
  }

  private async on(type: string): Promise<void> {
    if (type === 'open') {
      if (this.file) await vscode.window.showTextDocument(vscode.Uri.file(path.join(this.root, this.file)), { viewColumn: vscode.ViewColumn.Beside, preview: false });
      return this.render();
    }
    if (type === 'ship') return this.ship();
    if (type === 'pr') return this.openPr();
  }

  private async ship(): Promise<void> {
    const row = this.status()?.rows.find((r) => r.spec === this.spec);
    const shell = this.shell();
    if (!row || shell === null || this.running || !ship.offered(row).ok) return this.render();
    this.running = true;
    this.render();
    const spec = this.spec;
    const r = await runScript(shell, this.root, 'gate', shipArgs(spec));
    this.running = false;
    if (this.spec !== spec) return this.refresh();
    this.result = { ...answer(r.code, r.stdout, r.stderr), next: '' };
    if (this.result.written) {
      // each probe counts only on exit 0: an error message is never a branch or a remote
      this.branch = ship.probed(await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], this.root));
      this.remote = ship.probed(await run('git', ['config', `branch.${this.branch}.remote`], this.root)) || 'origin';
      const head = ship.probed(await run('git', ['symbolic-ref', '--short', `refs/remotes/${this.remote}/HEAD`], this.root));
      const gh = (await run('gh', ['auth', 'status'], this.root)).code === 0;
      this.pr = ship.prStep({ branch: this.branch, defaultBranch: ship.defaultBranch(head, this.remote), remote: this.remote, gh });
    }
    await this.refresh();
  }

  // Outward-facing: asks first, naming the branch and the remote; shows git's and gh's own output.
  private async openPr(): Promise<void> {
    if (!this.pr?.offered || this.pushing) return this.render();
    const ok = await vscode.window.showWarningMessage(`Push ${this.branch} to ${this.remote} and open a pull request?`,
      { modal: true, detail: `${this.pr.commands.join('\n')}\n\nThe merge stays on GitHub.` }, 'Push and open PR');
    if (ok !== 'Push and open PR') return this.render(); // cancelled: the button is offered again
    this.pushing = true;
    this.render();
    const push = await run('git', ['push', '-u', this.remote, this.branch], this.root);
    this.prOutput = `$ ${this.pr.commands[0]}\n${push.out}`;
    if (push.code === 0) {
      const pr = await run('gh', ['pr', 'create', '--fill'], this.root);
      this.prOutput += `\n$ ${this.pr.commands[1]}\n${pr.out}`;
    }
    this.pushing = false;
    this.render();
  }
}
