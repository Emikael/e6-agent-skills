#!/usr/bin/env node
/**
 * Build the Claude plugin directory edition: the skills, agents, commands, and
 * references with no hooks and no scripts. The directory treats the folder that
 * holds .claude-plugin/plugin.json as the plugin and accepts hooks and files
 * other than Markdown, text, JSON, YAML, and images only from Verified
 * organizations, so the repository root cannot be submitted as-is.
 *
 * The edition is committed to claude-directory/ on main, the folder the
 * directory listing tracks. With no --out it rebuilds that folder; --check
 * fails when the folder no longer matches its sources.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { mapLinks, brokenLinks, listFiles, isInside, toPosix, splitTarget, isLocalTarget } = require('./build-portable-skills.js');

const DEFAULT_REPO_URL = 'https://github.com/Emikael/e6-agent-skills/blob/main';
const EDITION_DIR = 'claude-directory';
const USAGE = `Usage: node scripts/build-directory-plugin.js [--out <directory>] [--check] [--pack <pack-root>] [--force] [--repo-url <url>]
  --out defaults to <pack-root>/${EDITION_DIR}, which is rebuilt in place.
  --check builds to a temporary folder and fails if --out differs from it.`;

// Source directory → edition directory. Commands move to the default commands/ location.
const COMPONENT_DIRS = [['skills', 'skills'], ['agents', 'agents'], ['references', 'references'], ['.claude/commands', 'commands']];
const README_SOURCE = 'docs/claude-directory-readme.md';
// Component paths resolve to the default folders, so the manifest carries metadata only.
const MANIFEST_KEYS = ['name', 'version', 'description', 'author', 'homepage', 'repository', 'license', 'keywords'];

const TEXT_EXTENSIONS = new Set(['.md', '.txt', '.json', '.yaml', '.yml']);
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp']);
const TEXT_NAMES = new Set(['LICENSE', '.gitignore']);
const READ_ONLY_TOOLS = new Set(['Read', 'Grep', 'Glob', 'LS']);
const FORBIDDEN_DIRS = ['hooks', 'bin', 'workflows'];
// Refused anywhere in the tree: config files Claude Code would load, and package manifests.
const FORBIDDEN_FILES = ['.mcp.json', '.lsp.json', 'hooks.json', 'monitors.json', 'package.json', 'CLAUDE.md', 'CLAUDE.local.md'];
const MAX_FILES = 512;
const MAX_FILE_BYTES = 256 * 1024;
const MIN_README_WORDS = 40;

function parseArgs(args) {
  const options = { pack: path.resolve(__dirname, '..'), force: false, check: false, repoUrl: DEFAULT_REPO_URL };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') return { help: true };
    if (arg === '--force') options.force = true;
    else if (arg === '--check') options.check = true;
    else if (['--out', '--pack', '--repo-url'].includes(arg)) {
      const value = args[++i];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      if (arg === '--out') options.out = path.resolve(value);
      if (arg === '--pack') options.pack = path.resolve(value);
      if (arg === '--repo-url') options.repoUrl = value.replace(/\/+$/, '');
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  if (!options.out) options.out = path.join(options.pack, EDITION_DIR);
  return options;
}

/** True for the pack's own committed edition folder, which is always safe to replace. */
function isEditionDir(out, pack) {
  return path.relative(path.join(pack, EDITION_DIR), out) === '';
}

function frontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? match[1] : '';
}

function toolsBeyondReadOnly(text) {
  const lines = frontmatter(text).split(/\r?\n/);
  const start = lines.findIndex(line => /^allowed-tools:/.test(line));
  if (start === -1) return [];
  const values = [lines[start].replace(/^allowed-tools:/, '')];
  for (let i = start + 1; i < lines.length && /^\s+-\s/.test(lines[i]); i++) values.push(lines[i].replace(/^\s+-\s/, ''));
  return values.join(',').replace(/[[\]"']/g, '').split(',').map(tool => tool.trim()).filter(tool => tool && !READ_ONLY_TOOLS.has(tool));
}

function wordsOutsideCode(text) {
  let fenced = false;
  return text.split('\n').filter(line => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced;
      return false;
    }
    return !fenced;
  }).join(' ').split(/\s+/).filter(Boolean).length;
}

