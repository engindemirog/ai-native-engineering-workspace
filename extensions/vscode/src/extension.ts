// The VS Code layer: activation, the sidebar, the status bar item and the screens. The logic lives
// in the modules it imports; this file only wires them to VS Code.
import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as os from 'node:os';
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
import * as setup from './setup.ts';
import * as triage from './triage.ts';
import { split, type Finding } from './report.ts';
import * as ship from './ship.ts';
import * as adopt from './adopt.ts';
import * as boot from './bootstrap.ts';
import { esc } from './screens.ts';
import { nextFor, canContinue, type Agent } from './next.ts';

export function activate(ctx: vscode.ExtensionContext): void {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  let started = false;
  // ANEW's screens once the folder holds ANEW: at startup, or right after an Add (spec 0013)
  const begin = () => {
    if (started || !root || !hasAnew(root)) return;
    started = true;
    screens(ctx, root);
  };
  // without ANEW, the view's welcome: Add and New (package.json, viewsWelcome)
  ctx.subscriptions.push(
    vscode.window.registerTreeDataProvider('anew.welcome', { getTreeItem: (x: vscode.TreeItem) => x, getChildren: () => [] }),
    vscode.commands.registerCommand('anew.adopt', () => addAnew(root, begin).catch(failed)),
    vscode.commands.registerCommand('anew.newProject', () => newProject().catch(failed)),
  );
  begin();
}

const hasAnew = (root: string) => fs.existsSync(path.join(root, 'scripts', 'status')) && fs.existsSync(path.join(root, 'AGENTS.md'));

function screens(ctx: vscode.ExtensionContext, root: string): void {
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
    const m = sidebar.model(status, problem, meta(), setup.needs(setup.installed(setup.existsIn(root)), read('AGENTS.md')));
    side.webview.html = sidebar.html(m, randomBytes(16).toString('hex'), side.webview.cspSource);
    side.badge = m.waiting ? { value: m.waiting, tooltip: `${m.waiting} decision(s) wait for you` } : undefined;
  };
  ctx.subscriptions.push(vscode.window.registerWebviewViewProvider('anew.work', {
    resolveWebviewView(v: vscode.WebviewView) {
      side = v;
      v.webview.options = { enableScripts: true, localResourceRoots: [] };
      v.webview.onDidReceiveMessage((m: { type: string }) => {
        if (m.type === 'new' || m.type === 'setup') void vscode.commands.executeCommand('anew.newWork');
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
    starter?.refreshed();
  }

  let timer: NodeJS.Timeout | undefined;
  const soon = () => { clearTimeout(timer); timer = setTimeout(() => void refresh(), 300); };
  const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, 'specs/**'));
  watcher.onDidChange(soon); watcher.onDidCreate(soon); watcher.onDidDelete(soon);
  // the setup follows an install or a bootstrap: AGENTS.md and the files doctor's adapter check names
  const setupWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, '{AGENTS.md,CLAUDE.md,.github,.github/copilot-instructions.md,.cursor,.cursor/rules,.cursor/rules/**,.agents,.agents/skills,.agents/skills/analyze,.agents/skills/analyze/SKILL.md}'));
  setupWatcher.onDidChange(soon); setupWatcher.onDidCreate(soon); setupWatcher.onDidDelete(soon);
  ctx.subscriptions.push(setupWatcher);
  // bootstrap's phase follows the files doctor reads, a commit, a branch switch, a fetch (spec 0014)
  // — Start alone: the other screens are not redrawn for these (review round 2, N-3)
  let bootTimer: NodeJS.Timeout | undefined;
  const bootSoon = () => { clearTimeout(bootTimer); bootTimer = setTimeout(() => starter?.refreshed(), 300); };
  const bootWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(root, '{docs/**,scripts/**,workflows/**,prompts/**,.git/HEAD,.git/refs/**}'));
  bootWatcher.onDidChange(bootSoon); bootWatcher.onDidCreate(bootSoon); bootWatcher.onDidDelete(bootSoon);
  ctx.subscriptions.push(bootWatcher);
  ctx.subscriptions.push(watcher, vscode.workspace.onDidChangeConfiguration((e) => { if (e.affectsConfiguration('anew.shell')) soon(); }));

  let panel: Approval | null = null;
  let starter: Start | null = null;
  let triager: Triage | null = null;
  let shipper: Ship | null = null;
  ctx.subscriptions.push(
    vscode.commands.registerCommand('anew.refresh', () => refresh()),
    vscode.commands.registerCommand('anew.newWork', () => {
      if (starter === null || starter.disposed) starter = new Start(root as string, read, ctx.workspaceState, shellOf, refresh);
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
        if (triager === null || triager.disposed) triager = new Triage(root as string, () => status, shellOf, refresh, ctx.workspaceState);
        triager.show(spec);
        return;
      }
      if (panel === null || panel.disposed) panel = new Approval(root as string, () => status, () => problem, shellOf, refresh, ctx.workspaceState);
      panel.show(spec);
    }),
  );
  void refresh();
}

