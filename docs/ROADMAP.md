# Roadmap

Agent Board is intentionally small and local-first. The goal is to stay easy to fork, template, and adapt.

## Current Focus

- Keep first-run and early-use setup simple for template users
- Keep the editing flow essentials-first, with advanced fields available on demand
- Keep keyboard-driven workflows fast while keeping local preferences out of project data
- Keep sample data fake and generic
- Improve import/export reliability and pre-replacement review
- Improve documentation for adapting columns, tiers, labels, and project-map domains
- Keep dependency and GitHub Actions maintenance automated

## Likely Improvements

- More template presets and template customization controls
- Command palette grouping and fuzzy scoring improvements
- Deeper keyboard-only board navigation between cards and columns
- Import dry-run validation for custom schema changes
- Dependency graph filtering by domain, owner, and roadmap stage
- Export presets for risk reviews, decision logs, and roadmap planning
- Better validation messages for imported JSON files
- More sample board presets for common workflows
- Search and filter controls for larger boards
- Optional archived-item view

## Non-Goals

- Hosted multi-user service
- User accounts or authentication
- Cloud sync
- Project-specific private workflow logic in the upstream template
- Heavy database setup

## How To Propose Changes

Open an issue before large feature work. Small docs fixes and focused bug fixes can go straight to a pull request.
