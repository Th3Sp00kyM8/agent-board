import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const root = path.dirname(path.dirname(__filename));

const columns = ['To Do', 'Doing', 'In Review', 'Blocked', 'Done'];
const severities = ['Critical', 'High', 'Medium', 'Low'];
const sizes = ['S', 'M', 'L', 'XL'];
const tiers = ['core_release', 'post_release', 'future_content'];
const requiredItemFields = [
  'id', 'path', 'title', 'description', 'column', 'severity', 'size', 'source',
  'releaseTier', 'candidateRound', 'actualRound', 'reserved', 'notes',
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
    return execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
      .split(/\r?\n/)
      .filter(Boolean)
      .map((file) => file.replace(/\\/g, '/'));
  } catch (error) {
    fail(`Could not inspect tracked files with git ls-files: ${error.message}`);
    return [];
  }
}

function verifyPackage() {
  const pkg = readJson('package.json');
  if (!pkg) return;
  expect(pkg.name === 'agent-board', 'package.json name should be agent-board.');
  expect(pkg.license === 'MIT', 'package.json should declare the MIT license.');
  expect(pkg.type === 'module', 'package.json should use ESM via type=module.');
  expect(isNonEmptyString(pkg.description), 'package.json should include a description.');
  expect(pkg.engines && isNonEmptyString(pkg.engines.node), 'package.json should declare a Node engine.');
  for (const scriptName of ['dev', 'build', 'preview', 'reset:sample', 'verify']) {
    expect(pkg.scripts && isNonEmptyString(pkg.scripts[scriptName]), `package.json is missing script: ${scriptName}`);
  }
}

function verifyConfig() {
  const config = readJson('config.example.json');
  if (!config) return;
  expect(isNonEmptyString(config.projectName), 'config.example.json projectName must be a non-empty string.');
  expect(config.labels && isNonEmptyString(config.labels.workstream), 'config.example.json labels.workstream must be a non-empty string.');
  expect(config.labels && isNonEmptyString(config.labels.cycle), 'config.example.json labels.cycle must be a non-empty string.');
}

function verifySampleState() {
  const state = readJson('sample.state.json');
  if (!state) return;

  expect(Array.isArray(state.items), 'sample.state.json items must be an array.');
  expect(state.sprintBoard && typeof state.sprintBoard === 'object', 'sample.state.json must include sprintBoard.');
  if (!Array.isArray(state.items)) return;

  expect(state.items.length >= 5, 'sample.state.json should include at least five demo items.');
  const ids = new Set();
  const presentColumns = new Set();
  let blockedCount = 0;
  let doneCount = 0;
  let reservedCount = 0;

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
    expect(isNullableString(item.candidateRound), `${label} candidateRound must be a string or null.`);
    expect(isNullableString(item.actualRound), `${label} actualRound must be a string or null.`);
    expect(typeof item.reserved === 'boolean', `${label} reserved must be a boolean.`);
    expect(typeof item.notes === 'string', `${label} notes must be a string.`);
    expect(isIsoDate(item.createdAt), `${label} createdAt must be parseable ISO-like text.`);
    expect(isIsoDate(item.updatedAt), `${label} updatedAt must be parseable ISO-like text.`);
    expect(isIsoDate(item.columnEnteredAt), `${label} columnEnteredAt must be parseable ISO-like text.`);

    presentColumns.add(item.column);
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

  const tracked = new Set(gitTrackedFiles());
  for (const file of localOnlyFiles) {
    const normalized = file.replace(/\/$/, '');
    expect(!tracked.has(normalized), `${file} should not be tracked.`);
  }
}

verifyPackage();
verifyConfig();
verifySampleState();
verifyGitIgnore();

if (errors.length > 0) {
  console.error(`Verification failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Agent Board verification passed.');