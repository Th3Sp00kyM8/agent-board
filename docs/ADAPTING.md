# Adapting Agent Board For Your Project

This guide is for people who fork or copy Agent Board and want to make it useful for their own work quickly.

## 1. Start With Local Config

Run the app once:

```powershell
npm install
npm run dev
```

Then edit `config.json`. This file is ignored by Git, so it is safe for your local project name and labels.

```json
{
  "projectName": "Website Redesign Board",
  "labels": {
    "workstream": "Area",
    "cycle": "Milestone"
  }
}
```

Use this for simple language changes before editing source code.

## 2. Replace The Sample Data

Keep `sample.state.json` fake and safe to share. It should show the shape of a useful board without exposing real work.

A good sample board has:

- A few items in each column
- At least one blocked item
- At least one completed item
- A mix of severity and size values
- Generic examples that do not mention a private client, employer, repository, product, or secret

After changing `sample.state.json`, run:

```powershell
npm run reset:sample
npm run build
```

## 3. Change Workflow Terms

For basic wording, use `config.json`.

For deeper workflow changes, edit constants near the top of `src/App.jsx`:

- `COLUMNS` for board columns
- `RELEASE_TIERS` for tier sections
- `SOURCE_OPTIONS` for item source labels
- `DEFAULT_SPRINT_BOARD` for default cycle notes
- `DEFAULT_APP_CONFIG` for starter labels

Keep these changes small and easy to review.

## 4. Keep Private Data Out Of Git

These files are intentionally local-only:

- `state.json`
- `config.json`
- `backups/`
- `.env`
- `*.log`

If you need to share a board, use Export from the app and inspect the JSON before sending it.

## 5. Rename The Project

If your fork becomes a different public tool, update:

- `README.md`
- `package.json`
- `config.example.json`
- `index.html`
- Any screenshots or documentation

Keep the license and contributor attribution intact unless you choose a different license for your own original changes.

## 6. Before Publishing A Fork

Run:

```powershell
npm run build
npm audit --audit-level=moderate
git status --short
```

Also search for private names before pushing:

```powershell
rg -n "client|secret|token|password|internal|private" .
```

Review any hits manually. Some words may be harmless, but real secrets or private project names should not ship.