export function deactivate(): void {}

let channel: vscode.OutputChannel | null = null;
const output = () => (channel ??= vscode.window.createOutputChannel('ANEW'));
const failed = (e: Error) => void vscode.window.showErrorMessage(`ANEW: ${e.message}`);
let adopting = false; // one Add or New at a time

const shellNow = () => findShell({ setting: vscode.workspace.getConfiguration('anew').get<string>('shell') ?? '', platform: process.platform, pathEnv: process.env.PATH ?? '' });

// The latest release of the template repository: its tag and where to clone it (spec 0013, R4).
async function latest(): Promise<{ tag: string; url: string; from: string }> {
  const repo = adopt.repository(vscode.workspace.getConfiguration('anew').get<string>('templateRepository') ?? '');
  if (repo === null) throw new Error('anew.templateRepository is neither owner/name nor a GitHub URL.');
  let body: string;
  try {
    const res = await fetch(adopt.latestUrl(repo), { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'anew-vscode' }, signal: AbortSignal.timeout(30_000) });
    body = await res.text();
  } catch (e) {
    throw new Error(`GitHub could not be reached (${(e as Error).message}); nothing was written.`);
  }
  return { tag: adopt.latestTag(body), url: adopt.cloneUrl(repo), from: adopt.source(repo) };
}

// The release's own scripts/adopt into the target, from a clone in a temporary folder that is
// removed afterwards; its output as it is, in the ANEW output channel.
async function adoptInto(shell: string, url: string, tag: string, target: string): Promise<{ summary: string; stdout: string }> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'anew-release-'));
  try {
    const dir = path.join(tmp, 'template');
    // no prompt from git, nor a credential window (a wrong or private repository) — review round 2, R2-4
    const g = await run('git', adopt.cloneArgs(url, tag, dir), tmp, { GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' });
    if (g.code !== 0) throw new Error(`git clone of ${tag} failed: ${g.out || 'git was not found'}; nothing was written.`);
    if (!fs.existsSync(path.join(dir, 'scripts', 'adopt'))) throw new Error(`${adopt.NO_ADOPT(tag)}; nothing was written.`);
    const r = await runScript(shell, dir, 'adopt', adopt.adoptArgs(target));
    output().appendLine(`$ scripts/adopt ${target}  (ANEW ${tag})`);
    output().appendLine(`${r.stdout}${r.stderr}`.trimEnd());
    if (r.code !== 0) { output().show(true); throw new Error(`scripts/adopt exited ${r.code} — see its output (ANEW).`); }
    if (adopt.merges(r.stdout).length) output().show(true);
    return { summary: adopt.summary(r.stdout), stdout: r.stdout };
  } finally {
    // a folder still held (antivirus, an indexer) never turns the result into a failure (L-3)
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { output().appendLine(`not removed: ${tmp} (${(e as Error).message})`); }
  }
}

// Add: the folder open here gets the core; files that exist are kept; nothing is committed.
async function addAnew(root: string | undefined, begin: () => void): Promise<void> {
  if (!root) return void vscode.window.showInformationMessage('Open a folder first, or create a new ANEW project.');
  if (adopting || hasAnew(root)) return;
  const shell = shellNow();
  if (shell === null) throw new Error('No POSIX shell found: set anew.shell (Git for Windows: bash.exe). Nothing was written.');
  adopting = true;
  try {
    const { tag, url, from } = await reading();
    if (await vscode.window.showWarningMessage(adopt.addConfirm(root, tag, from), { modal: true }, 'Add ANEW') !== 'Add ANEW') return;
    const r = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `ANEW ${tag}: adding to this project…` }, () => adoptInto(shell, url, tag, root));
    adopted(r.stdout, `${r.summary}${adopt.merges(r.stdout).length ? ' Some files were kept: merge their .anew versions (see the output).' : ''} Nothing is committed: the commit is yours.`);
    begin();
  } finally {
    adopting = false;
  }
}

