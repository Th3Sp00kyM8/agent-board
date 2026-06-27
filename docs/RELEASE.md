# Release Checklist

Use this checklist before tagging a public release.

## Local Verification

```powershell
npm run release:check
npm run smoke:fresh
```

`release:check` validates the committed sample/config files, builds the app, and runs a dependency audit. `smoke:fresh` copies only tracked files into a temporary folder, runs `npm ci`, verifies the sample project, and builds from that fresh copy.

## Manual Checks

- Start the app with `npm run dev`
- Confirm first-run bootstrap creates ignored `state.json` and `config.json`
- Open Settings and save a test project title/label change
- Confirm Backup creates a timestamped file in ignored `backups/`
- Confirm Export downloads a JSON file
- Confirm Import rejects invalid JSON and accepts a valid export
- Confirm Sync to Chat copies a readable summary
- Confirm README screenshot still matches the app

## GitHub Release

1. Ensure `git status --short` is clean.
2. Create a version tag:

   ```powershell
   git tag v0.1.0
   git push origin HEAD --tags
   ```

3. Confirm GitHub Actions passes on the pushed branch.
4. Draft a GitHub release from `CHANGELOG.md`.
5. Include the screenshot from `assets/screenshots/board-overview.png` in the release notes if GitHub preview needs visual context.

## Do Not Release

Do not release if any of these files contain real project data:

- `state.json`
- `config.json`
- `backups/`
- `.env`
- `*.log`

These files are ignored by Git, but inspect the staged diff before publishing.