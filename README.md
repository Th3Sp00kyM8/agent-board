# Agent Board

Agent Board is a local-first kanban board for coordinating human and AI project work. It runs on your machine, stores state in plain JSON, and includes a chat-friendly summary export for handoffs to assistants or teammates.

It is designed for private project planning, not as a hosted multi-user service.

## Features

- Local kanban board with To Do, Doing, In Review, Blocked, and Done columns
- Tiered sections for Core Release, Post Release, and Future Content
- Configurable project title and visible labels for workstreams and cycles
- Sprint board for last/current/next cycle notes
- One-click "Sync to Chat" summary copied to your clipboard
- JSON export/import for full-state handoff or migration
- Timestamped backups under `backups/`
- File-backed state that is easy to inspect, version separately, or restore

## Quick Start

```powershell
npm install
npm run dev
```

The dev command starts:

- Vite UI: `http://localhost:5173`
- Express API: `http://localhost:5174`

If the browser does not open automatically, navigate to `http://localhost:5173`.

To run beside another local app, override ports before starting:

```powershell
$env:AGENT_BOARD_UI_PORT=5273
$env:AGENT_BOARD_API_PORT=5274
npm run dev
```

## First Run

On first run, the server creates local files from the committed examples:

- `config.example.json` -> `config.json`
- `sample.state.json` -> `state.json`

The generated `config.json`, `state.json`, and `backups/` folder are ignored by Git. They are your local working data.

## Local Files

Committed starter files:

- `sample.state.json` - fake demo board used for first-run bootstrap
- `config.example.json` - starter project-name and label config

Local ignored files:

- `state.json` - your real board data
- `config.json` - your local project config
- `backups/` - timestamped backup files

This separation keeps the app reusable while keeping real project data out of Git.

## Customizing For Your Project

Start the app once, then edit `config.json`:

```json
{
  "projectName": "Website Redesign Board",
  "labels": {
    "workstream": "Area",
    "cycle": "Milestone"
  }
}
```

Refresh the browser after editing. `projectName` changes the app title. `labels.workstream` and `labels.cycle` update visible UI labels and the Sync to Chat summary.

For deeper changes, edit `src/App.jsx` constants such as columns, tiers, and source legend. Those are intentionally small and near the top of the file.

## Resetting The Demo Data

To return local data to the committed examples:

```powershell
npm run reset:sample
```

This backs up existing `state.json` and `config.json` into `backups/`, then restores them from `sample.state.json` and `config.example.json`.

## Backups

Click `Backup` in the header to create a timestamped copy of `state.json` in `backups/`. Both `state.json` and `backups/` are ignored by Git.

## Import And Export

Use `Export` to download a full JSON copy of the board. Use `Import` to replace the current local board with a compatible JSON file. Create a backup first if the current board matters.

## Chat Handoffs

Use `Sync to Chat` to copy a compact status summary. It includes counts, cycle notes, active work, blocked work, recent completions, and top unblocked tasks.

For a complete handoff, use `Export` and share the downloaded JSON file.

## Security Model

Agent Board is an unauthenticated localhost tool. Do not expose ports `5173` or `5174` to a network you do not trust.

## Project Docs

- [Adapting Agent Board For Your Project](docs/ADAPTING.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Development

```powershell
npm run verify
npm run build
npm run preview
```

The app is intentionally simple: React + Vite frontend, Express backend, JSON files on disk.

GitHub Actions runs `npm ci`, `npm run verify`, `npm run build`, and `npm audit --audit-level=moderate` on pushes and pull requests.
