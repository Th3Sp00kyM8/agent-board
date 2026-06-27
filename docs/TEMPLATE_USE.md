# Using Agent Board As A Template

Agent Board is marked as a GitHub template repository. That gives new users a clean starting point without linking their project history to this repo.

## Recommended: Use This Template

Use GitHub's `Use this template` button when you want a new board for a different project.

This is the best option for most users because it:

- Creates a new repository with Agent Board's files
- Keeps your project history separate from Agent Board's history
- Lets you customize the board without opening pull requests back here
- Starts with fake sample data only

After creating the new repository:

```powershell
git clone https://github.com/YOUR-USER/YOUR-BOARD.git
cd YOUR-BOARD
npm install
npm run dev
```

On first run, Agent Board creates ignored local `config.json` and `state.json` files from the committed examples.

## Fork When Contributing Back

Fork this repo if you want to propose changes to Agent Board itself. A fork keeps a visible relationship to the original project and is useful for pull requests.

Use a fork for:

- Bug fixes
- Documentation improvements
- Reusable feature work
- Pull requests back to Agent Board

## Clone When Testing Locally

Clone this repo directly when you only want to try Agent Board locally:

```powershell
git clone https://github.com/Th3Sp00kyM8/agent-board.git
cd agent-board
npm install
npm run dev
```

## Customize A New Board

For a new project board, start with these files:

- `config.example.json` - committed starter labels and project title
- `sample.state.json` - committed fake first-run board data
- `src/App.jsx` - columns, tiers, and display behavior

Your real local files stay ignored by Git:

- `config.json`
- `state.json`
- `backups/`

## Before Sharing Your Customized Board

Run:

```powershell
npm run verify
npm run build
```

Then check:

- `state.json` is not tracked
- `config.json` is not tracked
- `sample.state.json` contains only fake data
- README text matches your new project
