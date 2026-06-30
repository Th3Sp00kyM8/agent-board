import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(path.dirname(__filename));

const appId = 'agent-board';
const stateSchemaVersion = 2;
const stateVersion = 'agent-board-state-v2';
const columns = ['To Do', 'Doing', 'In Review', 'Blocked', 'Done'];
const severities = ['Critical', 'High', 'Medium', 'Low'];
const sizes = ['S', 'M', 'L', 'XL'];
const tiers = ['core_release', 'post_release', 'future_content'];
const domains = ['Delivery', 'Dependency', 'Risk', 'Roadmap', 'Decision', 'Research', 'Design', 'Engineering', 'QA', 'Operations', 'Documentation', 'Stakeholder'];
const roadmapStages = ['Now', 'Next', 'Later', 'Backlog'];
const riskLevels = ['None', 'Low', 'Medium', 'High', 'Critical'];
const decisionStates = ['None', 'Proposed', 'Accepted', 'Rejected', 'Deferred'];
const requiredItemFields = [
  'id', 'path', 'title', 'description', 'column', 'severity', 'size', 'source',
  'releaseTier', 'candidateRound', 'actualRound', 'reserved', 'notes',
  'domain', 'dependencies', 'riskLevel', 'roadmapStage', 'decisionStatus', 'owner',
  'createdAt', 'updatedAt', 'columnEnteredAt',
];
const localOnlyFiles = ['state.json', 'config.json', 'backups/', '.env'];
const ignoredPatterns = ['node_modules/', 'dist/', 'state.json', 'config.json', 'backups/', '*.log'];
const sampleDenylist = [
  'tacticus', 'tactgame', 'c:\\projects', 'password', 'api key', 'api_key',
  'access token', 'private key', 'client secret', 'bearer ',
];

const errors = [];

function fail(message) {
  errors.push(message);
}

function expect(condition, message) {
  if (!condition) fail(message);
}

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value) {
  return value === null || typeof value === 'string';
}

function isIsoDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function gitTrackedFiles() {
  try {
    return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split(/\r?\n/)
      .filter(Boolean)
      .map((file) => file.replace(/\\/g, '/'));
  } catch {
    return null;
  }
}

function verifyPackage() {
  const pkg = readJson('package.json');
  if (!pkg) return;
  expect(pkg.name === 'agent-board', 'package.json name should be agent-board.');
  expect(pkg.license === 'MIT', 'package.json should declare the MIT license.');
  expect(pkg.type === 'module', 'package.json should use ESM via type=module.');
  expect(isNonEmptyString(pkg.description), 'package.json should include a description.');
  expect(pkg.homepage === 'https://github.com/Th3Sp00kyM8/agent-board#readme', 'package.json should include the public repository homepage.');
  expect(pkg.repository && pkg.repository.url === 'git+https://github.com/Th3Sp00kyM8/agent-board.git', 'package.json should include the public repository URL.');
  expect(pkg.bugs && pkg.bugs.url === 'https://github.com/Th3Sp00kyM8/agent-board/issues', 'package.json should include the public issue tracker URL.');
  expect(pkg.engines && isNonEmptyString(pkg.engines.node), 'package.json should declare a Node engine.');
  for (const scriptName of ['dev', 'build', 'preview', 'reset:sample', 'verify', 'release:check', 'smoke:fresh']) {
    expect(pkg.scripts && isNonEmptyString(pkg.scripts[scriptName]), `package.json is missing script: ${scriptName}`);
  }
}

function verifyConfig() {
  const config = readJson('config.example.json');
  if (!config) return;
  expect(isNonEmptyString(config.projectName), 'config.example.json projectName must be a non-empty string.');
  expect(config.labels && isNonEmptyString(config.labels.workstream), 'config.example.json labels.workstream must be a non-empty string.');
  expect(config.labels && isNonEmptyString(config.labels.cycle), 'config.example.json labels.cycle must be a non-empty string.');
  expect(config.importFieldAliases && Array.isArray(config.importFieldAliases.owner), 'config.example.json should include importFieldAliases.');
  expect(Array.isArray(config.exportPresets) && config.exportPresets.length > 0, 'config.example.json should include custom exportPresets.');
  expect(isNonEmptyString(config.exportPresets[0].template), 'config.example.json custom export preset should include a template.');
}

