import fs from 'fs';
import os from 'os';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(path.dirname(__filename));
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-board-smoke-'));
const copyRoot = path.join(tmpRoot, 'agent-board');
const npmCommand = 'npm';

function run(command, args, cwd) {
  console.log(`> ${[command, ...args].join(' ')}`);
  if (process.platform === 'win32') {
    execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', [command, ...args].join(' ')], { cwd, stdio: 'inherit' });
    return;
  }
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function copyTrackedFiles() {
  fs.mkdirSync(copyRoot, { recursive: true });
  const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);

  for (const relativePath of trackedFiles) {
    const source = path.join(root, relativePath);
    const target = path.join(copyRoot, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

try {
  copyTrackedFiles();
  run(npmCommand, ['ci', '--ignore-scripts'], copyRoot);
  run(npmCommand, ['run', 'verify'], copyRoot);
  run(npmCommand, ['run', 'build'], copyRoot);
  console.log(`Fresh-copy smoke passed in ${copyRoot}`);
} finally {
  if (process.env.AGENT_BOARD_KEEP_SMOKE_DIR !== '1') {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } else {
    console.log(`Kept smoke directory: ${copyRoot}`);
  }
}