// The release read inside a progress notification, so a slow network shows (L-4).
const reading = () => vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'ANEW: reading the latest release…' }, () => latest());

// adopt's answer: on Windows, the git add --chmod=+x line to copy, since git there records no
// executable bit (spec 0013, G-5; review round 1, M-4).
function adopted(stdout: string, text: string): void {
  const line = adopt.chmodLine(stdout);
  const copy = process.platform === 'win32' && line ? ['Copy git add line'] : [];
  void vscode.window.showInformationMessage(text, ...copy, 'Show output').then(async (b) => {
    if (b === 'Show output') output().show();
    else if (b) { await vscode.env.clipboard.writeText(line); void vscode.window.showInformationMessage(`Copied: ${line} — run it before your commit.`); }
  });
}

const emptyOrNone = (dir: string) => { try { return fs.statSync(dir).isDirectory() && fs.readdirSync(dir).length === 0; } catch { return true; } };

// New: a new (or empty) folder with the core, its repository and one commit, opened here.
async function newProject(): Promise<void> {
  if (adopting) return;
  const shell = shellNow();
  if (shell === null) throw new Error('No POSIX shell found: set anew.shell (Git for Windows: bash.exe). Nothing was written.');
  const parent = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false, openLabel: 'Create the project in this folder' });
  if (!parent?.length) return;
  const base = parent[0].fsPath;
  const name = await vscode.window.showInputBox({
    prompt: `The new project's folder, in ${base}`,
    validateInput: (v) => adopt.nameProblem(v) || (emptyOrNone(path.join(base, v)) ? '' : 'That folder exists and is not empty.'),
  });
  if (name === undefined) return;
  const target = path.join(base, name);
  adopting = true;
  try {
    const { tag, url, from } = await reading();
    if (await vscode.window.showWarningMessage(adopt.newConfirm(target, tag, from), { modal: true }, 'Create') !== 'Create') return;
    const made = !fs.existsSync(target);
    const failedGit = await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: `ANEW ${tag}: creating ${name}…` }, async () => {
      fs.mkdirSync(target, { recursive: true });
      try {
        await adoptInto(shell, url, tag, target);
      } catch (e) {
        // the folder New made goes again: nothing was written (L-1)
        if (made) {
          try { fs.rmSync(target, { recursive: true, force: true }); } catch { throw new Error(`${(e as Error).message} The folder ${target} could not be removed: delete it by hand.`); }
        }
        throw e;
      }
      const files = fs.readdirSync(path.join(target, 'scripts'), { withFileTypes: true }).filter((f) => f.isFile()).map((f) => `scripts/${f.name}`);
      for (const step of adopt.newSteps(tag, files)) {
        const g = await run('git', step, target, { GIT_TERMINAL_PROMPT: '0' });
        if (g.code !== 0) return `git ${step[0]} failed in ${target}: ${g.out || 'git was not found'}. The ANEW core is there; finish the repository by hand.`;
      }
      return '';
    });
    // the folder opens either way; a failed git step is named (L-2)
    if (failedGit) void vscode.window.showErrorMessage(`ANEW: ${failedGit}`);
    await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(target));
  } finally {
    adopting = false;
  }
}

const claudeExe = () => start.findClaude({ platform: process.platform, pathEnv: process.env.PATH ?? '', exists: (p) => fs.existsSync(p), read: (p) => fs.readFileSync(p, 'utf8') });

// The agent a next step is for, read as the Start screen reads it (spec 0011), never cached.
function agentIn(root: string, memo: vscode.Memento): Agent {
  const have = setup.installed(setup.existsIn(root));
  const claude = claudeExe() !== null;
  return { agent: setup.pick(memo.get<string>('anew.agent'), claude, have), claude, have };
}

// A fresh Claude Code session with the command, in a terminal: Start, and Continue (spec 0012).
function openClaude(root: string, exe: string, cmd: string, name: string): void {
  const t = vscode.window.createTerminal({ name, shellPath: exe, shellArgs: [cmd], cwd: root });
  t.show();
}

