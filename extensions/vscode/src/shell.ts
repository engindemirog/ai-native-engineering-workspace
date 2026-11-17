// Finds the POSIX shell the scripts need and runs one script with it. The scripts are POSIX sh
// (docs/commands.md): sh on Linux and macOS, Git for Windows' bash.exe on Windows.
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';

export interface ShellQuery {
  setting: string;
  platform: NodeJS.Platform;
  pathEnv: string;
  exists?: (file: string) => boolean;
}

export function findShell(q: ShellQuery): string | null {
  const exists = q.exists ?? existsSync;
  const setting = q.setting.trim();
  if (setting) return exists(setting) ? setting : null;
  const win = q.platform === 'win32';
  const p = win ? path.win32 : path.posix;
  const dirs = q.pathEnv.split(win ? ';' : ':').filter((d) => d.trim() !== '');
  if (!win) {
    for (const d of dirs) if (exists(p.join(d, 'sh'))) return p.join(d, 'sh');
    return null;
  }
  // Git for Windows: <root>\cmd\git.exe (the installer's PATH entry), <root>\bin\git.exe or
  // <root>\mingw64\bin\git.exe; bash.exe lives in <root>\bin.
  for (const d of dirs) {
    if (!exists(p.join(d, 'git.exe'))) continue;
    for (const root of [p.dirname(d), d, p.dirname(p.dirname(d))]) {
      const bash = p.join(root, 'bin', 'bash.exe');
      if (exists(bash)) return bash;
    }
    if (exists(p.join(d, 'bash.exe'))) return p.join(d, 'bash.exe');
  }
  return null;
}

export interface Run {
  code: number;
  stdout: string;
  stderr: string;
}

// Runs `<shell> scripts/<script> <args…>` in the workspace root. No command string: the
// arguments reach the script as they are.
export function runScript(shell: string, root: string, script: string, args: string[]): Promise<Run> {
  return new Promise((resolve) => {
    execFile(shell, [`scripts/${script}`, ...args], { cwd: root, maxBuffer: 16 * 1024 * 1024, windowsHide: true },
      (err, stdout, stderr) => {
        const code = err === null ? 0 : typeof err.code === 'number' ? err.code : 127;
        resolve({ code, stdout: String(stdout), stderr: err !== null && typeof err.code !== 'number' && !stderr ? err.message : String(stderr) });
      });
  });
}
