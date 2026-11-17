import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findShell } from '../src/shell.ts';

const has = (...files: string[]) => (f: string) => files.includes(f);

test('the setting wins when the file exists, and is not replaced when it does not', () => {
  assert.equal(findShell({ setting: 'D:\\tools\\sh.exe', platform: 'win32', pathEnv: '', exists: has('D:\\tools\\sh.exe') }), 'D:\\tools\\sh.exe');
  assert.equal(findShell({ setting: '/opt/sh', platform: 'linux', pathEnv: '/bin', exists: has('/bin/sh') }), null);
});

test('Linux and macOS: sh from PATH', () => {
  assert.equal(findShell({ setting: '', platform: 'linux', pathEnv: '/usr/local/bin:/bin', exists: has('/bin/sh') }), '/bin/sh');
  assert.equal(findShell({ setting: '', platform: 'darwin', pathEnv: '/usr/bin', exists: has() }), null);
});

test('Windows: bash.exe next to the git on PATH (cmd, bin and mingw64 layouts)', () => {
  const root = 'C:\\Program Files\\Git';
  const bash = `${root}\\bin\\bash.exe`;
  for (const dir of [`${root}\\cmd`, `${root}\\bin`, `${root}\\mingw64\\bin`]) {
    const exists = has(`${dir}\\git.exe`, bash);
    assert.equal(findShell({ setting: '', platform: 'win32', pathEnv: `C:\\Windows;${dir}`, exists }), bash, dir);
  }
});

test('Windows without Git for Windows: no shell', () => {
  assert.equal(findShell({ setting: '', platform: 'win32', pathEnv: 'C:\\Windows;C:\\other', exists: has('C:\\other\\git.exe') }), null);
});
