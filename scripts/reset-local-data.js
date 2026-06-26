import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(path.dirname(__filename));
const backupDir = path.join(root, 'backups');
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

const pairs = [
  ['state.json', 'sample.state.json'],
  ['config.json', 'config.example.json'],
];

if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

for (const [targetName, sampleName] of pairs) {
  const target = path.join(root, targetName);
  const sample = path.join(root, sampleName);
  if (!fs.existsSync(sample)) throw new Error(`Missing ${sampleName}`);
  if (fs.existsSync(target)) {
    fs.copyFileSync(target, path.join(backupDir, `${targetName}.${stamp}.bak`));
  }
  fs.copyFileSync(sample, target);
  console.log(`Reset ${targetName} from ${sampleName}`);
}

console.log(`Previous local files, if present, were backed up in ${backupDir}`);
