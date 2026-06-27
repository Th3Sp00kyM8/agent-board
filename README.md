# Agent Board

[![CI](https://github.com/Th3Sp00kyM8/agent-board/actions/workflows/ci.yml/badge.svg)](https://github.com/Th3Sp00kyM8/agent-board/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/Th3Sp00kyM8/agent-board)](https://github.com/Th3Sp00kyM8/agent-board/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Agent Board is a local-first kanban board for coordinating human and AI project work. It runs on your machine, stores state in plain JSON, and includes a chat-friendly summary export for handoffs to assistants or teammates.

It is designed for private project planning, not as a hosted multi-user service.

![Agent Board overview](assets/screenshots/board-overview.png)

## Features

- Local kanban board with To Do, Doing, In Review, Blocked, and Done columns
- Tiered sections for Core Release, Post Release, and Future Content
- Configurable project title and visible labels for workstreams and cycles
- Sprint board for last/current/next cycle notes
- Project Map panel for dependency tracing, open risks, roadmap stages, decisions, owners, and domains
- One-click "Sync to Chat" summary copied to your clipboard
- JSON export/import for full-state handoff or migration
- Timestamped backups under `backups/`
- File-backed state that is easy to inspect, version separately, or restore

## Quick Start

```powershell
git clone https://github.com/Th3Sp00kyM8/agent-board.git
cd agent-board
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

## Use As A Template

On GitHub, click `Use this template` to create a new project board from Agent Board without linking your new repository history to this repo. Use a fork only when you want to contribute changes back here.

See [Using Agent Board As A Template](docs/TEMPLATE_USE.md) for the recommended paths.

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

Click `Settings` in the header to edit the local project title, work item label, and cycle label. Settings are saved to ignored local `config.json` so forks can keep reusable defaults in Git while each user keeps private local wording on their machine.

You can also edit `config.json` directly after first run:

```json
{
  "projectName": "Website Redesign Board",
  "labels": {
    "workstream": "Area",
    "cycle": "Milestone"
  }
}
```

Refresh the browser after direct file edits. `projectName` changes the app title. `labels.workstream` and `labels.cycle` update visible UI labels and the Sync to Chat summary.

For deeper changes, edit `src/App.jsx` constants such as columns, tiers, source legend, project domains, roadmap stages, risk levels, and decision states. Those are intentionally small and near the top of the file.

## Resetting The Demo Data

To return local data to the committed examples:

```powershell
npm run reset:sample
```

This backs up existing `state.json` and `config.json` into `backups/`, then restores them from `sample.state.json` and `config.example.json`.

## Backups

Click `Backup` in the header to create a timestamped copy of `state.json` in `backups/`. Both `state.json` and `backups/` are ignored by Git.

## Import And Export

Use `Export` to download a full JSON copy of the board. Exports include `app`, `schemaVersion`, and `version` metadata so future forks can identify compatible board files. Use `Import` to replace the current local board with a compatible JSON file. Agent Board still accepts older item-array exports, adds current metadata on save, and warns before importing unknown newer schemas. Create a backup first if the current board matters.

## Project Map

The Project Map is a compact planning layer above the board. Each item can carry a domain, owner, dependency list, risk level, roadmap stage, and decision state. Dependencies can point to another item by `id`, visible path such as `A`, or exact title. The panel then highlights unfinished dependency blockers, missing links, open risks, roadmap distribution, and pending decisions.

These fields are intentionally generic so forks can rename them for software work, content planning, operations, research, or other project-management workflows without needing private data in the upstream template.

## Chat Handoffs

Use `Sync to Chat` to copy a compact status summary. It includes counts, cycle notes, active work, blocked work, recent completions, dependency blockers, open risks, decisions, roadmap stages, domains, and top unblocked tasks.

For a complete handoff, use `Export` and share the downloaded JSON file.

## Security Model

Agent Board is an unauthenticated localhost tool. Do not expose ports `5173` or `5174` to a network you do not trust.

## Project Docs

- [Using Agent Board As A Template](docs/TEMPLATE_USE.md)
- [Adapting Agent Board For Your Project](docs/ADAPTING.md)
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [Support](SUPPORT.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Release Checklist](docs/RELEASE.md)
- [Publishing Guide](docs/PUBLISHING.md)

## Development

```powershell
npm run verify
npm run build
npm run release:check
npm run smoke:fresh
```

The app is intentionally simple: React + Vite frontend, Express backend, JSON files on disk.

GitHub Actions runs `npm ci`, `npm run verify`, `npm run build`, and `npm audit --audit-level=moderate` on pushes and pull requests.