// Copy, or Continue in Claude Code, with a next step in the agent's form; Continue only under
// Start's rule (next.ts, canContinue).
async function nextStep(type: string, root: string, memo: vscode.Memento, cmd: string): Promise<void> {
  if (!cmd) return;
  const a = agentIn(root, memo);
  const c = setup.forAgent(cmd, a.agent);
  if (type === 'copy') {
    await vscode.env.clipboard.writeText(c);
    void vscode.window.showInformationMessage(`Copied: ${c}`);
    return;
  }
  if (type !== 'continue') return;
  const exe = claudeExe();
  if (canContinue(a) && exe !== null) return openClaude(root, exe, c, `ANEW · ${c}`);
  // drawn under the rule, no longer under it at the click: say why (review round 1, L-1)
  void vscode.window.showInformationMessage(a.agent !== 'claude-code' ? `The agent picked is ${setup.adapter(a.agent).label}: copy the command into its chat.`
    : exe === null ? 'Claude Code was not found on PATH: copy the command.' : 'Continue waits for the Claude Code adapter: install it on the Start screen.');
}

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
  private readonly memo: vscode.Memento;

  constructor(root: string, status: () => Status | null, problem: () => string | null, shell: () => string | null, refresh: () => Promise<void>, memo: vscode.Memento) {
    this.root = root;
    this.status = status;
    this.problem = problem;
    this.shell = shell;
    this.refresh = refresh;
    this.memo = memo;
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
      result: shown(this.result, row, file), approver: this.approver, agent: agentIn(this.root, this.memo), nonce: randomBytes(16).toString('hex'), cspSource: this.web.webview.cspSource,
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
    if (type === 'copy' || type === 'continue') {
      // the step the screen shows: gate's answer's, else the row's while it waits for the agent
      const r = shown(this.result, row, file);
      return nextStep(type, this.root, this.memo, r ? (r.written ? r.next : '') : nextFor(row) ?? '');
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
// command over; it answers no gate (spec 0010, G-2). The setup (spec 0011): the adapters installed
// as doctor reads them, Install through `scripts/init` (never --force), bootstrap first.
class Start {
  private readonly web: vscode.WebviewPanel;
  private kind: start.Kind = 'feature';
  private description = '';
  private started: string | null = null;
  private installing: setup.Tool | null = null;
  private installed: start.StartView['installed'] = null;
  // bootstrap on the screen (spec 0014): the facts read from git on each draw, doctor's last answer
  private facts: boot.Facts | null = null;
  private doctor: boot.Doctor | null = null;
  private doctoring = false;
  private pushing = false;
  private prOutput: string | null = null;
  disposed = false;
  private readonly root: string;
  private readonly read: (rel: string) => string;
  private readonly memo: vscode.Memento;
  private readonly shell: () => string | null;
  private readonly refresh: () => Promise<void>;

  constructor(root: string, read: (rel: string) => string, memo: vscode.Memento, shell: () => string | null, refresh: () => Promise<void>) {
    this.root = root;
    this.read = read;
    this.memo = memo;
    this.shell = shell;
    this.refresh = refresh;
    this.web = vscode.window.createWebviewPanel('anew.start', 'ANEW · new work', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [], retainContextWhenHidden: true });
    this.web.onDidDispose(() => { this.disposed = true; });
    // what the bootstrap section shows changes outside any watched file (a commit, a fetch): read
    // again whenever the panel comes into view (review round 1, M-2)
    this.web.onDidChangeViewState((e) => { if (e.webviewPanel.visible) this.refreshed(); });
    this.web.webview.onDidReceiveMessage((m: { type: string; form?: Record<string, string> }) => this.on(m.type, m.form ?? {}).catch((e: Error) => {
      void vscode.window.showErrorMessage(`ANEW: ${e.message}`);
      this.render();
    }));
  }

  // drawn once the first gather has read git: before it, no /bootstrap could be told from an output
  // already waiting (review round 2, N-4)
  show(): void {
    this.web.reveal();
    void this.gather().then(() => this.render());
  }

  private claude(): string | null {
    return claudeExe();
  }

  private answers(): boot.Answers {
    return boot.answers(this.memo.get('anew.bootstrap.answers'));
  }

  // What the bootstrap section shows, from the files and git (spec 0014, G-4); never cached.
  private gathering = 0; // the newest gather; an older one that ends later is dropped (L-4)
  private async gather(): Promise<boot.Facts> {
    const n = ++this.gathering;
    const index = path.join(os.tmpdir(), `anew-index-${process.pid}-${n}`);
    try {
      const facts = await boot.gather({
        git: async (args, env) => { const r = await run('git', args, this.root, env); return r.code === 0 ? r.stdout : null; },
        gh: async () => (await run('gh', ['auth', 'status'], this.root)).code === 0,
        here: this.read('AGENTS.md'),
        started: this.memo.get<boolean>('anew.bootstrap.started') === true,
        checkConf: fs.existsSync(path.join(this.root, 'scripts', 'check.conf')),
        index,
        seed: (gitIndex, to) => fs.copyFileSync(path.resolve(this.root, gitIndex), to),
      });
      if (n === this.gathering) this.facts = facts;
      return facts;
    } finally {
      try { fs.rmSync(index, { force: true }); } catch { /* a temporary index; the OS cleans it */ }
    }
  }

  private typed(): { chat: string; docs: string } {
    const r = (this.memo.get('anew.bootstrap.answers') ?? {}) as Record<string, unknown>;
    return { chat: typeof r.chat === 'string' ? r.chat : '', docs: typeof r.docs === 'string' ? r.docs : '' };
  }

  private bootView(agent: setup.Tool): boot.BootView | null {
    return this.facts === null ? null : {
      facts: { ...this.facts, here: this.read('AGENTS.md') }, answers: this.answers(), typed: this.typed(), suggested: boot.suggested(vscode.env.language), agent,
      doctor: this.doctor, doctoring: this.doctoring, pushing: this.pushing, prOutput: this.prOutput, shell: this.shell() !== null,
    };
  }

  // Read again on every draw: installed or not is never cached (spec 0011, Constraints).
  private setup() {
    const exists = setup.existsIn(this.root);
    const have = setup.installed(exists);
    const claude = this.claude() !== null;
    return {
      claude, have,
      installable: setup.ADAPTERS.filter((a) => setup.installable(a.id, exists)).map((a) => a.id),
      why: Object.fromEntries(setup.ADAPTERS.map((a) => [a.id, setup.whyNot(a.id, exists)])) as Partial<Record<setup.Tool, string>>,
      agent: setup.pick(this.memo.get<string>('anew.agent'), claude, have),
      bootstrapped: setup.bootstrapped(this.read('AGENTS.md')),
    };
  }

  private shown = '';
  private keyNow(): string {
    return setup.key({ ...this.setup(), mode: start.mode(this.read('AGENTS.md')), shell: this.shell() !== null }) + (this.facts ? boot.key(this.facts, this.doctor) : '');
  }

  // After a refresh: redrawn only when the setup it shows changed (review round 1, M-1).
  refreshed(): void {
    if (this.disposed) return;
    void this.gather().then(() => { if (!this.disposed && this.keyNow() !== this.shown) this.render(); });
  }

  render(): void {
    if (this.disposed) return;
    this.shown = this.keyNow();
    const names = ['specs/active', 'specs/done', 'specs/plans'].flatMap((d) => { try { return fs.readdirSync(path.join(this.root, d)); } catch { return []; } });
    this.web.webview.html = start.html({
      kind: this.kind, description: this.description, mode: start.mode(this.read('AGENTS.md')), number: start.nextNumber(names),
      ...this.setup(), started: this.started, shell: this.shell() !== null, installing: this.installing, installed: this.installed,
      boot: this.bootView(this.setup().agent), nonce: randomBytes(16).toString('hex'), cspSource: this.web.webview.cspSource,
    });
  }

  private async on(type: string, form: Record<string, string>): Promise<void> {
    this.description = form.description ?? this.description;
    if (form.chat !== undefined || form.docs !== undefined) {
      // the languages are kept as typed; the command in the preview follows in place (no redraw)
      await this.memo.update('anew.bootstrap.answers', { ...this.answers(), chat: (form.chat ?? '').trim(), docs: (form.docs ?? '').trim() });
      const s = this.setup();
      const b = this.bootView(s.agent);
      const o = b ? boot.offered(b) : null;
      if (!s.bootstrapped && type === 'input' && o?.cmd) void this.web.webview.postMessage({ type: 'update', html: { preview: esc(o.cmd) } });
    }
    if (type === 'input' || type === 'sync') return; // kept; the page already shows it
    const pick = /^boot-(mode|trivial)-(ask|lite|strict|1|2|3)$/.exec(type);
    if (pick) {
      await this.memo.update('anew.bootstrap.answers', { ...this.answers(), [pick[1]]: pick[2] === 'ask' ? '' : pick[2] });
      return this.render();
    }
    if (type === 'boot-doctor') return this.runDoctor();
    if (type === 'boot-reset') { await this.memo.update('anew.bootstrap.started', false); await this.gather(); return this.render(); }
    if (type === 'boot-pr') return this.openPr();
    if (type.startsWith('kind-')) {
      const k = start.KINDS.find((x) => x.id === type.slice(5)); // only a known kind
      if (k) this.kind = k.id;
      return this.render();
    }
    if (type.startsWith('agent-')) {
      const id = type.slice(6);
      if (setup.isTool(id)) await this.memo.update('anew.agent', id);
      // the open approval and triage screens show the command in the agent's form (review round 1, L-2)
      void this.refresh();
      return this.render();
    }
    if (type.startsWith('install-')) {
      const id = type.slice(8);
      return setup.isTool(id) ? this.install(id) : this.render();
    }
    if (type === 'generic') {
      const f = path.join(this.root, 'adapters', 'generic', 'README.md');
      if (fs.existsSync(f)) await vscode.window.showTextDocument(vscode.Uri.file(f), { preview: true });
      else void vscode.window.showInformationMessage('adapters/generic/README.md is not in this workspace: paste AGENTS.md at the start of a session.');
      return;
    }
    const s = this.setup();
    if (!s.bootstrapped && this.facts === null) return; // not read yet (N-4)
    const b = this.bootView(s.agent);
    const cmd = s.bootstrapped ? start.command(this.kind, this.description, start.mode(this.read('AGENTS.md')), s.agent) : b ? boot.offered(b).cmd : boot.command(this.answers(), s.agent);
    if (cmd === null) return this.render();
    if (type === 'copy') {
      await vscode.env.clipboard.writeText(cmd);
      void vscode.window.showInformationMessage(`Copied: ${cmd}`);
      return;
    }
    if (type !== 'start' || s.agent !== 'claude-code') return;
    const exe = this.claude();
    if (exe === null) return this.render();
    openClaude(this.root, exe, cmd, 'ANEW · new work');
    this.started = cmd;
    if (!s.bootstrapped) { await this.memo.update('anew.bootstrap.started', true); await this.gather(); }
    this.render();
  }

  // ./scripts/doctor on the working tree, read-only; its answer kept with the state it ran on.
  private async runDoctor(): Promise<void> {
    const shell = this.shell();
    if (shell === null || this.doctoring) return this.render();
    this.doctoring = true;
    this.render();
    try {
      // this gather's own state, even if a newer one is still running (review round 2, N-2)
      const state = (await this.gather()).state;
      const r = await runScript(shell, this.root, 'doctor', []);
      this.doctor = boot.readDoctor(r.code, `${r.stdout}${r.stderr}`, state);
    } finally {
      this.doctoring = false;
    }
    await this.gather();
    this.render();
  }

  // Push chore/bootstrap and open its PR after a confirmation naming branch and remote; never a
  // merge (spec 0014, G-5).
  private async openPr(): Promise<void> {
    await this.gather();
    const f = this.facts;
    if (f === null || this.pushing || !boot.mergeStep(f).offered) return this.render();
    const ok = await vscode.window.showWarningMessage(`Push ${boot.BRANCH} to ${f.remote} and open its PR?`, {
      modal: true, detail: `git push -u ${f.remote} ${boot.BRANCH}, then gh pr create --fill. The merge stays with the team: review and CI first.`,
    }, 'Push and open PR');
    if (ok !== 'Push and open PR') return this.render();
    this.pushing = true;
    this.prOutput = null;
    this.render();
    try {
      const push = await run('git', ['push', '-u', f.remote, boot.BRANCH], this.root, { GIT_TERMINAL_PROMPT: '0' });
      if (push.code !== 0) this.prOutput = `git push exited ${push.code}:\n${push.out}`;
      else {
        const pr = await run('gh', ['pr', 'create', '--fill'], this.root, { GH_PROMPT_DISABLED: '1' });
        this.prOutput = pr.code === 0 ? `✓ ${pr.out}` : `gh pr create exited ${pr.code}:\n${pr.out}`;
      }
    } finally {
      this.pushing = false;
    }
    await this.gather();
    this.render();
  }

  // One `./scripts/init <tool>` after the human confirmed the files it writes; its output as it is.
  private async install(id: setup.Tool): Promise<void> {
    const shell = this.shell();
    const s = this.setup();
    if (shell === null || this.installing || s.have.includes(id) || !s.installable.includes(id)) return this.render();
    const a = setup.adapter(id);
    const ok = await vscode.window.showWarningMessage(`Install the ${a.label} adapter?`, {
      modal: true,
      detail: `./scripts/init ${id} writes ${a.writes.join(', ')}. Files that exist are kept. Nothing is committed.`,
    }, 'Install');
    if (ok !== 'Install') return this.render();
    this.installing = id;
    this.installed = null;
    this.render();
    try {
      const r = await runScript(shell, this.root, 'init', setup.initArgs(id));
      this.installed = { tool: id, written: r.code === 0, code: r.code, text: [r.stdout, r.stderr].map((x) => x.trim()).filter(Boolean).join('\n') };
    } finally {
      this.installing = null;
    }
    await this.refresh();
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

  private readonly memo: vscode.Memento;

  constructor(root: string, status: () => Status | null, shell: () => string | null, refresh: () => Promise<void>, memo: vscode.Memento) {
    this.root = root;
    this.status = status;
    this.shell = shell;
    this.refresh = refresh;
    this.memo = memo;
    // kept alive while hidden: a pasted report and half-written notes survive a tab switch
    this.web = vscode.window.createWebviewPanel('anew.triage', 'ANEW · triage', vscode.ViewColumn.One, { enableScripts: true, localResourceRoots: [], retainContextWhenHidden: true });
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
    const kinds = triageKinds(row);
    this.web.title = `ANEW · ${row.spec} triage`;
    this.web.webview.html = triage.html({
      row, plan: `specs/plans/${row.spec}-plan.md`, kind: this.kind, kinds: kinds.length ? kinds : [this.kind],
      report: this.report, decisions: this.decisions, ...this.state(), result: this.result, agent: agentIn(this.root, this.memo), nonce: randomBytes(16).toString('hex'), cspSource: this.web.webview.cspSource,
    });
  }

  private state(): { preview: triage.Write | null; problems: string[]; shell: boolean; running: boolean } {
    const problems = this.decisions ? triage.problems(this.decisions) : [];
    return { preview: this.decisions && !problems.length ? triage.write(this.decisions, this.context()) : null, problems, shell: this.shell() !== null, running: this.running };
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
    // kept as typed; no redraw under the cursor — the preview and Save follow in place
    if (type === 'input') return void this.web.webview.postMessage({ type: 'update', ...triage.parts(this.state()) });
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
    else if (type === 'copy' || type === 'continue') {
      // the step the screen shows: the answer's, else the review or VERIFY to run first (triage.first)
      const cmd = this.result ? this.result.next : row && this.decisions === null ? nextFor(row) ?? '' : '';
      return nextStep(type, this.root, this.memo, cmd);
    } else if (type === 'save') return this.save();
    this.render();
  }

  // The backlog entries for the defers first (the one file the extension writes itself), then the
  // gate call; a refusal puts the backlog back as it was (triage.withBacklog).
  private async save(): Promise<void> {
    const shell = this.shell();
    const ds = this.decisions;
    if (shell === null || ds === null || this.running || triage.problems(ds).length) return this.render();
    const w = triage.write(ds, this.context());
    const file = path.join(this.root, 'specs', 'backlog.md');
    const io: triage.BacklogIO = {
      read: () => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null),
      write: (t) => fs.writeFileSync(file, t),
      remove: () => fs.rmSync(file, { force: true }),
    };
    this.running = true;
    this.render();
    const spec = this.spec;
    const head = async () => ship.probed(await run('git', ['rev-parse', 'HEAD'], this.root));
    const a = await triage.withBacklog(io, w.entries, async () => {
      const r = await runScript(shell, this.root, 'gate', w.args);
      return answer(r.code, r.stdout, r.stderr);
    }, head);
    this.running = false;
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
function run(cmd: string, args: string[], cwd: string, env: Record<string, string> = {}): Promise<{ code: number; stdout: string; out: string }> {
  return new Promise((resolve) => {
    execFile(cmd, args, { cwd, env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 }, (e, stdout, stderr) => {
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
    if (type === 'copy-cmds' && this.pr) {
      await vscode.env.clipboard.writeText(this.pr.commands.join('\n'));
      void vscode.window.showInformationMessage('Copied the push and PR commands.');
    }
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
