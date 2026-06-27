# Publishing Guide

This guide is for turning the local Agent Board repository into a public GitHub repository.

## 1. Pick Repository Settings

Recommended GitHub fields:

- Repository name: `agent-board`
- Description: `Local-first kanban board for coordinating human and AI project work.`
- Website: leave blank unless you deploy docs later
- Topics: `kanban`, `local-first`, `project-management`, `ai-workflow`, `planning`, `react`, `vite`
- Visibility: public if you are ready for others to fork it
- Enable `Template repository` in repository settings if you want others to create clean project boards from it

## 2. Check The Local Repo

Run this before creating the remote:

```powershell
npm run release:check
npm run smoke:fresh
git status --short
```

The status output should be empty.

## 3. Create The GitHub Repo

Create an empty GitHub repository without adding a README, license, or `.gitignore`. This repo already has those files.

Then connect and push from PowerShell:

```powershell
git remote add origin https://github.com/YOUR-USER/agent-board.git
git push -u origin HEAD
```

`HEAD` pushes whichever branch you are currently on, so this works whether the local branch is `master`, `main`, or a renamed branch.

## 4. Optional: Rename The Default Branch

If you want the local branch to be `main` before pushing:

```powershell
git branch -m main
git push -u origin main
```

If you already pushed `master`, rename the default branch in GitHub repository settings before deleting any remote branch.

## 5. Confirm GitHub Actions

After the first push, open the Actions tab and confirm CI passes. The workflow runs:

```powershell
npm ci
npm run verify
npm run build
npm audit --audit-level=moderate
```

## 6. Create The First Release

After CI passes:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

Draft the GitHub release from `CHANGELOG.md` and include the README screenshot if useful.

## 7. Maintenance Rhythm

For small open-source maintenance, keep this loop simple:

- Use issues for bugs or ideas
- Keep sample data fake and generic
- Run `npm run release:check` before merging changes
- Run `npm run smoke:fresh` before tagging releases
- Update `CHANGELOG.md` before each release
