# Changelog

All notable changes to Agent Board will be documented in this file.

The format is based on Keep a Changelog, and this project uses simple `0.x` versions while the tool is early.

## [0.5.0] - 2026-06-27

### Added

- Start Here checklist in the Focus Dashboard so new users can complete the first setup actions without reading docs
- Undo snackbar for moves, bulk updates, deletes, resets, and template application
- Visible keyboard focus styles across buttons, inputs, selects, and textareas

### Changed

- Simplified the item editor into an essentials-first form with advanced planning fields behind a disclosure control
- Updated README docs for instant-usability workflow improvements

## [0.4.0] - 2026-06-27

### Added

- First-run template chooser for blank, demo, software project, creator launch, research project, and operations tracker boards
- Header `Templates` action so users can switch starter workflows after setup
- Template previews with item, blocked, and decision counts before applying

### Changed

- Blank and demo boards now prompt users toward a clearer starting workflow without interrupting existing real boards
- Updated README docs for templates and first-run setup

## [0.3.0] - 2026-06-27

### Added

- Focus Dashboard above the board for attention items, blockers, next work, risks, decisions, and roadmap load
- Clickable dashboard lists that open the underlying work item from the summary layer

### Changed

- Reworked the Project Map into a secondary summary beside the dashboard so the first screen reads as action-first instead of metadata-first
- Updated README feature docs around the first-screen UX

## [0.2.1] - 2026-06-27

### Added

- Board state metadata with `app`, `schemaVersion`, and export `version` fields
- Import compatibility warnings for legacy arrays, missing schema metadata, different app ids, and newer schema versions
- Server-side state normalization so saved boards keep schema metadata

### Changed

- Documented state schema metadata for template users and forks

## [0.2.0] - 2026-06-27

### Added

- Project Map panel for dependency tracing, risk register, roadmap stages, decisions, domains, and owners
- Item metadata fields for dependencies, domain, risk level, roadmap stage, decision state, and owner
- Sync-to-Chat export sections for dependency blockers, risks, decisions, roadmap, and domain counts
- Sample-data and verification coverage for the new project-management fields

### Changed

- Expanded template documentation for adapting Agent Board beyond basic kanban tracking

## [0.1.1] - 2026-06-27

### Added

- Public repository metadata, README badges, and clone-first setup instructions
- GitHub template repository guidance for new project boards
- Community support docs, code of conduct, and roadmap
- Dependabot automation for npm and GitHub Actions maintenance

### Changed

- Updated GitHub Actions versions to current releases
- Configured Dependabot to use the public npm registry

## [0.1.0] - 2026-06-26

### Added

- Standalone Agent Board app separated from its original project repo
- Local-first React + Vite UI with Express JSON-file backend
- Fake `sample.state.json` for first-run demo data
- `config.example.json` and ignored local `config.json`
- Ignored local `state.json`, `backups/`, `dist/`, and `node_modules/`
- Configurable project title and visible workstream/cycle labels
- `npm run reset:sample` to restore local demo data after backing up current local files
- Open-source support docs, issue templates, and contribution guidance
- `npm run verify` for sample/config validation and local-only file checks
- GitHub Actions CI for verify, build, and dependency audit
- In-app Settings modal for editing local project title and labels
- README screenshot and release checklist
- Fresh-copy smoke test for release validation
- Repository editor/line-ending defaults and publishing guide

### Security

- Documented local-only security model and sensitive local files
