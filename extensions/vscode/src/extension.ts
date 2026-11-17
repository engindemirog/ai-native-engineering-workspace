// The VS Code layer: activation, the work list, the status bar item and the approval panel. The
// logic lives in the modules it imports; this file only wires them to VS Code.
import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomBytes } from 'node:crypto';
import { findShell, runScript } from './shell.ts';
import { parseStatus, grouped, waiting, writeFor, type Row, type Status, type Group } from './status.ts';
import { gateArgs, answer } from './gate.ts';
import { sections, SPEC_SECTIONS, PLAN_SECTIONS } from './summary.ts';
import { offer, decision, done, shown, type Done } from './panel-logic.ts';
import { html, notice } from './panel.ts';

type Item = { kind: 'group'; group: Group; rows: Row[] } | { kind: 'row'; row: Row } | { kind: 'message'; text: string };

const GROUPS: Group[] = ['your turn', 'in progress', 'shipped'];

export function activate(ctx: vscode.ExtensionContext): void {
  const folder = vscode.workspace.workspaceFolders?.[0];
  const root = folder?.uri.fsPath;
  if (!root || !fs.existsSync(path.join(root, 'scripts', 'status')) || !fs.existsSync(path.join(root, 'AGENTS.md'))) return;
  void vscode.commands.executeCommand('setContext', 'anew.active', true);

  const shellOf = () => findShell({ setting: vscode.workspace.getConfiguration('anew').get<string>('shell') ?? '', platform: process.platform, pathEnv: process.env.PATH ?? '' });
  let status: Status | null = null;
  let problem: string | null = null;

  const changed = new vscode.EventEmitter<void>();
  const tree: vscode.TreeDataProvider<Item> = {
    onDidChangeTreeData: changed.event,
    getChildren(item?: Item): Item[] {
      if (item?.kind === 'group') return item.rows.map((row) => ({ kind: 'row', row }));
      if (item) return [];
      if (problem !== null) return [{ kind: 'message', text: problem }];
      if (status === null) return [{ kind: 'message', text: 'reading scripts/status…' }];
      if (status.rows.length === 0) return [{ kind: 'message', text: 'no work yet — start with /new-feature or /analyze' }];
      const g = grouped(status);
      return GROUPS.filter((k) => g[k].length > 0).map((k) => ({ kind: 'group', group: k, rows: g[k] }));
    },
    getTreeItem(item: Item): vscode.TreeItem {
      if (item.kind === 'message') return new vscode.TreeItem(item.text);
      if (item.kind === 'group') {
        return new vscode.TreeItem(`${item.group.toUpperCase()} · ${item.rows.length}`,
          item.group === 'shipped' ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.Expanded);
      }
      const r = item.row;
      const t = new vscode.TreeItem(`${r.spec} · ${r.name}`);
      t.description = label(r) + (r.warnings.length ? ` · ${r.warnings.length} warning(s)` : '');
      t.tooltip = [`${r.stage}${r.who ? ` (${r.who})` : ''}`, r.next && `next: ${r.next}`, ...r.warnings.map((w) => `WARN ${w}`), ...r.notes].filter(Boolean).join('\n');
      t.iconPath = r.warnings.length ? new vscode.ThemeIcon('warning', new vscode.ThemeColor('editorWarning.foreground'))
        : r.stage === 'shipped' ? new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'))
        : r.who === 'human' || r.stage.startsWith('unclear') ? new vscode.ThemeIcon('bell-dot', new vscode.ThemeColor('charts.orange'))
        : new vscode.ThemeIcon('sync', new vscode.ThemeColor('charts.blue'));
      t.command = { command: 'anew.open', title: 'Open', arguments: [r.spec] };
      return t;
    },
  };
  const view = vscode.window.createTreeView('anew.work', { treeDataProvider: tree });
  ctx.subscriptions.push(view);

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
    view.badge = n ? { value: n, tooltip: `${n} decision(s) wait for you` } : undefined;
    changed.fire();
    panel?.render();
  }

  let timer: NodeJS.Timeout | undefined;
  const soon = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 300); };
  const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, 'specs/**'));
  watcher.onDidChange(soon); watcher.onDidCreate(soon); watcher.onDidDelete(soon);
  ctx.subscriptions.push(watcher, vscode.workspace.onDidChangeConfiguration((e) => { if (e.affectsConfiguration('anew.shell')) soon(); }));

  let panel: Approval | null = null;
  ctx.subscriptions.push(
    vscode.commands.registerCommand('anew.refresh', () => refresh()),
    vscode.commands.registerCommand('anew.open', (spec: string) => {
      if (panel === null || panel.disposed) panel = new Approval(root as string, () => status, () => problem, shellOf, refresh);
      panel.show(spec);
    }),
  );
  void refresh();
}

export function deactivate(): void {}

// What a row waits for, in the list's words: the decision when it is the human's, else the stage
// and who has it.
function label(r: Row): string {
  const w = writeFor(r);
  if (w !== null) return w === 'approve-spec' ? 'Spec approval' : 'Plan approval';
  if (r.stage === 'shipped' || r.stage.startsWith('unclear')) return r.stage;
  return r.who === 'human' ? `${r.stage} · your decision` : `${r.stage} · ${r.who}`;
}

// One panel, reused for whichever row was opened last.
class Approval {
  private readonly web: vscode.WebviewPanel;
  private spec = '';
  private opened: string | null = null; // the decision whose file was opened from this panel
  private running: string | null = null; // the spec a gate call runs for
  private result: Done | null = null;
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

  // The file the decision is on: the plan for a plan approval, the spec otherwise.
  private file(row: Row): string | null {
    if (writeFor(row) === 'approve-plan') return `specs/plans/${row.spec}-plan.md`;
    for (const dir of ['specs/active', 'specs/done']) {
      const abs = path.join(this.root, dir);
      const hit = fs.existsSync(abs) ? fs.readdirSync(abs).find((f) => f.startsWith(`${row.spec}-`) && f.endsWith('.md')) : undefined;
      if (hit) return `${dir}/${hit}`;
    }
    return null;
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
      result: shown(this.result, row, file), nonce: randomBytes(16).toString('hex'), cspSource: this.web.webview.cspSource,
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
