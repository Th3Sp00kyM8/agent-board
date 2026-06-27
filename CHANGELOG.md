# Changelog

All notable changes to Agent Board will be documented in this file.

The format is based on Keep a Changelog, and this project uses simple `0.x` versions while the tool is early.

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

### Security

- Documented local-only security model and sensitive local files