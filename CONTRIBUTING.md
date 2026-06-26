# Contributing

Thanks for taking the time to improve Agent Board.

## Project Scope

Agent Board is a local-first planning board backed by JSON files. The project should stay easy to fork, inspect, and run on a developer machine.

Good changes usually fit one of these goals:

- Make first setup easier
- Improve local project customization
- Improve import, export, backup, or recovery behavior
- Keep private project data out of Git
- Improve accessibility, responsiveness, or UI clarity
- Add tests or verification for existing behavior

Out of scope by default:

- Hosted multi-user deployment
- Accounts, authentication, or permissions
- External database requirements
- Telemetry or analytics
- Project-specific sample data

## Development Setup

```powershell
npm install
npm run dev
```

Before opening a pull request, run:

```powershell
npm run build
npm audit --audit-level=moderate
```

## Local Data

Do not commit real `state.json`, `config.json`, `backups/`, logs, or `.env` files. Use `sample.state.json` for fake example data and `config.example.json` for starter config.

To reset your local working data to the sample files:

```powershell
npm run reset:sample
```

## Pull Requests

Keep pull requests focused. Include:

- What changed
- Why it helps users who fork or run the tool locally
- Any manual verification steps you ran
- Screenshots for visible UI changes

## Style Notes

The app is intentionally simple. Prefer readable React, small helpers, and clear JSON over framework churn or broad rewrites.