/** Every directory rule this edition must meet; returns one line per violation. */
function policyViolations(dir) {
  const violations = [];
  const gitDir = path.join(dir, '.git');
  const files = listFiles(dir).filter(file => file !== gitDir && !isInside(file, gitDir));
  if (files.length > MAX_FILES) violations.push(`${files.length} files; the directory holds plugins over ${MAX_FILES} for a reviewer`);

  for (const file of files) {
    const relative = toPosix(path.relative(dir, file));
    const report = message => violations.push(`${relative}: ${message}`);
    const extension = path.extname(file).toLowerCase();
    const parts = relative.split('/');

    if (FORBIDDEN_DIRS.includes(parts[0])) report(`${parts[0] === 'hooks' ? 'hooks are' : `${parts[0]}/ is`} not allowed`);
    if (FORBIDDEN_FILES.includes(path.basename(file))) report('not allowed in the directory edition');
    if (relative.startsWith('.claude/')) report('.claude/ folders are not allowed');
    if (parts.includes('.claude-plugin') && (parts.length !== 2 || parts[0] !== '.claude-plugin' || !(parts[1] === 'plugin.json' || IMAGE_EXTENSIONS.has(extension)))) {
      report('.claude-plugin may hold only plugin.json and images');
    }
    if (IMAGE_EXTENSIONS.has(extension)) continue;
    if (!TEXT_EXTENSIONS.has(extension) && !TEXT_NAMES.has(path.basename(file))) {
      report('file type not allowed (Markdown, text, JSON, YAML, or PNG/JPEG/GIF/WebP only)');
      continue;
    }

    const buffer = fs.readFileSync(file);
    if (buffer.length > MAX_FILE_BYTES) report('larger than 256 KiB');
    let text;
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
      text = null;
    }
    if (text === null || text.includes('\0')) {
      report('not UTF-8 text');
      continue;
    }
    if (text.startsWith('#!')) report('starts with #!');
    if (extension !== '.md') continue;
    const tools = toolsBeyondReadOnly(text);
    if (tools.length) report(`allowed-tools beyond Read/Grep/Glob/LS (${tools.join(', ')})`);
    if (/^hooks:/m.test(frontmatter(text))) report('hooks in front matter are not allowed');
    // Deliberately wider than Claude Code's own matcher: the directory's check is not public.
    if (/!`[^`\n]+`/.test(text)) report('inline shell (!`command`) is not allowed');
  }

  const manifestFile = path.join(dir, '.claude-plugin', 'plugin.json');
  if (!fs.existsSync(manifestFile)) {
    violations.push('.claude-plugin/plugin.json: missing');
  } else {
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    for (const key of Object.keys(manifest)) if (!MANIFEST_KEYS.includes(key)) violations.push(`.claude-plugin/plugin.json: "${key}" is not allowed`);
    for (const key of ['name', 'version', 'description']) if (!manifest[key]) violations.push(`.claude-plugin/plugin.json: "${key}" is missing`);
    if (!manifest.license && !fs.existsSync(path.join(dir, 'LICENSE'))) violations.push('LICENSE: missing');
  }

  const readme = path.join(dir, 'README.md');
  if (!fs.existsSync(readme)) violations.push('README.md: missing');
  else if (wordsOutsideCode(fs.readFileSync(readme, 'utf8')) < MIN_README_WORDS) violations.push(`README.md: fewer than ${MIN_README_WORDS} words outside code blocks`);
  return violations;
}

function prepareOut(out, force) {
  fs.mkdirSync(out, { recursive: true });
  const entries = fs.readdirSync(out).filter(name => name !== '.git');
  if (!entries.length) return;
  if (!force) throw new Error(`Output is not empty: ${out} (use --force to replace it)`);
  for (const name of entries) fs.rmSync(path.join(out, name), { recursive: true, force: true });
}

function build(options) {
  const { pack, out, repoUrl } = options;
  const inPlace = isEditionDir(out, pack);
  if (isInside(out, pack) && !inPlace && !toPosix(path.relative(pack, out)).startsWith('dist/')) {
    throw new Error(`--out must be outside the pack, its ${EDITION_DIR}/ folder, or under its dist/ directory.`);
  }
  prepareOut(out, options.force || inPlace);

  // Output file → source file, so relative links resolve against where they were written.
  const sources = new Map();
  for (const [from, to] of COMPONENT_DIRS) {
    const sourceDir = path.join(pack, from);
    if (!fs.existsSync(sourceDir)) continue;
    for (const file of listFiles(sourceDir)) {
      if (path.basename(file) === '.DS_Store') continue;
      sources.set(path.join(out, to, path.relative(sourceDir, file)), file);
    }
  }
  sources.set(path.join(out, 'README.md'), path.join(pack, README_SOURCE));
  for (const file of ['LICENSE', '.claude-plugin/icon.png']) {
    if (fs.existsSync(path.join(pack, file))) sources.set(path.join(out, file), path.join(pack, file));
  }
  const destinations = new Map([...sources].map(([destination, source]) => [source, destination]));

  for (const [destination, source] of sources) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (!destination.endsWith('.md')) {
      fs.copyFileSync(source, destination);
      continue;
    }
    fs.writeFileSync(destination, mapLinks(fs.readFileSync(source, 'utf8'), target => {
      const [filePart, anchor] = splitTarget(target);
      if (!isLocalTarget(filePart)) return target;
      const resolved = path.resolve(path.dirname(source), decodeURI(filePart));
      if (destinations.has(resolved)) {
        return toPosix(path.relative(path.dirname(destination), destinations.get(resolved))) + anchor;
      }
      if (isInside(resolved, pack) && fs.existsSync(resolved)) return `${repoUrl}/${toPosix(path.relative(pack, resolved))}${anchor}`;
      return target;
    }));
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(pack, '.claude-plugin', 'plugin.json'), 'utf8'));
  const edition = Object.fromEntries(MANIFEST_KEYS.filter(key => key in manifest).map(key => [key, manifest[key]]));
  fs.mkdirSync(path.join(out, '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(out, '.claude-plugin', 'plugin.json'), `${JSON.stringify(edition, null, 2)}\n`);

  const problems = [...policyViolations(out), ...brokenLinks(out).map(link => `unresolved link: ${link}`)];
  if (problems.length) throw new Error(`Directory edition breaks the directory rules:\n  ${problems.join('\n  ')}`);
  return { version: edition.version, files: sources.size + 1 };
}

function editionFiles(dir) {
  if (!fs.existsSync(dir)) return new Map();
  const gitDir = path.join(dir, '.git');
  return new Map(listFiles(dir)
    .filter(file => file !== gitDir && !isInside(file, gitDir) && path.basename(file) !== '.DS_Store')
    .map(file => [toPosix(path.relative(dir, file)), file]));
}

/** Builds a fresh edition in a temporary folder; returns one line per file in --out that differs from it. */
function staleFiles(options) {
  const fresh = fs.mkdtempSync(path.join(os.tmpdir(), 'e6-directory-check-'));
  try {
    build({ ...options, out: fresh, force: true });
    const expected = editionFiles(fresh);
    const actual = editionFiles(options.out);
    const stale = [];
    for (const [relative, file] of expected) {
      if (!actual.has(relative)) stale.push(`${relative}: missing`);
      else if (!fs.readFileSync(file).equals(fs.readFileSync(actual.get(relative)))) stale.push(`${relative}: out of date`);
    }
    for (const relative of actual.keys()) if (!expected.has(relative)) stale.push(`${relative}: not generated from the sources`);
    return stale.sort();
  } finally {
    fs.rmSync(fresh, { recursive: true, force: true });
  }
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    if (options.help) {
      console.log(USAGE);
      return;
    }
    if (options.check) {
      const stale = staleFiles(options);
      if (stale.length) {
        console.error(`Directory edition in ${options.out} does not match its sources:\n  ${stale.join('\n  ')}\nRegenerate it with: node scripts/build-directory-plugin.js`);
        process.exitCode = 1;
      } else {
        console.log(`Directory edition in ${options.out} matches its sources.`);
      }
      return;
    }
    const result = build(options);
    console.log(`Built directory edition ${result.version} (${result.files} files, no hooks or scripts) in ${options.out}`);
  } catch (error) {
    console.error(`${error.message}\n${USAGE}`);
    process.exitCode = 2;
  }
}

if (require.main === module) main();

module.exports = { policyViolations, staleFiles };