function verifySampleState() {
  const state = readJson('sample.state.json');
  if (!state) return;

  expect(state.app === appId, `sample.state.json app must be ${appId}.`);
  expect(state.schemaVersion === stateSchemaVersion, `sample.state.json schemaVersion must be ${stateSchemaVersion}.`);
  expect(state.version === stateVersion, `sample.state.json version must be ${stateVersion}.`);
  expect(Array.isArray(state.items), 'sample.state.json items must be an array.');
  expect(state.sprintBoard && typeof state.sprintBoard === 'object', 'sample.state.json must include sprintBoard.');
  if (!Array.isArray(state.items)) return;

  expect(state.items.length >= 5, 'sample.state.json should include at least five demo items.');
  const ids = new Set();
  const presentColumns = new Set();
  let blockedCount = 0;
  let doneCount = 0;
  let reservedCount = 0;
  let dependencyCount = 0;
  let openRiskCount = 0;
  let roadmapPlanningCount = 0;
  let decisionCount = 0;
  const presentDomains = new Set();
  const dependencyKeys = new Set();
  for (const item of state.items) {
    if (!item || typeof item !== 'object') continue;
    for (const key of [item.id, item.path, item.title]) {
      if (isNonEmptyString(key)) dependencyKeys.add(key.toLowerCase());
    }
  }

  for (const [index, item] of state.items.entries()) {
    const label = item && item.id ? item.id : `item at index ${index}`;
    expect(item && typeof item === 'object' && !Array.isArray(item), `${label} must be an object.`);
    if (!item || typeof item !== 'object') continue;

    for (const field of requiredItemFields) {
      expect(Object.prototype.hasOwnProperty.call(item, field), `${label} is missing field: ${field}`);
    }

    expect(isNonEmptyString(item.id), `${label} id must be a non-empty string.`);
    expect(!ids.has(item.id), `Duplicate sample item id: ${item.id}`);
    ids.add(item.id);

    expect(isNonEmptyString(item.path), `${label} path must be a non-empty string.`);
    expect(isNonEmptyString(item.title), `${label} title must be a non-empty string.`);
    expect(isNonEmptyString(item.description), `${label} description must be a non-empty string.`);
    expect(columns.includes(item.column), `${label} column must be one of: ${columns.join(', ')}.`);
    expect(severities.includes(item.severity), `${label} severity must be one of: ${severities.join(', ')}.`);
    expect(sizes.includes(item.size), `${label} size must be one of: ${sizes.join(', ')}.`);
    expect(isNonEmptyString(item.source), `${label} source must be a non-empty string.`);
    expect(tiers.includes(item.releaseTier), `${label} releaseTier must be one of: ${tiers.join(', ')}.`);
    expect(domains.includes(item.domain), `${label} domain must be one of: ${domains.join(', ')}.`);
    expect(Array.isArray(item.dependencies), `${label} dependencies must be an array.`);
    if (Array.isArray(item.dependencies)) {
      for (const dependency of item.dependencies) {
        expect(isNonEmptyString(dependency), `${label} dependencies must only contain non-empty strings.`);
        if (isNonEmptyString(dependency)) {
          dependencyCount += 1;
          expect(dependencyKeys.has(dependency.toLowerCase()), `${label} dependency '${dependency}' should match another item id, path, or title.`);
        }
      }
    }
    expect(riskLevels.includes(item.riskLevel), `${label} riskLevel must be one of: ${riskLevels.join(', ')}.`);
    expect(roadmapStages.includes(item.roadmapStage), `${label} roadmapStage must be one of: ${roadmapStages.join(', ')}.`);
    expect(decisionStates.includes(item.decisionStatus), `${label} decisionStatus must be one of: ${decisionStates.join(', ')}.`);
    expect(typeof item.owner === 'string', `${label} owner must be a string.`);
    expect(isNullableString(item.candidateRound), `${label} candidateRound must be a string or null.`);
    expect(isNullableString(item.actualRound), `${label} actualRound must be a string or null.`);
    expect(typeof item.reserved === 'boolean', `${label} reserved must be a boolean.`);
    expect(typeof item.notes === 'string', `${label} notes must be a string.`);
    expect(isIsoDate(item.createdAt), `${label} createdAt must be parseable ISO-like text.`);
    expect(isIsoDate(item.updatedAt), `${label} updatedAt must be parseable ISO-like text.`);
    expect(isIsoDate(item.columnEnteredAt), `${label} columnEnteredAt must be parseable ISO-like text.`);

    presentColumns.add(item.column);
    presentDomains.add(item.domain);
    if (item.riskLevel !== 'None') openRiskCount += 1;
    if (item.roadmapStage !== 'Now') roadmapPlanningCount += 1;
    if (item.decisionStatus !== 'None') decisionCount += 1;
    if (item.column === 'Blocked') blockedCount += 1;
    if (item.column === 'Done') doneCount += 1;
    if (item.reserved) reservedCount += 1;
  }

  for (const column of columns) {
    expect(presentColumns.has(column), `sample.state.json should include at least one item in ${column}.`);
  }
  expect(blockedCount > 0, 'sample.state.json should include at least one blocked item.');
  expect(doneCount > 0, 'sample.state.json should include at least one done item.');
  expect(reservedCount > 0, 'sample.state.json should include at least one reserved item.');
  expect(dependencyCount > 0, 'sample.state.json should include at least one dependency link.');
  expect(openRiskCount > 0, 'sample.state.json should include at least one non-None riskLevel.');
  expect(roadmapPlanningCount > 0, 'sample.state.json should include at least one future roadmapStage.');
  expect(decisionCount > 0, 'sample.state.json should include at least one non-None decisionStatus.');
  expect(presentDomains.size >= 4, 'sample.state.json should include at least four project domains.');

  const sprintBoard = state.sprintBoard || {};
  for (const field of ['lastRoundLabel', 'lastRoundSummary', 'currentRound', 'currentRoundGoal', 'nextRound', 'nextRoundGoal']) {
    expect(isNonEmptyString(sprintBoard[field]), `sprintBoard.${field} must be a non-empty string.`);
  }

  const sampleText = JSON.stringify(state).toLowerCase();
  for (const phrase of sampleDenylist) {
    expect(!sampleText.includes(phrase), `sample.state.json contains private or secret-like phrase: ${phrase}`);
  }
}

