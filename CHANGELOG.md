# Changelog

All notable changes to Agent Board will be documented in this file.

The format is based on Keep a Changelog, and this project uses simple `0.x` versions while the tool is early.

## [0.22.0] - 2026-06-30

### Added

- Import repair history inside the replacement preview
- Undo repair control for rolling back the most recent import cleanup before replacement

### Changed

- Import repair actions now preserve the previous pending import state for safer review

## [0.21.0] - 2026-06-30

### Added

- Inline search filter for import replacement diff rows
- Changed-field filter for import replacement diff review
- Shown/total counts for added, changed, and removed import diff buckets

### Changed

- Import replacement diff now keeps full diff buckets available behind compact scrolling lists

## [0.20.0] - 2026-06-30

### Added

- Favorite toggle for starter custom markdown export presets
- Local last-used tracking when starter presets are added or reopened

### Changed

- Starter gallery results now sort favorites first, then recently used starters, then default order

## [0.19.0] - 2026-06-30

### Added

- Category filters for starter custom markdown export presets
- Search box for finding starter export presets by label, category, detail, or keywords
- Empty-state message when starter gallery filters have no matches

### Changed

- Starter report templates now carry lightweight category and keyword metadata

## [0.18.0] - 2026-06-30

### Added

- Rendered preview examples for starter custom markdown export presets
- Explicit add action after selecting a starter report preview

### Changed

- Starter gallery tiles now preview report output before adding a custom preset
- Existing starter presets now open the matching editable preset instead of duplicating it

## [0.17.0] - 2026-06-30

### Added

- Starter gallery for adding common custom markdown export presets from Settings
- Executive status, release readiness, risk watch, decision review, and planning intake custom report starters

### Changed

- Custom export preset creation now disables add actions once the six-preset limit is reached
- Custom export preset limits now use one shared limit across manual, imported, and gallery presets

## [0.16.0] - 2026-06-30

### Added

- Copy and download actions for sharing custom markdown export preset bundles
- Import support for custom markdown export preset bundles
- Repair preview rows that show before/after values before applying simple import fixes
- Field-level change details in the import replacement diff

### Changed

- Import review now makes changed paths easier to audit before board replacement
- Custom reporting templates can now move between Agent Board copies without editing config files

## [0.15.0] - 2026-06-28

### Added

- Import replacement diff showing item, risk, decision, dependency, blocked, added, changed, and removed counts before confirmation
- Form-based custom markdown export preset editor in Settings
- One-click import repairs for missing owners, unknown domains, and unknown roadmap stages

### Changed

- Custom export presets can now be added, selected, edited, and deleted without editing raw JSON
- Import dry-run review now flags owner, domain, and roadmap-stage cleanup before replacement

## [0.14.0] - 2026-06-28

### Added

- Import support for shared Project Map view bundles exported from another Agent Board copy
- Custom markdown export presets stored in local config and shown beside built-in export presets
- One-click import preview repair actions for common status and release-tier value mismatches

### Changed

- Settings now includes a JSON editor for custom markdown export templates
- Import preview now recomputes validation after simple repair actions before replacement

## [0.13.0] - 2026-06-28

### Added

- Saved Project Map preset groups for organizing reusable views by focus, review, delivery, or custom workflows
- Copy and download actions for sharing saved Project Map view bundles
- Support review, audit prep, and planning summary markdown export presets
- Import preview fix suggestions for missing required fields, duplicate identifiers, unknown columns, unknown release tiers, and custom fields

### Changed

- Saved Project Map preset editing now includes group assignment
- Import dry-run review now pairs warnings with practical remediation guidance

## [0.12.0] - 2026-06-28

### Added

- Rename controls for saved Project Map presets after creation
- Stakeholder, weekly update, and release review markdown export presets
- Import dry-run warnings that explain alias-mapped column and release-tier mismatches

### Changed

- Export presets now cover chat handoff, risk review, decision log, roadmap, stakeholder, weekly, and release-review workflows
- Import preview warnings now include expected values when mapped fields still need cleanup

## [0.11.0] - 2026-06-28

### Added

- Named Project Map filter presets with local reorder controls
- Downloadable `.md` files for markdown export presets
- Import alias presets for Default, GitHub Issues, Jira, and Linear schemas

### Changed

- Project Map saved views can now be named before saving
- Export preset workflow now supports both clipboard copy and markdown file download

## [0.10.0] - 2026-06-28

### Added

- Saved Project Map filter presets stored locally in the browser
- Markdown export presets for sync handoff, risk review, decision log, and roadmap summary
- Configurable import field aliases in Settings, saved to local `config.json`

### Changed

- Export modal now switches between focused markdown presets before copying
- Settings modal now documents and edits import alias mappings for custom board schemas

## [0.9.0] - 2026-06-27

### Added

- Keyboard-selected command palette results with ArrowUp, ArrowDown, Home, End, and Enter support
- Import field mapping for common custom schema names such as status, priority, assignee, dependsOn, and risk
- Project Map filters for domain, owner, and roadmap stage

### Changed

- Import preview now reports recognized field mappings before replacement
- Project Map dependency, blocker, missing-link, domain, and roadmap counts now reflect active map filters

## [0.8.0] - 2026-06-27

### Added

- Grouped and fuzzy-ranked command palette results for faster command discovery
- Arrow-key focus navigation between visible cards and columns without moving work
- Import dry-run validation for missing required fields, duplicate identifiers, unknown columns, unknown release tiers, and custom fields

### Changed

- Import replacement is blocked when dry-run validation finds structural errors
- Updated README docs for command ranking, keyboard navigation, and import dry-run validation

## [0.7.0] - 2026-06-27

### Added

- Recent command shortcuts inside the command palette
- Configurable command-palette shortcut in Settings, stored locally per browser
- Import preview modal with current-vs-incoming counts, column distribution, warnings, and incoming item sample
- Undo snapshot when imported board data replaces the current board

### Changed

- Updated README docs for local command preferences and safer import review

## [0.6.0] - 2026-06-27

### Added

- Command palette opened from `Ctrl+K` / `Cmd+K` or the header `Commands` button
- Command results for adding work, templates, filters, blocked work, risks, sync, export, backup, settings, reset, and item jump
- Keyboard card controls: Enter opens a card, Space selects it, and Alt+Arrow Left/Right moves it across columns
- Focus trapping for the command palette, template chooser, settings modal, item detail modal, and item editor

### Changed

- Updated README docs around keyboard workflow and command access

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
