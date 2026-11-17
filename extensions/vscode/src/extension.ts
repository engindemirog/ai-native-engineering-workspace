// The VS Code layer: activation, the sidebar, the status bar item and the screens. The logic lives
// in the modules it imports; this file only wires them to VS Code.
import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { findShell, runScript } from './shell.ts';
import { parseStatus, waiting, type Row, type Status } from './status.ts';
import { gateArgs, answer } from './gate.ts';
import { sections, SPEC_SECTIONS, PLAN_SECTIONS } from './summary.ts';
import { offer, decision, done, shown, fileFor, type Done } from './panel-logic.ts';
import { html, notice } from './panel.ts';
import * as sidebar from './sidebar.ts';
import * as start from './start.ts';

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
  }

  let timer: NodeJS.Timeout | undefined;
  const soon = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 300); };
  const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, 'specs/**'));
  watcher.onDidChange(soon); watcher.onDidCreate(soon); watcher.onDidDelete(soon);
  ctx.subscriptions.push(watcher, vscode.workspace.onDidChangeConfiguration((e) => { if (e.affectsConfiguration('anew.shell')) soon(); }));

  let panel: Approval | null = null;
  let starter: Start | null = null;
  ctx.subscriptions.push(
    vscode.commands.registerCommand('anew.refresh', () => refresh()),
    vscode.commands.registerCommand('anew.newWork', () => {
      if (starter === null || starter.disposed) starter = new Start(root as string, read);
      starter.show();
    }),
    vscode.commands.registerCommand('anew.open', (spec: string) => {
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
      this.kind = type.slice(5) as start.Kind;
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