function verifyGitIgnore() {
  const gitignore = readText('.gitignore');
  for (const pattern of ignoredPatterns) {
    expect(gitignore.split(/\r?\n/).includes(pattern), `.gitignore should include ${pattern}.`);
  }

  const trackedFiles = gitTrackedFiles();
  if (trackedFiles) {
    const tracked = new Set(trackedFiles);
    for (const file of localOnlyFiles) {
      const normalized = file.replace(/\/$/, '');
      expect(!tracked.has(normalized), `${file} should not be tracked.`);
    }
  }
}

function verifyReleaseAssets() {
  const screenshotPath = path.join(root, 'assets', 'screenshots', 'board-overview.png');
  expect(fs.existsSync(screenshotPath), 'README screenshot is missing: assets/screenshots/board-overview.png');
  if (fs.existsSync(screenshotPath)) {
    expect(fs.statSync(screenshotPath).size > 50000, 'README screenshot looks too small to be a useful app screenshot.');
  }
  expect(fs.existsSync(path.join(root, 'docs', 'RELEASE.md')), 'docs/RELEASE.md is missing.');
  expect(fs.existsSync(path.join(root, 'docs', 'PUBLISHING.md')), 'docs/PUBLISHING.md is missing.');
  expect(fs.existsSync(path.join(root, 'docs', 'TEMPLATE_USE.md')), 'docs/TEMPLATE_USE.md is missing.');
  expect(fs.existsSync(path.join(root, 'docs', 'ROADMAP.md')), 'docs/ROADMAP.md is missing.');
  expect(fs.existsSync(path.join(root, 'CODE_OF_CONDUCT.md')), 'CODE_OF_CONDUCT.md is missing.');
  expect(fs.existsSync(path.join(root, 'SUPPORT.md')), 'SUPPORT.md is missing.');
  expect(fs.existsSync(path.join(root, '.gitattributes')), '.gitattributes is missing.');
  expect(fs.existsSync(path.join(root, '.editorconfig')), '.editorconfig is missing.');
  const dependabotPath = path.join(root, '.github', 'dependabot.yml');
  expect(fs.existsSync(dependabotPath), '.github/dependabot.yml is missing.');
  if (fs.existsSync(dependabotPath)) {
    const dependabot = readText('.github/dependabot.yml');
    expect(dependabot.includes('package-ecosystem: "npm"'), 'Dependabot should check npm dependencies.');
    expect(dependabot.includes('package-ecosystem: "github-actions"'), 'Dependabot should check GitHub Actions.');
  }
  const readme = readText('README.md');
  expect(readme.includes('assets/screenshots/board-overview.png'), 'README should include the board overview screenshot.');
  expect(readme.includes('github.com/Th3Sp00kyM8/agent-board/actions/workflows/ci.yml'), 'README should include the public CI badge/link.');
  expect(readme.includes('git clone https://github.com/Th3Sp00kyM8/agent-board.git'), 'README Quick Start should include the public clone URL.');
  expect(readme.includes('docs/RELEASE.md'), 'README should link to docs/RELEASE.md.');
  expect(readme.includes('docs/PUBLISHING.md'), 'README should link to docs/PUBLISHING.md.');
  expect(readme.includes('docs/TEMPLATE_USE.md'), 'README should link to docs/TEMPLATE_USE.md.');
  expect(readme.includes('docs/ROADMAP.md'), 'README should link to docs/ROADMAP.md.');
  expect(readme.includes('Templates'), 'README should document the Templates feature.');
  expect(readme.includes('software project'), 'README should document template presets.');
  expect(readme.includes('Start Here checklist'), 'README should document the Start Here onboarding checklist.');
  expect(readme.includes('essentials-first item editor'), 'README should document the simplified editor.');
  expect(readme.includes('undo snackbar'), 'README should document undo affordances.');
  expect(readme.includes('Command palette'), 'README should document the command palette.');
  expect(readme.includes('Keyboard Workflow'), 'README should document keyboard workflow.');
  expect(readme.includes('Alt+Arrow'), 'README should document keyboard card movement.');
  expect(readme.includes('Recent commands'), 'README should document command recents.');
  expect(readme.includes('shortcut can be changed'), 'README should document configurable shortcut preference.');
  expect(readme.includes('import preview'), 'README should document import preview.');
  expect(readme.includes('fuzzy-ranked'), 'README should document fuzzy-ranked command search.');
  expect(readme.includes('dry-run validation'), 'README should document import dry-run validation.');
  expect(readme.includes('arrow keys to move focus'), 'README should document keyboard focus navigation.');
  expect(readme.includes('keyboard-selected'), 'README should document keyboard-selected command results.');
  expect(readme.includes('Import field mapping'), 'README should document import field mapping.');
  expect(readme.includes('domain, owner, and roadmap filters'), 'README should document Project Map filters.');
  expect(readme.includes('markdown export presets'), 'README should document markdown export presets.');
  expect(readme.includes('save common map views'), 'README should document saved Project Map views.');
  expect(readme.includes('import field aliases'), 'README should document configurable import aliases.');
  expect(readme.includes('downloaded as a `.md` file'), 'README should document markdown download support.');
  expect(readme.includes('GitHub Issues, Jira, and Linear'), 'README should document import alias presets.');
  expect(readme.includes('grouped, renamed, reordered, deleted, copied, downloaded, or imported'), 'README should document saved map view grouping and sharing.');
  expect(readme.includes('stakeholder summary, weekly update, release review'), 'README should document expanded export presets.');
  expect(readme.includes('warning shows the expected values'), 'README should document alias-mapped validation hints.');
  expect(readme.includes('support review, audit prep, planning summary, or custom template'), 'README should document support, audit, planning, and custom export presets.');
  expect(readme.includes('grouped, shareable'), 'README should document grouped shareable Project Map presets.');
  expect(readme.includes('fix suggestions'), 'README should document import remediation suggestions.');
  expect(readme.includes('custom markdown export presets'), 'README should document custom markdown export presets.');
  expect(readme.includes('form-based custom export preset builder'), 'README should document the custom export preset form builder.');
  expect(readme.includes('searchable starter gallery'), 'README should document the searchable export preset starter gallery.');
  expect(readme.includes('category filters'), 'README should document starter export preset categories.');
  expect(readme.includes('favorites, last-used sorting'), 'README should document starter export preset favorite and recency sorting.');
  expect(readme.includes('searched, filtered by category'), 'README should document starter export preset search and filtering.');
  expect(readme.includes('favorited for faster access, sorted by recent use'), 'README should document starter export preset favorite and recent-use workflow.');
  expect(readme.includes('preview examples'), 'README should document starter export preset previews.');
  expect(readme.includes('rendered example before it is added'), 'README should document starter export preview-before-add behavior.');
  expect(readme.includes('executive status, release readiness, risk watch, decision review, and planning intake'), 'README should document starter export preset examples.');
  expect(readme.includes('copying, and downloading reusable markdown templates'), 'README should document custom export preset sharing.');
  expect(readme.includes('{{project}}'), 'README should document custom export template tokens.');
  expect(readme.includes('repaired from the preview'), 'README should document import preview repair actions.');
  expect(readme.includes('replacement diff'), 'README should document the import replacement diff.');
  expect(readme.includes('field-level changes'), 'README should document field-level import diff details.');
  expect(readme.includes('searched by path, title, owner, or value'), 'README should document import diff search filters.');
  expect(readme.includes('filtered by changed field'), 'README should document import diff changed-field filters.');
  expect(readme.includes('shown/total counts'), 'README should document import diff shown/total counts.');
  expect(readme.includes('repair preview with before/after values'), 'README should document repair preview values.');
  expect(readme.includes('repair history and can be undone before replacement'), 'README should document import repair undo history.');
  expect(readme.includes('custom export preset bundles'), 'README should document importing custom export preset bundles.');
  expect(readme.includes('missing owners, unknown domains, unknown roadmap stages'), 'README should document owner/domain/roadmap import validation.');
  expect(readme.includes('imported as shared view bundles'), 'README should document importing Project Map view bundles.');
  expect(readme.includes('Focus Dashboard'), 'README should document the Focus Dashboard feature.');
  expect(readme.includes('Project Map'), 'README should document the Project Map feature.');
  expect(readme.includes('schemaVersion'), 'README should document board schema metadata.');
  expect(readme.includes('CODE_OF_CONDUCT.md'), 'README should link to CODE_OF_CONDUCT.md.');
  expect(readme.includes('SUPPORT.md'), 'README should link to SUPPORT.md.');
}

verifyPackage();
verifyConfig();
verifySampleState();
verifyGitIgnore();
verifyReleaseAssets();

if (errors.length > 0) {
  console.error(`Verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Agent Board verification passed.');
