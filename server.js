// Agent Board backend
// Serves local state/config JSON from disk. State writes use temp-file + rename.
// Endpoints:
//   GET  /api/state          -> { items: [...], sprintBoard: {...} }
//   PUT  /api/state          -> overwrites entire state
//   GET  /api/config         -> local project configuration
//   PUT  /api/config         -> overwrites local project configuration
//   GET  /api/health         -> { ok: true, statePath, configPath, fileSize }
//   GET  /api/backups        -> [{ name, mtime, size }, ...]
//   POST /api/backup         -> creates timestamped backup file

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.AGENT_BOARD_API_PORT || 5174);
const STATE_FILE = path.join(__dirname, 'state.json');
const CONFIG_FILE = path.join(__dirname, 'config.json');
const SAMPLE_STATE_FILE = path.join(__dirname, 'sample.state.json');
const SAMPLE_CONFIG_FILE = path.join(__dirname, 'config.example.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

function writeJsonAtomic(filePath, data) {
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filePath);
}

function copyOrCreate(targetPath, samplePath, fallbackData, label) {
  if (fs.existsSync(targetPath)) return;
  if (fs.existsSync(samplePath)) {
    fs.copyFileSync(samplePath, targetPath);
    console.log(`[server] Bootstrapped ${path.basename(targetPath)} from ${path.basename(samplePath)}`);
    return;
  }
  writeJsonAtomic(targetPath, fallbackData);
  console.log(`[server] Created default ${label}`);
}

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

copyOrCreate(CONFIG_FILE, SAMPLE_CONFIG_FILE, {
  projectName: 'Agent Board',
  labels: { workstream: 'Workstream', cycle: 'Sprint' }
}, 'config.json');

copyOrCreate(STATE_FILE, SAMPLE_STATE_FILE, {
  items: [],
  sprintBoard: {}
}, 'state.json');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Local dev convenience only. Do not expose this server to an untrusted network.
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/api/health', (req, res) => {
  try {
    const stat = fs.statSync(STATE_FILE);
    res.json({
      ok: true,
      statePath: STATE_FILE,
      configPath: CONFIG_FILE,
      fileSize: stat.size,
      lastModified: stat.mtime,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/config', (req, res) => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error('[server] GET /api/config failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Body must be a configuration object' });
    }
    writeJsonAtomic(CONFIG_FILE, body);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[server] PUT /api/config failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/state', (req, res) => {
  try {
    const raw = fs.readFileSync(STATE_FILE, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    console.error('[server] GET /api/state failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/state', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Body must be an object with items + sprintBoard' });
    }
    if (!Array.isArray(body.items)) {
      return res.status(400).json({ error: 'items must be an array' });
    }
    writeJsonAtomic(STATE_FILE, body);
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[server] PUT /api/state failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const stat = fs.statSync(path.join(BACKUP_DIR, f));
        return { name: f, mtime: stat.mtime, size: stat.size };
      })
      .sort((a, b) => b.mtime - a.mtime);
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup', (req, res) => {
  try {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `state_${ts}.json`);
    fs.copyFileSync(STATE_FILE, backupPath);
    res.json({ ok: true, backupPath, name: path.basename(backupPath) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[server] Agent Board backend running on http://localhost:${PORT}`);
  console.log(`[server] State file: ${STATE_FILE}`);
  console.log(`[server] Config file: ${CONFIG_FILE}`);
  console.log(`[server] Backups dir: ${BACKUP_DIR}`);
});
